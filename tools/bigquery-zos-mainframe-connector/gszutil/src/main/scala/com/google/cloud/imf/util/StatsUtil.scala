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

package com.google.cloud.imf.util

import com.google.cloud.bigquery.InsertAllRequest.RowToInsert

import java.text.SimpleDateFormat
import java.util.{Date, TimeZone}
import com.google.cloud.bigquery.{BigQuery, BigQueryError, InsertAllRequest, JobId, TableId}
import com.google.cloud.bqsh.BQ
import com.google.cloud.bqsh.BQ.SchemaRowBuilder
import com.google.cloud.imf.gzos.MVS
import com.google.cloud.imf.util.stats.{DeleteStats, InsertStats, JobStats, LoadStats, LogTable, MergeStats, QueryStats, SelectStats, UpdateStats}

import scala.collection.mutable.ListBuffer

object StatsUtil extends GoogleApiL2Retrier with Logging {

  override val retriesCount: Int = Services.l2RetriesCount
  override val retriesTimeoutMillis: Int = Services.l2RetriesTimeoutMillis

  private def sdf(f: String): SimpleDateFormat = {
    val simpleDateFormat = new SimpleDateFormat(f)
    simpleDateFormat.setTimeZone(TimeZone.getTimeZone("UTC"))
    simpleDateFormat
  }

  val JobDateFormat: SimpleDateFormat = sdf("yyMMdd")
  val JobTimeFormat: SimpleDateFormat = sdf("HHmmss")
  private val TimestampFormat: SimpleDateFormat = sdf("yyyy-MM-dd'T'HH:mm:ss.SSSSSS")
  private val DateFormat: SimpleDateFormat = sdf("yyyy-MM-dd")
  private val TimeFormat: SimpleDateFormat = sdf("HH:mm:ss.SSSSSS")

  def epochMillis2Timestamp(t: Long): String = TimestampFormat.format(new Date(t))
  private def jobDate2Date(jobDate: String): String = DateFormat.format(JobDateFormat.parse(jobDate))
  private def jobTime2Time(jobTime: String): String = TimeFormat.format(JobTimeFormat.parse(jobTime))


  def retryableInsertJobStats(zos: MVS, jobId: JobId,
                              bq: BigQuery, tableId: TableId, jobType: String = "", source: String = "",
                              dest: String = "", recordsIn: Long = -1, recordsOut: Long = -1): Unit = {
    runWithRetry(insertJobStats(zos, jobId, bq, tableId, jobType, source, dest, recordsIn, recordsOut), "Insert job statistic")
  }

  def insertJobStats(zos: MVS, jobId: JobId,
                     bq: BigQuery, tableId: TableId, jobType: String = "", source: String = "",
                     dest: String = "", recordsIn: Long = -1, recordsOut: Long = -1): Unit = {
    val schema = BQ.checkTableDef(bq, tableId, LogTable.schema)
    val row = SchemaRowBuilder(schema)

    row
      .put("job_name", zos.jobName)
      .put("job_date", jobDate2Date(zos.jobDate))
      .put("job_time", jobTime2Time(zos.jobTime))
      .put("timestamp", epochMillis2Timestamp(System.currentTimeMillis))
      .put("job_id", BQ.toStr(jobId))
      .put("job_type", jobType)
      .put("source", source)
      .put("destination", dest)

    if (jobType == "cp" || jobType == "gszutil" || jobType == "export") {
      if (recordsIn >= 0)
        row.put("rows_read", recordsIn)
      if (recordsOut >= 0)
        row.put("rows_written", recordsOut)
    } else {
      // any BigQuery job
      val bqApi = Services.bigQueryApi(zos.getCredentialProvider().getCredentials)
      val j = BQ.apiGetJob(bqApi, jobId)
      val sb = new StringBuilder
      JobStats.forJob(j).foreach{s => JobStats.put(s,row); sb.append(JobStats.report(s))}
      QueryStats.forJob(j).foreach{s => QueryStats.put(s,row); sb.append(QueryStats.report(s))}
      SelectStats.forJob(j).foreach{s => SelectStats.put(s,row); sb.append(SelectStats.report(s))}
      DeleteStats.forJob(j).foreach{ s => DeleteStats.put(s,row); sb.append(DeleteStats.report(s))}
      UpdateStats.forJob(j).foreach{ s => UpdateStats.put(s,row); sb.append(UpdateStats.report(s))}
      LoadStats.forJob(j).foreach{s => LoadStats.put(s,row); sb.append(LoadStats.report(s))}
      MergeStats.forJob(j).foreach { s => MergeStats.put(s, row); sb.append(MergeStats.report(s)) }
      InsertStats.forJob(j).foreach { s => InsertStats.put(s, row); sb.append(InsertStats.report(s)) }
      logger.info(s"Job Statistics:\n${sb.result}")
    }

    logger.info(s"Inserting stats into ${BQ.tableSpec(tableId)}")
    val res = row.insert(bq, tableId, BQ.toStr(jobId))
    BQ.logInsertErrors(res)
  }
  /** Convert Java List to Scala Seq */
  def l2l[T](l: java.util.List[T]): Seq[T] = {
    if (l == null) Nil
    else {
      val buf = ListBuffer.empty[T]
      l.forEach(buf.append)
      buf.toList
    }
  }

  def mv[K,V](m: java.util.Map[K,V]): Seq[V] = {
    if (m == null) Nil
    else {
      val buf = ListBuffer.empty[V]
      m.forEach { (k, v) => buf.append(v) }
      buf.toList
    }
  }

  def retryableInsertRow(content: java.util.Map[String,Any],
                         bq: BigQuery,
                         tableId: TableId): Unit = {
    runWithRetry(insertRow(content, bq, tableId), "Insert statistic row")
  }

  def insertRow(content: java.util.Map[String,Any],
                bq: BigQuery,
                tableId: TableId): Unit = {
    val request = InsertAllRequest.of(tableId, RowToInsert.of(content))
    val result = bq.insertAll(request)
    if (result.hasErrors) {
      val errors: Seq[BigQueryError] = mv(result.getInsertErrors).flatMap(l2l)
      val tblSpec = s"${tableId.getProject}.${tableId.getDataset}.${tableId.getTable}"
      val sb = new StringBuilder
      sb.append(s"Errors inserting row into $tblSpec\n")
      content.forEach { (k, v) => sb.append(s"$k -> $v\n") }
      sb.append("\n")
      errors.foreach { e =>
        sb.append("BigQueryError:\n")
        sb.append(s"message: ${e.getMessage}\n")
        sb.append(s"reason: ${e.getReason}\n\n")
      }
      logger.error(sb.result)
    }
  }

}
