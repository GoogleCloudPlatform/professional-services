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
import com.google.cloud.bigquery.InsertAllRequest.RowToInsert
import com.google.cloud.bigquery.{InsertAllRequest, JobId, QueryJobConfiguration, Table, TableId}
import com.google.cloud.bqsh.cmd.Export
import com.google.cloud.gszutil.CopyBook
import com.google.cloud.gszutil.io.exports._
import com.google.cloud.imf.grecv.GRecvConfig
import com.google.cloud.imf.grecv.server.GRecvServer
import com.google.cloud.imf.gzos.{Ebcdic, Linux}
import com.google.cloud.imf.util.Services
import com.google.cloud.storage.BlobId
import com.google.protobuf.ByteString
import org.scalatest.flatspec.AnyFlatSpec
import org.scalatest.{BeforeAndAfterAll, BeforeAndAfterEach}
import org.threeten.bp.Duration

import java.util.concurrent.{Executors, TimeUnit}
import scala.concurrent.ExecutionContext.Implicits.global
import scala.concurrent.Future

class ExportRemoteITSpec extends AnyFlatSpec with BeforeAndAfterAll with BeforeAndAfterEach {

  /**
    * For this test required following ENV variables:
    * BUCKET=GCS bucket
    * PROJECT=GCS project
    * COPYBOOK=absolute path to exportCopybook.txt
    */
  val TestBucket = sys.env("BUCKET")
  val TestProject = sys.env("PROJECT")
  val Location = sys.env.getOrElse("LOCATION", "US")
  val key = sys.env("KEY")
  val chain = sys.env("CHAIN")
  val trustCertCollectionFilePath = sys.env("TRUST_CERT_COLLECTION_FILE_PATH")

  val bqFunc = (project: String, location: String, _ : ByteString) => Services.bigQuery(project, location, Services.bigqueryCredentials())
  val bqStorageFunc = (_ : ByteString) => Services.bigQueryStorage(Services.bigqueryCredentials())
  def server(cfg: GRecvConfig): Future[GRecvServer] = Future{
    val s = new GRecvServer(cfg, _ => Services.storage(), bqStorageFunc,  _ => Services.storageApi(Services.storageCredentials()), bqFunc)
    s.start(block = false)
    s
  }

  val serverCfg = GRecvConfig("127.0.0.1", debug = true, key=key, chain=chain)
  private var grecvServer: Future[GRecvServer] = _

  val tableName = "exportTest"
  val sql =
    s"""select a,b,c,
       |CASE
       |   WHEN A > 1000 THEN 1
       |   WHEN A <= 1000 THEN 0
       |   END AS D
       |from $TestProject.dataset.$tableName
       |""".stripMargin

  val sqlWithColE =
    s"""select a,b,c,
       |CASE
       |   WHEN A > 1000 THEN 1
       |   WHEN A <= 1000 THEN 0
       |   END AS D,
       |   'a' as e
       |from $TestProject.dataset.$tableName
       |""".stripMargin

  val sqlUtf8Char =
    s"""select a,b,c,
       |CASE
       |   WHEN A > 1000 THEN 1
       |   WHEN A <= 1000 THEN 0
       |   END AS D,
       |   e
       |from $TestProject.dataset.$tableName
       |where e = 'āō'
       |""".stripMargin

  val TestCopybook =
    """
      |01  TEST-LAYOUT-FIVE.
      |        03  A                    PIC S9(4) COMP.
      |        03  B                    PIC X(8).
      |        03  C                    PIC S9(9)V99 COMP-3.
      |        03  D                    PIC 9(01)
      |""".stripMargin

  val outFile = "TEST.DUMMY"
  val gcs = Services.storage()
  val zos = Linux

  val bq = Services.bigQuery(TestProject, "US",
    Services.bigqueryCredentials())

  val storageApi = Services.bigQueryStorage(Services.bigqueryCredentials())

  val tableId = TableId.of("dataset", tableName)

  override def beforeAll(): Unit = grecvServer = server(serverCfg)

  override def afterAll(): Unit = grecvServer.foreach(_.shutdown())

  override protected def beforeEach(): Unit = {
    val table = bq.getTable(tableId)
    if(table == null || !table.exists()) {
      val sql1 =
        s"""create or replace table $TestProject.dataset.$tableName as
           |SELECT
           | 1 as a,
           | 'a' as b,
           | NUMERIC '-3.14'as c,
           | 'āō' as e
           |""".stripMargin
      val id1 = JobId.newBuilder().setProject(TestProject).setLocation(Location).setRandomJob().build()
      bq.query(QueryJobConfiguration.newBuilder(sql1)
        .setUseLegacySql(false).build(), id1)
      val job1 = bq.getJob(id1)
      job1.waitFor(RetryOption.totalTimeout(Duration.ofMinutes(2)))
    }

    if(table.getNumRows.longValue() < 5000000) populateTable()//we don't want to rewrite data everytime
  }

  /**
   * Required env vars: BUCKET, PROJECT, COPYBOOK
   * Provide absolute path to exportCopybook.txt file.
   */
  "Full flow remote export" should "export data to binary file to GCS" in {
    val cfg = ExportConfig(
      sql = sqlWithColE + " LIMIT 1",
      projectId = TestProject,
      picTCharset = Some("UTF-8"),
      outDD = outFile,
      location = Location,
      bucket = TestBucket,
      remoteHost = serverCfg.host,
      remotePort = serverCfg.port,
      trustCertCollectionFilePath = trustCertCollectionFilePath,
      runMode = "parallel"
    )
    val res = Export.run(cfg, zos, Map.empty)

    assert(res.exitCode == 0)
    assert(res.activityCount == 1)
    assert(gcs.get(BlobId.of(TestBucket, s"EXPORT/$outFile")).exists())
  }

  "Full flow remote export" should "export data to binary file to GCS with using utf-8 charset for encoding" in {
    val cfg = ExportConfig(
      sql = sqlUtf8Char + " LIMIT 1",
      projectId = TestProject,
      picTCharset = Some("UTF-8"),
      outDD = outFile,
      location = Location,
      bucket = TestBucket,
      remoteHost = serverCfg.host,
      remotePort = serverCfg.port,
      runMode = "storage_api"
    )
    val res = Export.run(cfg, zos, Map.empty)

    assert(res.exitCode == 0)
    assert(res.activityCount == 1)
    assert(gcs.get(BlobId.of(TestBucket, s"EXPORT/$outFile")).exists())
  }

  /**
   * Required env vars: BUCKET, PROJECT
   */
  "Export binary file with high volume data" should "in single thread" in {
    val cfg = ExportConfig(
      projectId = TestProject,
      outDD = outFile,
      location = Location,
      bucket = TestBucket,
      remoteHost = serverCfg.host,
      remotePort = serverCfg.port
    )

    val gcsUri = s"gs://$TestBucket/EXPORT/$outFile"
    val sp = CopyBook(TestCopybook, Ebcdic)
    val startT = System.currentTimeMillis()
    val res = new BqSelectResultExporter(cfg, bq, zos.getInfo, sp, GcsFileExport(gcs, gcsUri, sp.LRECL)).doExport(sql)
    println(s"Single thread took : ${System.currentTimeMillis() - startT} millis.")

    assert(res.exitCode == 0)
    assert(res.activityCount == totalRows())
    assert(gcs.get(BlobId.of(TestBucket, s"EXPORT/$outFile")).exists())
  }

  "Export binary file with high volume data" should "in multiple threads" in {
    val cfg = ExportConfig(
      projectId = TestProject,
      outDD = outFile,
      location = Location,
      bucket = TestBucket,
      remoteHost = serverCfg.host,
      remotePort = serverCfg.port
    )

    val gcsUri = s"gs://$TestBucket/EXPORT/$outFile"
    val sp = CopyBook(TestCopybook, Ebcdic)

    def exporterFactory(fileSuffix: String, cfg: ExportConfig): SimpleFileExporter = {
      val result = new LocalFileExporter
      result.newExport(GcsFileExport(gcs, s"${gcsUri}/${zos.getInfo.getJobid}/tmp_$fileSuffix" , sp.LRECL))
      new SimpleFileExporterAdapter(result, cfg)
    }

    val startT = System.currentTimeMillis()
    val res = new BqSelectResultParallelExporter(cfg, bq, zos.getInfo, sp, exporterFactory).doExport(sql)
    new StorageFileCompose(gcs).composeAll(gcsUri, s"$gcsUri/${zos.getInfo.getJobid}/")
    println(s"Multi thread took : ${System.currentTimeMillis() - startT} millis.")

    assert(res.exitCode == 0)
    assert(res.activityCount == totalRows())
    assert(gcs.get(BlobId.of(TestBucket, s"EXPORT/$outFile")).exists())
  }

  "Export storage api" should "in multiple threads" in {
    val cfg = ExportConfig(
      projectId = TestProject,
      outDD = outFile,
      location = Location,
      bucket = TestBucket,
      remoteHost = serverCfg.host,
      remotePort = serverCfg.port
    )

    val gcsUri = s"gs://$TestBucket/EXPORT/$outFile"
    val sp = CopyBook(TestCopybook, Ebcdic)

    def exporterFactory(fileSuffix: String, cfg: ExportConfig): SimpleFileExporter = {
      val result = new LocalFileExporter
      result.newExport(GcsFileExport(gcs, s"${gcsUri}/${zos.getInfo.getJobid}/tmp_$fileSuffix" , sp.LRECL))
      new SimpleFileExporterAdapter(result, cfg)
    }

    val startT = System.currentTimeMillis()
    val res = new BqStorageApiExporter(cfg, storageApi, bq, exporterFactory, zos.getInfo, sp).doExport(sql)
    new StorageFileCompose(gcs).composeAll(gcsUri, s"$gcsUri/${zos.getInfo.getJobid}/")
    println(s"StorageApi took : ${System.currentTimeMillis() - startT} millis.")

    assert(res.exitCode == 0)
    assert(res.activityCount == totalRows())
    assert(gcs.get(BlobId.of(TestBucket, s"EXPORT/$outFile")).exists())
  }

  def totalRows(): Long = bq.getTable(tableId).getNumRows.longValue()

  /**
   * Populates 5 million rows in parallel.
   */
  private def populateTable(): Unit = {
    println("preparing table with high data volume")
    import scala.concurrent._
    implicit val ec: ExecutionContextExecutor = ExecutionContext.fromExecutor(Executors.newFixedThreadPool(5))

    def insetBatch(batchIndex: Int): Future[Unit] = {
      import scala.jdk.CollectionConverters._

      val endBatchIndex = batchIndex * 50000
      val startBatchIndex = endBatchIndex - 50000
      def request(i: Int): RowToInsert = {
        val content: Map[String, Any] = Map(
          "a" -> i,
          "b" -> i.toString,
          "c" -> BigDecimal(i.toDouble / 3).setScale(2, BigDecimal.RoundingMode.HALF_UP).toDouble.toString
        )
        RowToInsert.of(content.asJava)
      }

      def batch(i: Int, acc: Seq[InsertAllRequest.RowToInsert] = Seq.empty): Seq[InsertAllRequest.RowToInsert] = {
        if (i == startBatchIndex) acc
        else batch(i - 1, acc :+ request(i))
      }

      Future{
        val req = InsertAllRequest.newBuilder(tableId).setRows(batch(endBatchIndex).asJava).build()
        bq.insertAll(req)
        println(s"batch in 50k rows inserted, thread: ${Thread.currentThread().getName}, batchId: $batchIndex")
      }
    }

    val res = for(i <- 1 to 100) yield insetBatch(i)
    res.foreach(Await.result(_, scala.concurrent.duration.Duration.create(2, TimeUnit.MINUTES)))
  }
}
