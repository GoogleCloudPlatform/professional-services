/*
 * Copyright 2019 Google LLC All Rights Reserved.
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

package com.google.cloud.bqsh

import com.google.api.gax.retrying.RetrySettings
import com.google.api.gax.rpc.FixedHeaderProvider
import com.google.auth.Credentials
import com.google.cloud.RetryOption
import com.google.cloud.bigquery.{BigQuery,BigQueryError,BigQueryException,BigQueryOptions,DatasetId,Field,FieldList,JobInfo,Job,JobId,JobStatus,QueryJobConfiguration,Schema,StandardSQLTypeName,TableId}
import com.google.cloud.gszutil.CCATransportFactory
import com.google.cloud.http.HttpTransportOptions
import com.google.common.base.Preconditions
import com.google.common.collect.ImmutableList
import org.threeten.bp.Duration
import scala.collection.JavaConverters._

object BQ {
  def defaultClient(project: String, location: String, credentials: Credentials): BigQuery = {
    BigQueryOptions.newBuilder
      .setLocation(location)
      .setProjectId(project)
      .setCredentials(credentials)
      .setTransportOptions(HttpTransportOptions.newBuilder
        .setHttpTransportFactory(new CCATransportFactory)
        .build)
      .setRetrySettings(RetrySettings.newBuilder
        .setMaxAttempts(8)
        .setTotalTimeout(Duration.ofMinutes(30))
        .setInitialRetryDelay(Duration.ofSeconds(8))
        .setMaxRetryDelay(Duration.ofSeconds(32))
        .setRetryDelayMultiplier(2.0d)
        .build)
      .setHeaderProvider(FixedHeaderProvider.create("user-agent", Bqsh.UserAgent))
      .build
      .getService
  }

  def runJob(bq: BigQuery, cfg: QueryJobConfiguration, jobId: JobId, timeoutSeconds: Long, sync: Boolean): Job = {
    require(bq != null, "BigQuery must not be null")
    require(cfg != null, "QueryJobConfiguration must not be null")
    require(jobId != null, "JobId must not be null")
    try {
      val job = bq.create(JobInfo.of(jobId, cfg))
      if (sync) await(job, jobId, timeoutSeconds)
      else job
    } catch {
      case e: BigQueryException =>
        if (e.getReason == "duplicate" && e.getMessage.startsWith("Already Exists: Job")) {
          await(bq, jobId, timeoutSeconds)
        } else {
          throw new RuntimeException(e)
        }
    }
  }

  def await(bq: BigQuery, jobId: JobId, timeoutSeconds: Long): Job = {
    Preconditions.checkNotNull(jobId)
    val job = bq.getJob(jobId)
    await(job, jobId, timeoutSeconds)
  }

  def await(job: Job, jobId: JobId, timeoutSeconds: Long): Job = {
    Preconditions.checkNotNull(jobId)
    if (job == null) {
      throw new RuntimeException(s"Job ${jobId.getJob} doesn't exist")
    } else {
      job.waitFor(RetryOption.totalTimeout(Duration.ofSeconds(timeoutSeconds)))
    }
  }

  def isDone(job: Job): Boolean = {
    job.getStatus.getState == JobStatus.State.DONE
  }

  def hasError(job: Job): Boolean = {
    job.getStatus.getError != null || hasExecutionErrors(job)
  }

  def hasExecutionErrors(job: Job): Boolean = {
    val status = job.getStatus
    val errors = status.getExecutionErrors
    errors != null && errors.size() > 0
  }

  case class BQError(message: scala.Option[String],
                     reason: scala.Option[String],
                     location: scala.Option[String]) {
    override def toString: String = {
      s"BigQueryError:\nreason: ${reason.getOrElse("no reason given")}\nmessage: ${message.getOrElse("no message given")}"
    }
  }

  case class BQStatus(state: JobStatus.State,
                      error: scala.Option[BQError],
                      executionErrors: Seq[BQError]) {
    def hasError: Boolean = error.isDefined || executionErrors.nonEmpty
  }

  def getExecutionErrors(status: JobStatus): Seq[BQError] = {
    val e = status.getExecutionErrors
    if (e == null) Seq.empty
    else e.asScala.flatMap(toBQError)
  }

  def toBQError(error: BigQueryError): scala.Option[BQError] = {
    if (error == null) None
    else scala.Option(BQError(
      message = scala.Option(error.getMessage),
      reason = scala.Option(error.getReason),
      location = scala.Option(error.getLocation)
    ))
  }

  def getStatus(job: Job): scala.Option[BQStatus] = {
    val status = job.getStatus
    if (status == null) None
    else {
      scala.Option(BQStatus(
        state = status.getState,
        error = toBQError(status.getError),
        executionErrors = getExecutionErrors(status)))
    }
  }

  def throwOnError(status: BQStatus): Unit = {
    val sb = new StringBuilder
    if (status.hasError) {
      status.error.foreach { err =>
        sb.append(err.toString)
      }
      if (status.executionErrors.nonEmpty) {
        sb.append("Execution Errors:\n")
      }
      status.executionErrors.foreach { err =>
        sb.append(err.toString)
      }
      throw new RuntimeException(sb.result())
    }
  }

  def throwOnError(job: Job): Unit = {
    getStatus(job) match {
      case Some(status) =>
        throwOnError(status)
      case _ =>
        throw new RuntimeException("missing job status")
    }
  }

  /**
    *
    * @param datasetSpec [PROJECT]:[DATASET] may override project
    * @param defaultProject BigQuery billing project
    * @return
    */
  def resolveDataset(datasetSpec: String, defaultProject: String): DatasetId = {
    val i = datasetSpec.indexOf(':')
    val project = if (i > 0) datasetSpec.substring(0, i) else defaultProject
    val dataset = datasetSpec.substring(i+1)
    DatasetId.of(project, dataset)
  }

  /**
    *
    * @param tableSpec [PROJECT]:[DATASET].TABLE may override dataset and project
    * @param defaultProject BigQuery billing project
    * @param defaultDataset [PROJECT]:[DATASET] may override project
    * @return
    */
  def resolveTableSpec(tableSpec: String, defaultProject: String, defaultDataset: String): TableId = {
    val i = tableSpec.indexOf(':')
    val j = tableSpec.indexOf('.')

    val default = resolveDataset(defaultDataset, defaultProject)

    val project =
      if (i > 0) tableSpec.substring(0, i)
      else default.getProject

    val dataset =
      if (j > 0) tableSpec.substring(i+1, j)
      else default.getDataset

    val table =
      if (j > 0) tableSpec.substring(j+1, tableSpec.length)
      else tableSpec
    TableId.of(project, dataset, table)
  }

  def parseSchemaUpdateOption(schemaUpdateOption: Seq[String]): java.util.List[JobInfo.SchemaUpdateOption] = {
    val schemaUpdateOptionsBuilder = ImmutableList.builder[JobInfo.SchemaUpdateOption]()
    if (schemaUpdateOption.contains(JobInfo.SchemaUpdateOption.ALLOW_FIELD_ADDITION.name())) {
      schemaUpdateOptionsBuilder
        .add(JobInfo.SchemaUpdateOption.ALLOW_FIELD_ADDITION)
    }
    if (schemaUpdateOption.contains(JobInfo.SchemaUpdateOption.ALLOW_FIELD_RELAXATION.name())) {
      schemaUpdateOptionsBuilder
        .add(JobInfo.SchemaUpdateOption.ALLOW_FIELD_RELAXATION)
    }
    schemaUpdateOptionsBuilder.build
  }

  def parseField(s: String): Field = {
    val Array(field,dataType) = s.split(':')
    val fieldList = FieldList.of()
    val typeName = StandardSQLTypeName.valueOf(dataType)
    Field.newBuilder(field,typeName,fieldList).build
  }

  def parseSchema(s: Seq[String]): Schema = {
    Schema.of(s.map(parseField):_*)
  }

  def isValidTableName(s: String): Boolean = {
    s.matches("[a-zA-Z0-9_]{1,1024}")
  }

  def isValidBigQueryName(s: String): Boolean =
    s.matches("[a-zA-Z0-9_]{1,1024}")
}
