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

package com.google.cloud.bqsh

import com.google.cloud.RetryOption
import com.google.cloud.bigquery.{FieldValue, JobId, QueryJobConfiguration}
import com.google.cloud.bqsh.cmd.Load
import com.google.cloud.gszutil.TestUtil
import com.google.cloud.imf.gzos.Linux
import com.google.cloud.imf.util.Services
import com.google.cloud.imf.util.stats.LogTable
import com.google.cloud.storage.{BlobId, BlobInfo}
import org.scalatest.BeforeAndAfterAll
import org.scalatest.flatspec.AnyFlatSpec

import java.util.concurrent.Executors
import scala.concurrent.duration.Duration
import scala.concurrent.{Await, ExecutionContext, Future}
import scala.jdk.CollectionConverters._

class LoadITSpec extends AnyFlatSpec with BeforeAndAfterAll {

  val projectId = sys.env("PROJECT")
  val location = sys.env.getOrElse("LOCATION", "US")
  val bucket = sys.env("BUCKET")
  val zos = Linux
  val table = "dataset.loadTestTable"
  val tableStats = "STATS_TABLE_TEST"
  val bq = Services.bigQuery(projectId, location, Services.bigqueryCredentials())

  override def beforeAll(): Unit = {
    val schema = LogTable.schema
    val cols = schema.fields.map(f => s"${f.name} ${f.typ.name()}")
    val query = s"CREATE OR REPLACE TABLE `$projectId.dataset.$tableStats` (${cols.mkString(", ")});"

    val id1 = JobId.newBuilder().setProject(projectId).setLocation(location).setRandomJob().build()
    bq.query(QueryJobConfiguration.newBuilder(query)
      .setUseLegacySql(false).build(), id1)
    val job1 = bq.getJob(id1)
    job1.waitFor(RetryOption.totalTimeout(org.threeten.bp.Duration.ofMinutes(2)))
  }

  it should "load data from ORC file located in Cloud Storage" in {
    //prepare
    val orcName = "loadTestOrc.orc"
    val orcContent = TestUtil.resource("load/loadOrc.orc")
    uploadToStorage(orcContent, orcName)
    //set
    val orcLocation = s"gs://$bucket/$orcName"
    val conf = LoadConfig(
      projectId = projectId,
      location = location,
      tablespec = table,
      path = Seq(orcLocation),
      replace = true,
      statsTable = s"dataset.$tableStats"
    )
    val result = Load.run(conf, zos, Map.empty)
    assert(result.exitCode == 0)
    val stats = queryStats()
    assert(stats.size == 1)
    testStats(stats.head, orcLocation)
  }

  it should "load data from ORC file located in Cloud Storage in parallel" in {
    //prepare
    val orcName = "loadTestOrc.orc"
    val orcContent = TestUtil.resource("load/loadOrc.orc")
    uploadToStorage(orcContent, orcName)
    //set
    implicit val ec = ExecutionContext.fromExecutor(Executors.newWorkStealingPool(5))
    val futures = (1 to 5).map{i =>
      Future {
        val conf = LoadConfig(
          projectId = projectId,
          location = location,
          tablespec = table,
          path = Seq(s"gs://$bucket/$orcName"),
          replace = true
        )
        // to handle duplicate job name error
        Thread.sleep(1200 * i)
        Load.run(conf, zos, Map.empty)
      }
    }

    val results = Await.result(Future.sequence(futures),
      Duration(5, "min"))
    require(results.forall(_.exitCode == 0))

  }

  it should "load data with autodetect flag from CSV file located in Cloud Storage" in {
    //prepare
    val csvName = "loadCsv.csv"
    val csvContent = TestUtil.resource("load/loadCsv.csv")
    uploadToStorage(csvContent, csvName)
    //set
    val conf = LoadConfig(
      projectId = projectId,
      location = location,
      tablespec = table,
      path = Seq(s"gs://$bucket/$csvName"),
      replace = true,
      source_format = "CSV",//required to pass
      autodetect = true,//required to pass or instead pass schema
      skip_leading_rows = 1,//required to pass, default is -1
    )
    val result = Load.run(conf, zos, Map.empty)
    assert(result.exitCode == 0)
  }

  it should "load data with schema from CSV file located in Cloud Storage" in {
    //prepare
    val csvName = "loadCsv.csv"
    val csvContent = TestUtil.resource("load/loadCsv.csv")
    uploadToStorage(csvContent, csvName)
    //set
    val conf = LoadConfig(
      projectId = projectId,
      location = location,
      tablespec = table,
      path = Seq(s"gs://$bucket/$csvName"),
      replace = true,
      source_format = "CSV",//required to pass
      schema = Seq("ITEM_NBR:INT64","STORE_NBR:INT64","WM_YR_WK:INT64","VENDOR_NBR:INT64",
        "EPC_MANAGER_NBR:STRING","CASE_REC_QTY:INT64", "CASE_REC_SCAN_QTY:INT64","REC_READ_RATE_PCT:INT64"),
      skip_leading_rows = 1,//required to pass, default is -1
    )
    val result = Load.run(conf, zos, Map.empty)
    assert(result.exitCode == 0)
  }

  def uploadToStorage(bytes: Array[Byte], name: String) = {
    val storage = Services.storage()
    val blobId = BlobId.of(bucket, name)
    storage.create(BlobInfo.newBuilder(blobId).build(), bytes)
  }

  private def queryStats() = {
    val sql =
      s"""select *
         |from $projectId.dataset.$tableStats
         |limit 10
         |""".stripMargin
    val id1 = JobId.newBuilder().setProject(projectId).setLocation(location).setRandomJob().build()
    val res = bq.query(QueryJobConfiguration.newBuilder(sql).setUseLegacySql(false).build(), id1)
    res.iterateAll().asScala.toList.map(r => r.asScala.toList.zip(LogTable.schema.fields))
  }

  private def testStats(row: Seq[(FieldValue, BQ.BQField)], orcLocation: String) = {
    def find(colName: String): Option[(FieldValue, BQ.BQField)] = row.find(c => c._2.name == colName)
    def value(colName: String): Option[AnyRef] = find(colName).map(_._1).filterNot(_.isNull).map(_.getValue)
    assert(value("timestamp").isDefined)
    assert(value("job_id").isDefined)
    assert(value("job_name").isDefined)
    assert(value("job_date").isDefined)
    assert(value("job_time").isDefined)
    assert(value("job_json").isDefined)
    assert(value("bq_job_id").isDefined)
    assert(value("bq_job_project").isDefined)
    assert(value("bq_job_location").isDefined)
    assert(value("job_type").isDefined && value("job_type").get.toString == "load")
    assert(value("source").isDefined && value("source").get.toString == orcLocation)
    assert(value("destination").isDefined && value("destination").get.toString == s"$projectId.$table")
    assert(value("rows_written").isDefined && value("rows_written").get.toString == "1")
    assert(value("rows_loaded").isDefined && value("rows_loaded").get.toString == "1")
    assert(value("rows_read").isDefined && value("rows_read").get.toString == "1")
  }
}
