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

import com.google.cloud.bigquery.{BigQuery, Job, JobId, QueryJobConfiguration}
import com.google.cloud.bqsh.{BQ, Bqsh, QueryConfig}
import com.google.cloud.imf.gzos.MVS
import com.google.cloud.imf.gzos.Util._
import com.google.cloud.imf.util.Logging
import com.google.cloud.imf.util.RetryHelper._

import scala.annotation.tailrec

class BqQueryJobExecutor(bq: BigQuery, cfg: QueryConfig, zos: MVS) extends Logging {

  private lazy val retriesCount: Int =
    sys.env.get("BQ_QUERY_CONCURRENT_UPDATE_RETRY_COUNT").flatMap(_.toIntOption).getOrElse(5)
  private lazy val retriesTimeoutMillis: Int =
    sys.env.get("BQ_QUERY_CONCURRENT_UPDATE_RETRY_TIMEOUT_SECONDS").flatMap(_.toIntOption).getOrElse(2) * 1000
  private lazy val retryWhiteList: Seq[String] =
    sys.env.get("BQ_QUERY_CONCURRENT_UPDATE_WHITE_LIST").fold(Seq("TABLE_STATUS", "BATCH_PROCESS_DATE"))(_.split(","))

  def execute(script: String, queryConfigurer: (String, QueryConfig) => QueryJobConfiguration): (JobId, Job) = {
    var attempts = 0
    lazy val retryQuery = queryForRetry(script)

    @tailrec
    def run(query: String): (JobId, Job) = {
      val jobId = BQ.genJobId(cfg.projectId, cfg.location, zos, "query", generateHashString)
      logger.info(s"Submitting Query Job\njobid=${BQ.toStr(jobId)}, jobQuery=\n$query")
      val job = BQ.runJob(bq, queryConfigurer(query, cfg), jobId, cfg.timeoutMinutes * 60, cfg.sync)

      if (cfg.sync) {
        attempts += 1
        jobError(job) match {
          case Some(e: String) if !isRetryableError(e) =>
            logger.info(s"Retry not allowed! Error is not retryable, error=$e")
            (jobId, job)
          case Some(_: String) if retryQuery.isEmpty =>
            logger.info(s"Retry not allowed! Input script is not retryable.")
            (jobId, job)
          case Some(e: String) if retriesCount >= attempts =>
            val delay = calculateDelay(attempts, retriesTimeoutMillis)
            logger.info(s"Retry allowed! retryAttempt=$attempts, delay=$delay, error=$e, queryForRetry=${retryQuery.get}")
            sleepOrYield(delay)
            run(retryQuery.get)
          case _ => (jobId, job)
        }
      } else {
        (jobId, job)
      }
    }

    run(script)
  }

  private def jobError(job: Job): Option[String] =
    BQ.getStatus(job).flatMap(_.error).flatMap(_.message)

  private def isRetryableError(error: String): Boolean =
    Option(error)
      .filter(m => m.trim.toLowerCase.contains("could not serialize access to table"))
      .exists(m => retryWhiteList.exists(m.contains))

  private def queryForRetry(query: String): Option[String] = {
    val queries = Bqsh.splitSQL(query)
    if (queries.size <= 1) Some(query)
    else Option(queries.last).filter(_.trim.toUpperCase.startsWith("UPDATE"))
  }
}

object BqQueryJobExecutor {
  def apply(bq: BigQuery, cfg: QueryConfig, zos: MVS) = new BqQueryJobExecutor(bq, cfg, zos)
}
