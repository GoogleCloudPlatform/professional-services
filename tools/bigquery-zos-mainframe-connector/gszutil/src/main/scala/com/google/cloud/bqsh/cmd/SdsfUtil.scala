/*
 * Copyright 2022 Google LLC All Rights Reserved
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

package com.google.cloud.bqsh.cmd

import java.io.{BufferedOutputStream, OutputStreamWriter}
import java.nio.channels.Channels
import java.nio.charset.StandardCharsets

import com.google.api.services.storage.StorageScopes
import com.google.cloud.bqsh.{ArgParser, Command, SdsfUtilConfig, SdsfUtilOptionParser}
import com.google.cloud.imf.gzos.MVS
import com.google.cloud.imf.util.{Logging, Services}
import com.google.cloud.storage.{BlobInfo, Storage}
import com.ibm.zos.sdsf.core.{ISFException,ISFStatusRunner,ISFJobDataSet,ISFStatus,
  ISFRequestSettings,ISFScrollConstants}

import scala.collection.mutable.ListBuffer

object SdsfUtil extends Command[SdsfUtilConfig] with Logging {
  override val name: String = "sdsfutil"
  override val parser: ArgParser[SdsfUtilConfig] = SdsfUtilOptionParser
  override def run(config: SdsfUtilConfig, zos: MVS, env: Map[String,String]): Result = {
    val runner = getJobs(config.jobPrefix, config.owner).runner
    val gcs = Services.storage(zos.getCredentialProvider().getCredentials.createScoped(StorageScopes.DEVSTORAGE_READ_WRITE))
    try {
      for (job <- runner.jobs()) {
        Console.out.println("job status:\n" + job)
        for (dataset <- job.dataSets) {
          Console.out.println("dataset:\n" + dataset)
          save(gcs, config, job, dataset)
        }
      }
      Result.Success
    } catch {
      case e: ISFException =>
        val sb = new StringBuilder
        sb.append("ISFException thrown\n")
        sb.append("SDSF Messages:\n")
        runner.messages.foreach{x =>
          sb.append(x)
          sb.append("\n")
        }
        val msg = sb.result
        logger.error(msg, e)
        Result.Failure(msg)
    }
  }

  /** Generates object name with format
    * PREFIX/JOBNAME/JOBID/STEPNAME_DDNAME
    */
  def objName(prefix: String, job: EnhancedStatus, dataset: EnhancedDataSet): String = {
    s"$prefix/${job.jobName}/${job.jobId}/${dataset.stepName}_${dataset.ddName}"
  }

  /** Write dataset lines to Cloud Storage */
  def save(gcs: Storage,
           config: SdsfUtilConfig,
           job: EnhancedStatus,
           dataset: EnhancedDataSet): Unit = {
    val name = objName(config.objPrefix, job, dataset)
    logger.info(s"writing to gs://${config.bucket}/$name")
    val blob = gcs.create(BlobInfo.newBuilder(config.bucket,name)
      .setContentType("text/plain").build())

    val writer = new OutputStreamWriter(new BufferedOutputStream(
      Channels.newOutputStream(blob.writer()), 256*1024), StandardCharsets.UTF_8)
    for (line <- dataset.lines) {
      writer.write(line)
      writer.write("\n")
    }
    writer.close()
  }

  class EnhancedRunner(runner: ISFStatusRunner) {
    import scala.jdk.CollectionConverters.ListHasAsScala
    def jobs(): List[EnhancedStatus] =
      runner.exec.asScala.toList.map{x => new EnhancedStatus(x)}

    def messages: Option[String] = {
      val msgs = runner.getRequestResults.getMessageList.asScala
      if (msgs.nonEmpty) Option(msgs.mkString("\n"))
      else None
    }

    override def toString: String = {
      "ISFStatusRunner(\n" + runner.toVerboseString + "\n)"
    }
  }

  class EnhancedDataSet(dataSet: ISFJobDataSet) {
    def ddName: String = dataSet.getDDName
    def dsName: String = dataSet.getDSName
    def stepName: String = dataSet.getValue("stepn")
    def procStep: String = dataSet.getValue("procs")

    override def toString: String = {
      "ISFJobDataSet(\n" + dataSet.toVerboseString + "\n)"
    }

    def lines: List[String] = {
      dataSet.browse
      getStringLines()
    }

    def jcl: String = {
      dataSet.browseJCL()
      getStringLines().mkString("\n")
    }

    private def getStringLines(): List[String] = {
      val buf = ListBuffer.empty[String]
      val settings = dataSet.getRunner.getRequestSettings
      val results = dataSet.getRunner.getRequestResults
      val lineResults = results.getLineResults

      import scala.jdk.CollectionConverters.ListHasAsScala
      buf.appendAll(results.getResponseList.asScala)

      settings.addISFScrollType(ISFScrollConstants.Options.DOWN)

      var token: String = lineResults.getNextLineToken
      while (token != null) {
        settings.addISFStartLineToken(token)
        dataSet.browse
        buf.appendAll(results.getResponseList.asScala)
        token = lineResults.getNextLineToken
      }
      settings.removeISFStartLineToken()
      buf.result()
    }
  }

  class EnhancedStatus(job: ISFStatus) {
    def jobName: String = job.getJName
    def jobId: String = job.getJobID
    def dataSets: List[EnhancedDataSet] = {
      import scala.jdk.CollectionConverters.ListHasAsScala
      job.getJobDataSets.asScala.toList
        .map { x => new EnhancedDataSet(x) }
    }

    override def toString: String = {
      "ISFStatus(\n" + job.toVerboseString + "\n)"
    }
  }

  class EnhancedSettings(settings: ISFRequestSettings) {
    def pre(prefix: String): EnhancedSettings = {
      settings.addISFPrefix(prefix)
      this
    }

    def own(owner: String): EnhancedSettings = {
      settings.addISFOwner(owner)
      this
    }

    def noModify: EnhancedSettings = {
      settings.addNoModify()
      this
    }

    def cols(cols: String): EnhancedSettings = {
      settings.addISFCols(cols)
      this
    }

    def sort(sortExpr: String): EnhancedSettings = {
      settings.addISFSort(sortExpr)
      this
    }

    def runner: EnhancedRunner = new EnhancedRunner(new ISFStatusRunner(settings))

    override def toString: String = {
      "ISFRequestSettings(\n" + settings.toSettingsString + "\n)"
    }
  }

  def getJobs(pre: String, owner: String): EnhancedSettings = {
    new EnhancedSettings(new ISFRequestSettings)
      .pre(pre)
      .own(owner)
      .cols("jname jobid ownerid jprio queue")
      .sort("jname a jobid a")
      .noModify
  }
}
