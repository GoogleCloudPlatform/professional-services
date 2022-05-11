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

package com.google.cloud.gszutil.io.exports

import com.google.cloud.bigquery._
import com.google.cloud.bqsh.BQ.resolveDataset
import com.google.cloud.bqsh.cmd.Result
import com.google.cloud.bqsh.{BQ, ExportConfig}
import com.google.cloud.imf.gzos.pb.GRecvProto
import com.google.cloud.imf.util.Logging

abstract class NativeExporter(bq: BigQuery,
                              cfg: ExportConfig,
                              jobInfo: GRecvProto.ZOSJobInfo) extends Logging {

  def close(): Unit
  def exportData(job: Job): Result

  def doExport(query: String): Result = {
    val configuration = configureExportQueryJob(query, cfg)
    val jobId = getJobId()
    val job = submitExportJob(bq, configuration, jobId, cfg)
    try {
      exportData(job)
    } finally {
      close()
    }
  }

  def configureExportQueryJob(query: String, cfg: ExportConfig): QueryJobConfiguration = {
    val b = QueryJobConfiguration.newBuilder(query)
      .setDryRun(cfg.dryRun)
      .setUseLegacySql(cfg.useLegacySql)
      .setUseQueryCache(cfg.useCache)
      .setAllowLargeResults(cfg.allowLargeResults)

    if (cfg.datasetId.nonEmpty)
      b.setDefaultDataset(resolveDataset(cfg.datasetId, cfg.projectId))

    if (cfg.maximumBytesBilled > 0)
      b.setMaximumBytesBilled(cfg.maximumBytesBilled)

    if (cfg.batch)
      b.setPriority(QueryJobConfiguration.Priority.BATCH)

    if(cfg.allowLargeResults) {
      if(cfg.destinationTable.nonEmpty && cfg.datasetId.nonEmpty) {
        val destinationTable = BQ.resolveTableSpec(cfg.destinationTable, cfg.projectId, cfg.datasetId)
        b.setDestinationTable(destinationTable)
        b.setCreateDisposition(JobInfo.CreateDisposition.CREATE_IF_NEEDED)
      } else {
        logger.warn(s"AllowLargeResults flag is provided, but cannot get dataset or destination table. " +
          s"destTable=${cfg.destinationTable}, dataset=${cfg.datasetId}. AllowLargeResults ignored!")
      }
    }

    b.setWriteDisposition(JobInfo.WriteDisposition.WRITE_TRUNCATE)

    b.build()
  }

  def getJobId(): JobId =
    BQ.genJobId(cfg.projectId, cfg.location, jobInfo, "query")

  def submitExportJob(bq: BigQuery, jobConfiguration: QueryJobConfiguration, jobId: JobId, cfg: ExportConfig): Job = {
    try {
      logger.info(s"Submitting QueryJob.\njobId=${BQ.toStr(jobId)}")
      val job = BQ.runJob(bq, jobConfiguration, jobId, cfg.timeoutMinutes * 60, sync = true)
      logger.info(s"QueryJob finished.")

      // check for errors
      BQ.getStatus(job) match {
        case Some(status) =>
          if (status.hasError) {
            val msg = s"Error:\n${status.error}\nExecutionErrors: ${status.executionErrors.mkString("\n")}"
            logger.error(msg)
          }
          logger.info(s"Job Status = ${status.state}")
          BQ.throwOnError(job, status)
          job
        case _ =>
          val msg = s"Job ${BQ.toStr(jobId)} not found"
          logger.error(msg)
          throw new RuntimeException(msg)
      }
    }
  }
}
