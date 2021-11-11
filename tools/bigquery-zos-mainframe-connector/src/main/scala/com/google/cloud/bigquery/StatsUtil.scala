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

package com.google.cloud.bigquery

import com.google.api.client.json.jackson2.JacksonFactory
import com.google.cloud.gszutil.Util.Logging
import com.google.common.collect.ImmutableMap

import scala.collection.JavaConverters._
import java.text.SimpleDateFormat
import java.util.{Date, TimeZone}

object StatsUtil extends Logging {
  private def sdf(f: String): SimpleDateFormat = {
    val simpleDateFormat = new SimpleDateFormat(f)
    simpleDateFormat.setTimeZone(TimeZone.getTimeZone("UTC"))
    simpleDateFormat
  }

  val JobDateFormat: SimpleDateFormat = sdf("yyMMdd")
  val JobTimeFormat: SimpleDateFormat = sdf("HHmmss")
  val TimestampFormat: SimpleDateFormat = sdf("yyyy-MM-dd'T'HH:mm:ss.SSSSSS")
  val DateFormat: SimpleDateFormat = sdf("yyyy-MM-dd")
  val TimeFormat: SimpleDateFormat = sdf("HH:mm:ss.SSSSSS")

  def epochMillis2Timestamp(t: Long): String =
    TimestampFormat.format(new Date(t))

  def jobDate2Date(jobDate: String): String =
    DateFormat.format(JobDateFormat.parse(jobDate))

  def jobTime2Time(jobTime: String): String =
    TimeFormat.format(JobTimeFormat.parse(jobTime))

  def createSQL(project: String, dataset: String, table: String): String =
    s"""CREATE TABLE `$project.$dataset.$table` (
       |   job_name STRING,
       |   job_date DATE,
       |   job_time TIME,
       |   timestamp TIMESTAMP,
       |   job_id STRING,
       |   job_type STRING,
       |   source STRING,
       |   destination STRING,
       |   job_json STRING,
       |   records_in INT64,
       |   records_out INT64
       |)
       |PARTITION BY job_date
       |CLUSTER BY job_name, job_date, timestamp
       |OPTIONS (
       |  partition_expiration_days=1000,
       |  description="Log table for mainframe jobs"
       |)""".stripMargin

  def insertJobStats(jobName: String, jobDate: String, jobTime: String, job: scala.Option[Job], bq: BigQuery, tableId: TableId, jobType: String = "", source: String = "", dest: String = "", recordsIn: Long = -1, recordsOut: Long = -1): Unit = {
    val id = job.map(_.getJobId.getJob)
      .getOrElse(s"${jobName}_${jobDate}_${jobTime}_$jobType")

    val row = ImmutableMap.builder[String,Any]()
    row.put("job_name", jobName)
    row.put("job_date", jobDate2Date(jobDate))
    row.put("job_time", jobTime2Time(jobTime))
    row.put("timestamp", epochMillis2Timestamp(System.currentTimeMillis))
    row.put("job_id", id)
    if (jobType.nonEmpty)
      row.put("job_type", jobType)
    if (source.nonEmpty)
      row.put("source", source)
    if (dest.nonEmpty)
      row.put("destination", dest)
    if (job.isDefined) {
      val jobData = job.get.toPb
      row.put("job_json", JacksonFactory.getDefaultInstance.toString(jobData))
      logger.info(s"Job Data:\n${JacksonFactory.getDefaultInstance.toPrettyString(jobData)}")
      if (jobType == "query") {
        val stats = jobData.getStatistics.getQuery
        if (stats != null) {
          val plan = stats.getQueryPlan
          if (plan != null && plan.size > 0){
            val stages = plan.asScala
            val in = stages.last.getRecordsRead
            val out = stages.last.getRecordsWritten
            row.put("records_in", in)
            row.put("records_out", out)
          }
        }
      } else if (jobType == "load") {
        val stats = jobData.getStatistics.getLoad
        if (stats != null) {
          row.put("records_in", stats.getBadRecords + stats.getOutputRows)
          row.put("records_out", stats.getOutputRows)
        }
      }
    }
    if (recordsIn >= 0)
      row.put("records_in", recordsIn)
    if (recordsOut >= 0)
      row.put("records_out", recordsOut)
    row.build()

    val request = InsertAllRequest.newBuilder(tableId)
        .addRow(id, row.build)
        .build()
    val response = bq.insertAll(request)
    if (response.hasErrors){
      logger.error(s"failed to insert stats for Job ID $id")
    }
  }
}
