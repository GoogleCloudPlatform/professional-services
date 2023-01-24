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

import com.google.cloud.bigquery.JobStatistics.QueryStatistics
import com.google.cloud.bigquery.{BigQuery, BigQueryException, ExtractJobConfiguration, JobInfo, QueryJobConfiguration, TableId}
import com.google.cloud.bqsh.{ArgParser, BQ, Command, ExtractConfig, ExtractOptionParser, QueryConfig}
import com.google.cloud.imf.gzos.{MVS, Util}
import com.google.cloud.imf.util.{Logging, Services, StatsUtil}

/** BigQuery Extract command
  * Creates an Extract Job to write a delimited file directly to Cloud Storage
  * User must specify either a SQL query or a tablespec.
  */
object Extract extends Command[ExtractConfig] with Logging {
  override val name: String = "bq extract"
  override val parser: ArgParser[ExtractConfig] = ExtractOptionParser

  override def run(cfg: ExtractConfig, zos: MVS, env: Map[String, String]): Result = {
    val creds = zos.getCredentialProvider().getCredentials
    logger.info(s"Starting $name\n$cfg")
    val bq: BigQuery = Services.bigQuery(cfg.projectId, cfg.location, creds)

    try {
      if (cfg.sourceTable.nonEmpty) {
        // Extract contents of a table
        val table: TableId = BQ.resolveTableSpec(cfg.sourceTable, cfg.projectId, cfg.datasetId)
        logger.info(s"Submitting BigQuery Extract job for source table: $table")
        extract(table, bq, cfg, zos)
      } else {
        // Extract results of a SQL query
        val query =
          if (cfg.sql.nonEmpty) cfg.sql
          else {
            cfg.dsn match {
              case Some(dsn) =>
                logger.info(s"Reading query from DSN: $dsn")
                zos.readDSNLines(dsn).mkString("\n")
              case None =>
                logger.info("Reading query from DD: QUERY")
                zos.readDDString("QUERY", "\n")
            }
          }
        logger.info(s"SQL Query:\n$query")
        if (query.isEmpty) {
          val msg = "Empty extract query"
          logger.error(msg)
          return Result.Failure(msg)
        }

        val queryConfig = QueryConfig(sql = query, queryDSN = cfg.queryDSN, timeoutMinutes = cfg.timeoutMinutes,
          allowLargeResults = cfg.allowLargeResults, destinationTable = cfg.destinationTable, dryRun = cfg.dryRun,
          maximumBytesBilled = cfg.maximumBytesBilled, requireCache = cfg.requireCache, useCache = cfg.useCache,
          useLegacySql = cfg.useLegacySql, projectId = cfg.projectId, datasetId = cfg.datasetId,
          location = cfg.location, debugMode = cfg.debugMode, batch = cfg.batch, sync = true,
          jobProperties = cfg.jobProperties, replace = cfg.replace)
        val (jobId, job) = BqQueryJobExecutor(bq, queryConfig, zos).execute(query, Query.configureQueryJob)
        val table = job.getConfiguration[QueryJobConfiguration].getDestinationTable
        val stats = job.getStatistics[QueryStatistics]
        logger.info(s"Submitting BigQuery Extract job for SQL query")
        extract(table, bq, cfg, zos)
      }
    } catch {
      case e: Throwable =>
        val msg = "Extract failed: " + e.getMessage + "\n"
        logger.error(msg, e)
        Result.Failure(msg)
    }
  }

  def extract(table: TableId, bq: BigQuery, cfg: ExtractConfig, zos: MVS): Result = {
    val extractConfig = ExtractJobConfiguration.newBuilder(table, cfg.destinationUri)
    if (cfg.delimiter.nonEmpty)
      extractConfig.setFieldDelimiter(cfg.delimiter)

    if (cfg.compress)
      extractConfig.setCompression("GZIP")

    if (cfg.format.nonEmpty)
      extractConfig.setFormat(cfg.format)

    if (cfg.timeoutMinutes > 0)
      extractConfig.setJobTimeoutMs(cfg.timeoutMinutes * 60L * 1000L)

    val jobId = BQ.genJobId(cfg.projectId, cfg.location, zos.getInfo, "extract")
    val rowCount = BQ.rowCount(bq, table)
    try {
      val startTime = System.currentTimeMillis()
      val job = bq.create(JobInfo.of(jobId, extractConfig.build()))
      if (cfg.sync) {
        logger.info(s"Waiting for Job jobid=${BQ.toStr(jobId)}")
        BQ.waitForJob(bq, jobId, timeoutMillis = cfg.timeoutMinutes * 60L * 1000L)
        logger.info(s"Extract completed, extracted=${rowCount} rows, " +
          s"time took: ${(System.currentTimeMillis() - startTime) / 1000} seconds.")
      } else {
        logger.info(s"Returning without waiting for job to complete because sync=false jobid=${BQ.toStr(jobId)}")
        job
      }

      try {
        // Publish results
        if (cfg.statsTable.nonEmpty) {
          val statsTable = BQ.resolveTableSpec(cfg.statsTable, cfg.projectId, cfg.datasetId)
          val jobId = BQ.genJobId(cfg.projectId, cfg.location, zos.getInfo, "extract")
          val tblspec = s"${statsTable.getProject}:${statsTable.getDataset}.${statsTable.getTable}"
          logger.debug(s"Writing stats to $tblspec, with jobId ${jobId}")
          StatsUtil.retryableInsertJobStats(zos, jobId, bq, statsTable, jobType = "export", recordsOut = rowCount)
        }
      } catch {
        case e: Throwable =>
          logger.warn(s"Failed to write stats for $jobId")
      }

      Result(activityCount = rowCount)
    } catch {
      case e: BigQueryException =>
        if (e.getReason == "duplicate" && e.getMessage.startsWith("Already Exists: Job")) {
          logger.warn(s"Job already exists, waiting for completion.\njobid=${BQ.toStr(jobId)}")
          BQ.waitForJob(bq, jobId, timeoutMillis = cfg.timeoutMinutes * 60L)
          Result(activityCount = rowCount)
        } else {
          logger.error(s"BQ API call failed for:$jobId\n$cfg\n$e")
          Result.Failure(msg = e.getMessage)
        }
    }
  }
}
