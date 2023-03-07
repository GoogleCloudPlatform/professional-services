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
import com.google.cloud.bigquery.JobStatistics.QueryStatistics
import com.google.cloud.bigquery.{FieldValue, FieldValueList, JobId, QueryJobConfiguration}
import com.google.cloud.bqsh.cmd.Query
import com.google.cloud.bqsh.cmd.Query.configureQueryJob
import com.google.cloud.imf.gzos.{Linux, Util}
import com.google.cloud.imf.util.Services
import com.google.cloud.imf.util.stats.{LogTable, MergeStats}
import org.scalatest.flatspec.AnyFlatSpec
import org.scalatest.{BeforeAndAfter, BeforeAndAfterAll}
import org.threeten.bp.Duration

import java.util.concurrent.Executors
import scala.concurrent.{Await, ExecutionContext, Future}
import scala.jdk.CollectionConverters._

class QueryITSpec extends AnyFlatSpec with BeforeAndAfterAll with BeforeAndAfter {

  val projectId = sys.env("PROJECT")
  val tableStats = "STATS_TABLE_TEST"
  val location = sys.env.getOrElse("LOCATION", "US")
  val zos = Linux
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

  before {
    beforeAll()
  }

  "Query" should "parse stats table" in {
    val example = "test-project-id:TEST_DATASET_A.TABLE_NAME"
    val resolved = BQ.resolveTableSpec(example, "", "")
    assert(resolved.getProject == "test-project-id")
    assert(resolved.getDataset == "TEST_DATASET_A")
    assert(resolved.getTable == "TABLE_NAME")
  }

  it should "query" in {
    // create a table with one column of each type
    val sql1 =
      s"""create or replace table $projectId.dataset.tbl1 as
         |SELECT
         | 1 as a,
         | 'a' as b,
         | NUMERIC '-3.14'as c,
         | RB"abc+" as d,
         | TIMESTAMP '2014-09-27 12:30:00.45-08'as e,
         | CAST(TIMESTAMP '2014-09-27 12:30:00.45-08' AS STRING) as e1,
         | EXTRACT(DATE FROM CURRENT_TIMESTAMP()) as e2,
         | CURRENT_DATE() as f,
         | 123.456e-67 as g
         |""".stripMargin
    val id1 = JobId.newBuilder().setProject(projectId)
      .setLocation(location).setRandomJob().build()
    bq.query(QueryJobConfiguration.newBuilder(sql1)
      .setUseLegacySql(false).build(), id1)
    val job1 = bq.getJob(id1)
    job1.waitFor(RetryOption.totalTimeout(Duration.ofMinutes(2)))

    val sql =
      s"""select *
         |from $projectId.dataset.tbl1
         |limit 200
         |""".stripMargin
    val id = JobId.newBuilder().setProject(projectId)
      .setLocation(location).setRandomJob().build()
    val result = bq.query(QueryJobConfiguration.newBuilder(sql)
      .setUseLegacySql(false).build(), id)
    val job = bq.getJob(id)
    // wait for job to complete
    job.waitFor(RetryOption.totalTimeout(Duration.ofMinutes(2)))

    val stats = job.getStatistics[QueryStatistics]
    val conf = job.getConfiguration[QueryJobConfiguration]
    val destTable = conf.getDestinationTable

    import scala.jdk.CollectionConverters.IterableHasAsScala

    val rows: Iterable[FieldValueList] = result.iterateAll().asScala

    val schema = result.getSchema.getFields
    val rowCount = result.getTotalRows
    val cols = schema.size()

    rows.foreach { row =>
      val size = row.size()
      assert(cols == size, s"schema cols $cols != $size row size")
    }
  }

  it should "print select stats" in {
    val zos = Util.zProvider
    zos.init()

    Query.run(QueryConfig(
      projectId = projectId,
      sql =
        s"""CREATE OR REPLACE TABLE `$projectId.dataset.UPSERT01` (
           |   ITEM_NBR INT64
           |  ,YR_WK INT64
           |  ,QTY INT64
           |  ,AMT NUMERIC
           |);""".stripMargin
    ), zos, Map.empty)

    Query.run(QueryConfig(
      projectId = projectId,
      destinationTable = s"$projectId.dataset.UPSERT01",
      replace = true,
      sql =
        s"""SELECT
           | 1 as ITEM_NBR,
           | 1 as YR_WK,
           | 1 as QTY,
           | NUMERIC '1.01'as AMT""".stripMargin
    ), zos, Map.empty)
  }

  it should "print merge stats" in {
    val zos = Util.zProvider
    zos.init()

    Query.run(QueryConfig(
      projectId = projectId,
      sql =
        s"""CREATE OR REPLACE TABLE `$projectId.dataset.ITEM_DLY_POS` (
           |   ITEM_NBR INT64
           |  ,YR_WK INT64
           |  ,QTY INT64
           |  ,AMT NUMERIC
           |);
           |CREATE OR REPLACE TABLE `$projectId.dataset.UPSERT01` (
           |   ITEM_NBR INT64
           |  ,YR_WK INT64
           |  ,QTY INT64
           |  ,AMT NUMERIC
           |);
           |INSERT INTO `$projectId.dataset.ITEM_DLY_POS`
           |(ITEM_NBR,YR_WK,QTY,AMT)
           |VALUES
           |  (1,1,1,NUMERIC '1.01')
           | ,(0,1,1,NUMERIC '1.01')
           |;
           |INSERT INTO `$projectId.dataset.UPSERT01`
           |(ITEM_NBR,YR_WK,QTY,AMT)
           |VALUES
           |  (1,1,1,NUMERIC '1.01')
           | ,(2,1,1,NUMERIC '1.01')
           |;""".stripMargin
    ), zos, Map.empty)

    Query.run(QueryConfig(
      projectId = projectId,
      sql =
        s"""MERGE INTO `$projectId.dataset.ITEM_DLY_POS` D
           |USING `$projectId.dataset.UPSERT01` S
           |ON D.ITEM_NBR = S.ITEM_NBR
           |  AND D.YR_WK = S.YR_WK
           |WHEN NOT MATCHED THEN
           | INSERT (  ITEM_NBR,   YR_WK,   QTY,   AMT)
           | VALUES (S.ITEM_NBR ,S.YR_WK ,S.QTY ,S.AMT)
           |WHEN MATCHED THEN UPDATE
           |SET D.QTY = S.QTY
           |   ,D.AMT = S.AMT
           |;""".stripMargin
    ), zos, Map.empty)
  }

  it should "print merge stats for aggregate" in {
    val zos = Util.zProvider
    zos.init()

    Query.run(QueryConfig(
      projectId = projectId,
      sql =
        s"""CREATE OR REPLACE TABLE `$projectId.dataset.ITEM_DLY_POS` (
           |   ITEM_NBR INT64
           |  ,YR_WK INT64
           |  ,QTY INT64
           |  ,AMT NUMERIC
           |);
           |CREATE OR REPLACE TABLE `$projectId.dataset.UPSERT01` (
           |   ITEM_NBR INT64
           |  ,YR_WK INT64
           |  ,QTY INT64
           |  ,AMT NUMERIC
           |);
           |INSERT INTO `$projectId.dataset.ITEM_DLY_POS`
           |(ITEM_NBR,YR_WK,QTY,AMT)
           |VALUES
           |  (1,1,1,NUMERIC '1.01')
           | ,(0,1,1,NUMERIC '1.01')
           |;
           |INSERT INTO `$projectId.dataset.UPSERT01`
           |(ITEM_NBR,YR_WK,QTY,AMT)
           |VALUES
           |  (1,1,1,NUMERIC '1.01')
           | ,(1,1,1,NUMERIC '1.01')
           | ,(2,1,1,NUMERIC '1.01')
           |;""".stripMargin
    ), zos, Map.empty)

    Query.run(QueryConfig(
      projectId = projectId,
      sql =
        s"""MERGE INTO `$projectId.dataset.ITEM_DLY_POS` D
           |USING (
           |  SELECT
           |     ITEM_NBR
           |    ,YR_WK
           |    ,SUM(QTY) AS QTY
           |    ,SUM(AMT) AS AMT
           |  FROM `$projectId.dataset.UPSERT01`
           |  GROUP BY ITEM_NBR, YR_WK
           |) S
           |ON D.ITEM_NBR = S.ITEM_NBR
           |  AND D.YR_WK = S.YR_WK
           |WHEN NOT MATCHED THEN
           | INSERT (  ITEM_NBR,   YR_WK,   QTY,   AMT)
           | VALUES (S.ITEM_NBR, S.YR_WK, S.QTY, S.AMT)
           |WHEN MATCHED THEN UPDATE
           |SET
           |   D.QTY = S.QTY
           |  ,D.AMT = S.AMT""".stripMargin
    ), zos, Map.empty)
  }

  it should "print correct report after quering for INSERT, UPDATE, DELETE in MERGE statements" in {
    val cfg: QueryConfig = QueryConfig(
      projectId = projectId,
      datasetId = "dataset",
      statsTable = tableStats)
    val zos = Util.zProvider
    zos.init()
    val creds = zos.getCredentialProvider().getCredentials
    val bq = Services.bigQuery(projectId, sys.env.getOrElse("LOCATION", "US"),
      creds)
    val bqApi = Services.bigQueryApi(zos.getCredentialProvider().getCredentials)

    val createTableScript =
      s"""CREATE OR REPLACE TABLE `$projectId.dataset.tbl2` (
         |   ITEM_NBR INT64
         |  ,YR_WK INT64
         |  ,QTY INT64
         |  ,ITEM_NAME STRING
         |);
         |CREATE OR REPLACE TABLE `$projectId.dataset.tbl3` (
         |   STORE_ID INT64
         |  ,STORE_NAME STRING
         |);
         |INSERT INTO `$projectId.dataset.tbl2`
         |(ITEM_NBR, YR_WK, QTY, ITEM_NAME)
         |VALUES
         |  (1, 1, 1, "item1")
         | ,(2, 2, 2, "item2")
         |;
         |INSERT INTO `$projectId.dataset.tbl3`
         |(STORE_ID, STORE_NAME)
         |VALUES
         |  (1, "STORE_1")
         |;""".stripMargin
    val jobConfiguration_create = configureQueryJob(createTableScript, cfg)
    val jobId_create = BQ.genJobId(cfg.projectId, cfg.location, zos.getInfo, "query")
    val job_create = BQ.runJob(bq, jobConfiguration_create, jobId_create, cfg.timeoutMinutes * 60, true)

    val status = BQ.getStatus(job_create)
    if (cfg.sync) {
      if (status.isDefined) {
        val s = status.get
        if (!s.isDone) {
          val msg = s"Query job state=${s.state} but expected DONE"
          println(msg)
        }
      } else {
        val msg = s"Query job status not available"
        println(msg)
      }
    }

    val insertScript =
      s"""
         |MERGE `$projectId.dataset.tbl2` t2
         | USING
         | `$projectId.dataset.tbl3` t3
         |  ON t2.ITEM_NAME = "name_not_exists"
         |WHEN MATCHED THEN
         | DELETE
         |WHEN NOT MATCHED THEN
         | INSERT (ITEM_NAME)
         | VALUES ("item3")
         |;""".stripMargin

    val jobConfiguration_insert = configureQueryJob(insertScript, cfg)
    val jobId_insert = BQ.genJobId(cfg.projectId, cfg.location, zos.getInfo, "query")
    BQ.runJob(bq, jobConfiguration_insert, jobId_insert, cfg.timeoutMinutes * 60, cfg.sync)
    val job_insert = BQ.apiGetJob(bqApi, jobId_insert)
    val insert_result = MergeStats.forJob(job_insert)
    assert(insert_result.isDefined)
    assert(insert_result.get.rowsInserted == 1 &&
      insert_result.get.rowsUpdated == 0 &&
      insert_result.get.rowsDeleted == 0)

    val updateScript =
      s"""
         |MERGE `$projectId.dataset.tbl2` t2
         | USING
         | `$projectId.dataset.tbl3` t3
         |  ON t2.ITEM_NBR = t3.STORE_ID
         |WHEN MATCHED THEN
         | UPDATE SET t2.YR_WK = t2.YR_WK + 5
         |WHEN NOT MATCHED THEN
         | INSERT (ITEM_NBR, YR_WK, QTY, ITEM_NAME)
         | VALUES (-1, -1, -1, "item_should_not_exist_upd")
         |;""".stripMargin

    val jobConfiguration_update = configureQueryJob(updateScript, cfg)
    val jobId_update = BQ.genJobId(cfg.projectId, cfg.location, zos.getInfo, "query")
    BQ.runJob(bq, jobConfiguration_update, jobId_update, cfg.timeoutMinutes * 60, cfg.sync)
    val job_update = BQ.apiGetJob(bqApi, jobId_update)
    val update_result = MergeStats.forJob(job_update)
    assert(update_result.isDefined)
    assert(update_result.get.rowsInserted == 0 &&
      update_result.get.rowsUpdated == 1 &&
      update_result.get.rowsDeleted == 0)

    val deleteScript =
      s"""
         |MERGE `$projectId.dataset.tbl2` t2
         | USING
         | `$projectId.dataset.tbl3` t3
         |  ON t2.ITEM_NAME = "item3"
         |WHEN MATCHED THEN
         | DELETE
         |WHEN NOT MATCHED THEN
         | INSERT (ITEM_NBR, YR_WK, QTY, ITEM_NAME)
         | VALUES (-1, -1, -1, "item_should_not_exist_del")
         |;""".stripMargin

    val jobConfiguration_delete = configureQueryJob(deleteScript, cfg)
    val jobId_delete = BQ.genJobId(cfg.projectId, cfg.location, zos.getInfo, "query")
    BQ.runJob(bq, jobConfiguration_delete, jobId_delete, cfg.timeoutMinutes * 60, cfg.sync)
    val job_delete = BQ.apiGetJob(bqApi, jobId_delete)
    val delete_result = MergeStats.forJob(job_delete)
    assert(delete_result.isDefined)
    assert(delete_result.get.rowsInserted == 0 &&
      delete_result.get.rowsUpdated == 0 &&
      delete_result.get.rowsDeleted == 1)
  }

  it should "execute multiple query jobs" in {
    val zos = Util.zProvider
    zos.init()
    val script = s"""select 1;""".stripMargin

    implicit val ec = ExecutionContext.fromExecutor(Executors.newWorkStealingPool(10))
    val futures = (0 to 10).map { _ =>
      Future {
        Query.run(QueryConfig(
          projectId = projectId,
          sql = script
        ), zos, Map.empty)
      }
    }

    val results = Await.result(Future.sequence(futures),
      scala.concurrent.duration.Duration(5, "min"))
    require(results.forall(_.exitCode == 0))

  }


  "Query [LOAD STATS] [CREATE]" should "insert stats for create table query" in {
    Query.run(QueryConfig(
      projectId = projectId,
      sql =
        s"""CREATE OR REPLACE TABLE `$projectId.dataset.TEST01` (ITEM_NBR INT64, YR_WK INT64);
           |INSERT INTO `$projectId.dataset.TEST01` (ITEM_NBR, YR_WK) VALUES (1, 1), (2, 2), (3, 3);
           |""".stripMargin
    ), zos, Map.empty)

    Query.run(QueryConfig(
      projectId = projectId,
      statsTable = s"dataset.$tableStats",
      sql =
        s"""CREATE OR REPLACE TABLE `$projectId.dataset.TEST02` as
           |SELECT
           |   ITEM_NBR, YR_WK
           |   FROM `$projectId.dataset.TEST01`
           |   WHERE ITEM_NBR != 3
           |;""".stripMargin
    ), zos, Map.empty)

    val stats = queryStats()
    assert(stats.size == 1)
    assertStatsSqlStatement(stats.head,
      statementType = Some("CREATE_TABLE_AS_SELECT"),
      destination = Some(s"$projectId.dataset.TEST02"),
      source = Some(s"$projectId.dataset.TEST01"),
      rowsWritten = Some("2")
    )
  }

  "Query [LOAD STATS] [SELECT]" should "populate stats for simple select statement" in {
    //prepare
    Query.run(QueryConfig(
      projectId = projectId,
      sql =
        s"""CREATE OR REPLACE TABLE `$projectId.dataset.TEST01` (ITEM_NBR INT64, YR_WK INT64);
           |CREATE OR REPLACE TABLE `$projectId.dataset.TEST02` (ITEM_NBR INT64, YR_WK INT64);
           |INSERT INTO `$projectId.dataset.TEST01` (ITEM_NBR, YR_WK) VALUES (1, 1), (2, 2), (3, 3);
           |""".stripMargin
    ), zos, Map.empty)

    Query.run(QueryConfig(
      projectId = projectId,
      statsTable = s"dataset.$tableStats",
      destinationTable = s"$projectId.dataset.TEST02",
      sql =
        s"""SELECT ITEM_NBR, YR_WK FROM `$projectId.dataset.TEST01`
           |WHERE ITEM_NBR != 3;""".stripMargin
    ), zos, Map.empty)

    val stats = queryStats()
    assert(stats.size == 1)
    assertStatsSqlStatement(stats.head,
      statementType = Some("SELECT"),
      destination = Some(s"$projectId.dataset.TEST02"),
      source = Some(s"$projectId.dataset.TEST01"),
      rowsWritten = Some("2")
    )
  }

  "Query [LOAD STATS] [SELECT]" should "populate stats for select query with with cross joins" in {
    //prepare
    Query.run(QueryConfig(
      projectId = projectId,
      sql =
        s"""CREATE OR REPLACE TABLE `$projectId.dataset.TEST01` (ITEM_NBR INT64, YR_WK INT64);
           |CREATE OR REPLACE TABLE `$projectId.dataset.TEST02` (ITEM_NBR INT64, QTY INT64);
           |CREATE OR REPLACE TABLE `$projectId.dataset.TEST03` (ITEM_NBR INT64, AMT NUMERIC);
           |CREATE OR REPLACE TABLE `$projectId.dataset.TEST04` (ITEM_NBR INT64, YR_WK INT64, QTY INT64, AMT NUMERIC);
           |INSERT INTO `$projectId.dataset.TEST01` (ITEM_NBR, YR_WK) VALUES (1, 1), (3, 3), (4, 4), (5,5);
           |INSERT INTO `$projectId.dataset.TEST02` (ITEM_NBR, QTY) VALUES (1, 4), (3, 5), (4, 6);
           |INSERT INTO `$projectId.dataset.TEST03` (ITEM_NBR, AMT) VALUES (1, 7.1), (3, 7.2);
           |""".stripMargin
    ), zos, Map.empty)

    Query.run(QueryConfig(
      projectId = projectId,
      statsTable = s"dataset.$tableStats",
      destinationTable = s"$projectId.dataset.TEST04",
      sql =
        s"""SELECT a.ITEM_NBR, a.YR_WK, b.QTY, c.AMT
           |FROM `$projectId.dataset.TEST01` as a, `$projectId.dataset.TEST02` as b, `$projectId.dataset.TEST03` as c
           |WHERE a.ITEM_NBR = b.ITEM_NBR AND b.ITEM_NBR = c.ITEM_NBR
           |;""".stripMargin
    ), zos, Map.empty)

    val stats = queryStats()
    assert(stats.size == 1)
    val source = getStatsValue(stats.head, "source").filter(_.contains(s"$projectId.dataset.TEST01"))
      .filter(_.contains(s"$projectId.dataset.TEST03")).filter(_.contains(s"$projectId.dataset.TEST02"))
    println(source)
    assertStatsSqlStatement(stats.head,
      statementType = Some("SELECT"),
      destination = Some(s"$projectId.dataset.TEST04"),
      source = source,
      rowsWritten = Some("2")
    )
  }

  "Query [LOAD STATS] [SELECT]" should "populate stats for select query with with left join" in {
    Query.run(QueryConfig(
      projectId = projectId,
      sql =
        s"""CREATE OR REPLACE TABLE `$projectId.dataset.TEST01` (ITEM_NBR INT64, YR_WK INT64);
           |CREATE OR REPLACE TABLE `$projectId.dataset.TEST02` (ITEM_NBR INT64, QTY INT64);
           |CREATE OR REPLACE TABLE `$projectId.dataset.TEST03` (ITEM_NBR INT64, AMT NUMERIC);
           |CREATE OR REPLACE TABLE `$projectId.dataset.TEST04` (ITEM_NBR INT64, YR_WK INT64, QTY INT64, AMT NUMERIC);
           |INSERT INTO `$projectId.dataset.TEST01` (ITEM_NBR, YR_WK) VALUES (1, 1), (3, 3), (4, 4), (5,5);
           |INSERT INTO `$projectId.dataset.TEST02` (ITEM_NBR, QTY) VALUES (1, 4), (3, 5), (4, 6);
           |INSERT INTO `$projectId.dataset.TEST03` (ITEM_NBR, AMT) VALUES (1, 7.1), (3, 7.2), (5, 7.3);
           |""".stripMargin
    ), zos, Map.empty)

    Query.run(QueryConfig(
      projectId = projectId,
      statsTable = s"dataset.$tableStats",
      destinationTable = s"$projectId.dataset.TEST04",
      sql =
        s"""SELECT a.ITEM_NBR, a.YR_WK, b.QTY, c.AMT
           |FROM `$projectId.dataset.TEST01` as a
           |JOIN `$projectId.dataset.TEST02` as b ON a.ITEM_NBR = b.ITEM_NBR
           |LEFT JOIN `$projectId.dataset.TEST03` as c ON b.ITEM_NBR = c.ITEM_NBR
           |;""".stripMargin
    ), zos, Map.empty)

    val stats = queryStats()
    assert(stats.size == 1)
    val source = getStatsValue(stats.head, "source").filter(_.contains(s"$projectId.dataset.TEST01"))
      .filter(_.contains(s"$projectId.dataset.TEST03")).filter(_.contains(s"$projectId.dataset.TEST02"))
    println(source)
    assertStatsSqlStatement(stats.head,
      statementType = Some("SELECT"),
      destination = Some(s"$projectId.dataset.TEST04"),
      source = source,
      rowsWritten = Some("3")
    )
  }

  "Query [LOAD STATS] [INSERT]" should "insert stats for insert query" in {
    Query.run(QueryConfig(
      projectId = projectId,
      sql =
        s"""
           |CREATE OR REPLACE TABLE `$projectId.dataset.UPSERT01` (ITEM_NBR INT64);
           |""".stripMargin
    ), zos, Map.empty)

    Query.run(QueryConfig(
      projectId = projectId,
      statsTable = s"dataset.$tableStats",
      sql =
        s"""
           |INSERT INTO `$projectId.dataset.UPSERT01` (ITEM_NBR) VALUES (1), (2), (3), (4);
           |""".stripMargin
    ), zos, Map.empty)

    val stats = queryStats()
    assert(stats.size == 1)
    assertStatsSqlStatement(stats.head,
      statementType = Some("INSERT"),
      destination = Some(s"$projectId.dataset.UPSERT01"),
      rowsWritten = Some("4"),
      rowsInserted = Some("4"))
  }

  "Query [LOAD STATS] [INSERT]" should "populate stats for insert query (select with join)" in {
    Query.run(QueryConfig(
      projectId = projectId,
      sql =
        s"""
           |CREATE OR REPLACE TABLE `$projectId.dataset.UPSERT01` (ITEM_NBR INT64);
           |CREATE OR REPLACE TABLE `$projectId.dataset.UPSERT02` (ITEM_NBR INT64);
           |INSERT INTO `$projectId.dataset.UPSERT02` (ITEM_NBR) VALUES (1), (2), (3), (4);
           |""".stripMargin
    ), zos, Map.empty)
    Thread.sleep(1000) //because of eventual consistency, todo replace with poling
    Query.run(QueryConfig(
      projectId = projectId,
      statsTable = s"dataset.$tableStats",
      sql =
        s"""
           |INSERT INTO `$projectId.dataset.UPSERT01` (ITEM_NBR)
           |select a.* from `$projectId.dataset.UPSERT02` a join `$projectId.dataset.UPSERT02` b
           |on a.ITEM_NBR =b.ITEM_NBR and a.ITEM_NBR >2
           |""".stripMargin
    ), zos, Map.empty)

    val stats = queryStats()
    assert(stats.size == 1)
    assertStatsSqlStatement(stats.head,
      statementType = Some("INSERT"),
      destination = Some(s"$projectId.dataset.UPSERT01"),
      rowsWritten = Some("2"),
      rowsInserted = Some("2"))
  }

  "Query [LOAD STATS] [UPDATE]" should "populate stats for simple update query" in {
    Query.run(QueryConfig(
      projectId = projectId,
      sql =
        s"""CREATE OR REPLACE TABLE `$projectId.dataset.TEST01` (ITEM_NBR INT64, YR_WK INT64);
           |CREATE OR REPLACE TABLE `$projectId.dataset.TEST02` (ITEM_NBR INT64, QTY INT64);
           |INSERT INTO `$projectId.dataset.TEST01` (ITEM_NBR, YR_WK) VALUES (1, 1), (3, 3), (4, 4), (5,5);
           |INSERT INTO `$projectId.dataset.TEST02` (ITEM_NBR, QTY) VALUES (1, 11), (3, 12), (6, 13);
           |""".stripMargin
    ), zos, Map.empty)

    Query.run(QueryConfig(
      projectId = projectId,
      statsTable = s"dataset.$tableStats",
      sql =
        s"""UPDATE `$projectId.dataset.TEST01` as A SET A.YR_WK = B.QTY
           |FROM (SELECT QTY FROM `$projectId.dataset.TEST02` as B WHERE B.ITEM_NBR = 3) as B
           |WHERE A.ITEM_NBR < 4""".stripMargin
    ), zos, Map.empty)

    val stats = queryStats()
    assert(stats.size == 1)
    assertStatsSqlStatement(stats.head,
      statementType = Some("UPDATE"),
      destination = Some(s"$projectId.dataset.TEST01"),
      rowsUpdated = Some("2")
    )
  }

  "Query [LOAD STATS] [DELETE]" should "populate stats for delete query" in {
    Query.run(QueryConfig(
      projectId = projectId,
      sql =
        s"""CREATE OR REPLACE TABLE `$projectId.dataset.UPSERT01` (
           |   ITEM_NBR INT64
           |  ,YR_WK INT64
           |  ,QTY INT64
           |  ,AMT NUMERIC
           |);
           |INSERT INTO `$projectId.dataset.UPSERT01`
           |(ITEM_NBR, YR_WK, QTY, AMT)
           |VALUES
           |  (1, 1, 1, 3.13)
           | ,(2, 2, 2, 3.14)
           |;""".stripMargin
    ), zos, Map.empty)

    Query.run(QueryConfig(
      projectId = projectId,
      statsTable = s"dataset.$tableStats",
      sql =
        s"""DELETE FROM `$projectId.dataset.UPSERT01`
           |WHERE ITEM_NBR = 1;
           |""".stripMargin
    ), zos, Map.empty)

    val stats = queryStats()
    assert(stats.size == 1)
    assertStatsSqlStatement(stats.head,
      statementType = Some("DELETE"),
      destination = Some(s"$projectId.dataset.UPSERT01"),
      rowsDeleted = Some("1")
    )
  }

  "Query [LOAD STATS] [MERGE]" should "insert stats for merge query with update/insert" in {
    Query.run(QueryConfig(
      projectId = projectId,
      sql =
        s"""CREATE OR REPLACE TABLE `$projectId.dataset.GlobalInventory` (
           |   ITEM_NAME STRING,
           |   ITEM_COUNT INT64);
           |INSERT INTO `$projectId.dataset.GlobalInventory`
           |(ITEM_NAME, ITEM_COUNT)
           |VALUES
           |  ('dishwasher', 15),
           |  ('microwave', 10),
           |  ('oven', 5),
           |  ('dryer', 25);
           |
           |CREATE OR REPLACE TABLE `$projectId.dataset.LocalInventory` (
           |   ITEM_NAME STRING,
           |   ITEM_COUNT INT64);
           |INSERT INTO `$projectId.dataset.LocalInventory`
           |(ITEM_NAME, ITEM_COUNT)
           |VALUES
           |  ('dishwasher', 5),
           |  ('microwave', 5),
           |  ('refrigerator', 7);
           |""".stripMargin
    ), zos, Map.empty)

    Query.run(QueryConfig(
      projectId = projectId,
      statsTable = s"dataset.$tableStats",
      sql =
        s"""
           |MERGE INTO `$projectId.dataset.GlobalInventory` gi
           |USING `$projectId.dataset.LocalInventory` li
           |ON gi.ITEM_NAME = li.ITEM_NAME
           |WHEN MATCHED THEN
           |  UPDATE SET ITEM_COUNT = li.ITEM_COUNT
           |WHEN NOT MATCHED THEN
           |  INSERT (ITEM_NAME, ITEM_COUNT) VALUES(li.ITEM_NAME, li.ITEM_COUNT);
           |""".stripMargin
    ), zos, Map.empty)

    val stats = queryStats()
    assert(stats.size == 1)
    val statsMap = stats.head.map(p => p._2.name -> String.valueOf(p._1.getValue)).toMap

    assert(statsMap("rows_inserted") == "1")
    assert(statsMap("rows_updated") == "2")
    assert(statsMap("rows_deleted") == "0")


    assert(statsMap("rows_before_merge") == "null")
    assert(statsMap("rows_read") == "null")
    assert(statsMap("rows_written") == "null")
    assert(statsMap("rows_affected") == "null")
    assert(statsMap("rows_unmodified") == "null")
  }

  "Query [LOAD STATS] [MERGE]" should "insert stats for merge query with delete/insert" in {
    Query.run(QueryConfig(
      projectId = projectId,
      sql =
        s"""CREATE OR REPLACE TABLE `$projectId.dataset.GlobalInventory` (
           |   ITEM_NAME STRING,
           |   ITEM_COUNT INT64);
           |INSERT INTO `$projectId.dataset.GlobalInventory`
           |(ITEM_NAME, ITEM_COUNT)
           |VALUES
           |  ('dishwasher', 15),
           |  ('microwave', 10),
           |  ('oven', 5),
           |  ('dryer', 25);
           |
           |CREATE OR REPLACE TABLE `$projectId.dataset.LocalInventory` (
           |   ITEM_NAME STRING,
           |   ITEM_COUNT INT64);
           |INSERT INTO `$projectId.dataset.LocalInventory`
           |(ITEM_NAME, ITEM_COUNT)
           |VALUES
           |  ('dishwasher', 5),
           |  ('microwave', 5),
           |  ('refrigerator', 7);
           |""".stripMargin
    ), zos, Map.empty)

    Query.run(QueryConfig(
      projectId = projectId,
      statsTable = s"dataset.$tableStats",
      sql =
        s"""
           |MERGE INTO `$projectId.dataset.GlobalInventory` gi
           |USING `$projectId.dataset.LocalInventory` li
           |ON gi.ITEM_NAME = li.ITEM_NAME
           |WHEN MATCHED THEN
           |  UPDATE SET ITEM_COUNT = li.ITEM_COUNT
           |WHEN NOT MATCHED BY SOURCE THEN
           |  DELETE ;
           |""".stripMargin
    ), zos, Map.empty)

    val stats = queryStats()
    assert(stats.size == 1)
    val statsMap = stats.head.map(p => p._2.name -> String.valueOf(p._1.getValue)).toMap

    assert(statsMap("rows_inserted") == "0")
    assert(statsMap("rows_updated") == "2")
    assert(statsMap("rows_deleted") == "2")

    assert(statsMap("rows_before_merge") == "null")
    assert(statsMap("rows_read") == "null")
    assert(statsMap("rows_written") == "null")
    assert(statsMap("rows_affected") == "null")
    assert(statsMap("rows_unmodified") == "null")
  }

  "Query [LOAD STATS] [SCRIPT]" should "populate stats for multiple queries" in {
    Query.run(QueryConfig(
      projectId = projectId,
      statsTable = s"dataset.$tableStats",
      sql =
        s"""CREATE OR REPLACE TABLE `$projectId.dataset.TEST01` (ITEM_NBR INT64, YR_WK INT64);
           |INSERT INTO `$projectId.dataset.TEST01` (ITEM_NBR, YR_WK) VALUES (1, 1), (3, 3), (4, 4), (5,5);
           |""".stripMargin
    ), zos, Map.empty)

    val stats = queryStats()
    assert(stats.size == 1)
    assertStatsJobColumns(stats.head)
    val statsMap = stats.head.map(p => p._2.name -> String.valueOf(p._1.getValue)).toMap
    assert(statsMap("statement_type") == "SCRIPT")
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

  private def getStatsValue(row: Seq[(FieldValue, BQ.BQField)], column: String) = {
    def find(colName: String): Option[(FieldValue, BQ.BQField)] = row.find(c => c._2.name == colName)

    find(column).map(_._1).filterNot(_.isNull).map(_.getValue).map(_.toString)
  }

  private def assertStatsJobColumns(row: Seq[(FieldValue, BQ.BQField)]) = {
    assert(getStatsValue(row, "timestamp").isDefined)
    assert(getStatsValue(row, "job_id").isDefined)
    assert(getStatsValue(row, "job_name").isDefined)
    assert(getStatsValue(row, "job_date").isDefined)
    assert(getStatsValue(row, "job_time").isDefined)
    assert(getStatsValue(row, "job_json").isDefined)
    assert(getStatsValue(row, "bq_job_id").isDefined)
    assert(getStatsValue(row, "bq_job_project").isDefined)
    assert(getStatsValue(row, "bq_job_location").isDefined)
    assert(getStatsValue(row, "job_type").isDefined && getStatsValue(row, "job_type").get.toString == "query")
    assert(getStatsValue(row, "bq_job_location").isDefined)
  }

  private def assertStatsBasicQueryColumns(row: Seq[(FieldValue, BQ.BQField)]) = {
    assert(getStatsValue(row, "query").isDefined)
    assert(getStatsValue(row, "statement_type").isDefined)
    assert(getStatsValue(row, "bq_stage_count").isDefined)
    assert(getStatsValue(row, "bq_step_count").isDefined)
    assert(getStatsValue(row, "bq_sub_step_count").isDefined)
    assert(getStatsValue(row, "bq_stage_summary").isDefined)
    assert(getStatsValue(row, "bytes_processed").isDefined)
    assert(getStatsValue(row, "shuffle_bytes").isDefined)
    assert(getStatsValue(row, "shuffle_spill_bytes").isDefined)
    assert(getStatsValue(row, "slot_ms").isDefined)
    assert(getStatsValue(row, "slot_utilization_rate").isDefined)
    assert(getStatsValue(row, "slot_ms_to_total_bytes_ratio").isDefined)
    assert(getStatsValue(row, "shuffle_bytes_to_total_bytes_ratio").isDefined)
    assert(getStatsValue(row, "shuffle_spill_bytes_to_shuffle_bytes_ratio").isDefined)
    assert(getStatsValue(row, "shuffle_spill_bytes_to_total_bytes_ratio").isDefined)
    assert(getStatsValue(row, "execution_ms").isDefined)
    assert(getStatsValue(row, "queued_ms").isDefined)
  }

  private def assertStatsSqlStatement(row: Seq[(FieldValue, BQ.BQField)],
                                      statementType: Option[String] = None,
                                      destination: Option[String] = None,
                                      source: Option[String] = None,
                                      rowsRead: Option[String] = None,
                                      rowsWritten: Option[String] = None,
                                      rowsDeleted: Option[String] = None,
                                      rowsUpdated: Option[String] = None,
                                      rowsInserted: Option[String] = None,
                                     ) = {
    assertStatsJobColumns(row)
    assertStatsBasicQueryColumns(row)
    assert(getStatsValue(row, "statement_type") == statementType)
    assert(getStatsValue(row, "destination") == destination)
    assert(getStatsValue(row, "source") == source)
    assert(getStatsValue(row, "rows_read") == rowsRead)
    assert(getStatsValue(row, "rows_written") == rowsWritten)
    assert(getStatsValue(row, "rows_deleted") == rowsDeleted)
    assert(getStatsValue(row, "rows_updated") == rowsUpdated)
    assert(getStatsValue(row, "rows_inserted") == rowsInserted)
  }
}
