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

package com.google.cloud.imf.grecv

import com.google.cloud.bqsh.GsUtilConfig
import com.google.cloud.bqsh.cmd.Cp
import com.google.cloud.gszutil.io.ZDataSet
import com.google.cloud.gszutil.{CopyBook, RecordSchema, SchemaProvider, TestUtil}
import com.google.cloud.imf.grecv.client.GRecvClient
import com.google.cloud.imf.grecv.server.GRecvServer
import com.google.cloud.imf.gzos.gen.DataGenUtil
import com.google.cloud.imf.gzos.pb.GRecvProto.Record.Field
import com.google.cloud.imf.gzos.pb.GRecvProto.{GRecvRequest, Record}
import com.google.cloud.imf.gzos.{Linux, PackedDecimal, Util}
import com.google.cloud.imf.util.Services
import com.google.protobuf.ByteString
import com.google.protobuf.util.JsonFormat
import org.scalatest.BeforeAndAfterAll
import org.scalatest.flatspec.AnyFlatSpec

import java.nio.charset.StandardCharsets
import java.util.concurrent.Executors
import scala.concurrent.ExecutionContext.Implicits.global
import scala.concurrent.duration.Duration
import scala.concurrent.{Await, ExecutionContext, Future}

class CpSpec2ITSpec extends AnyFlatSpec with BeforeAndAfterAll {
  val TestBucket = sys.env("BUCKET")
  val TestProject = sys.env("PROJECT")
  val TestDataset = sys.env("DATASET")
  val trustCertCollectionFilePath = sys.env("TRUST_CERT_COLLECTION_FILE_PATH")
  val bqFunc = (x: String, y: String, _: ByteString) => Services.bigQuery(x, y, Services.storageCredentials())
  val bqStorageFunc = (_: ByteString) => Services.bigQueryStorage(Services.storageCredentials())

  def server(cfg: GRecvConfig): Future[GRecvServer] = Future {
    val s = new GRecvServer(cfg, _ => Services.storage(), bqStorageFunc, _ => Services.storageApi(Services.storageCredentials()), bqFunc)
    s.start(block = false)
    s
  }

  val serverCfg = GRecvConfig("127.0.0.1", debug = true)
  private var grecvServer: Future[GRecvServer] = _

  override def beforeAll(): Unit = {
    grecvServer = server(serverCfg)
  }

  override def afterAll(): Unit = {
    grecvServer.foreach(_.shutdown())
  }

  "Cp" should "copy" in {
    val copybook = new String(TestUtil.resource("FLASH_STORE_DEPT.cpy.txt"),
      StandardCharsets.UTF_8)
    val schema = CopyBook(copybook).toRecordBuilder.build
    JsonFormat.printer().print(schema)
    val schemaProvider = RecordSchema(schema)

    val input = new ZDataSet(TestUtil.resource("FLASH_STORE_DEPT_50k.bin"),136, 27880)

    val cfg1 = GsUtilConfig(schemaProvider = Option(schemaProvider),
                           gcsUri = s"gs://$TestBucket/FLASH_STORE_DEPT",
                           projectId = TestProject,
                           datasetId = "dataset",
                           testInput = Option(input),
                           parallelism = 1,
                           nConnections = 3,
                           replace = true,
                           remote = true,
                           remoteHost = serverCfg.host,
                           remotePort = serverCfg.port)
    val res = Cp.run(cfg1, Linux, Map.empty)
    assert(res.exitCode == 0)
  }

  "GRecvClient" should "upload" in {
    val copyBook = CopyBook(
      """    01  TEST-LAYOUT-FIVE.
        |        03  COL-A                    PIC S9(9) COMP.
        |        03  COL-B                    PIC S9(4) COMP.
        |        03  COL-C                    PIC S9(4) COMP.
        |        03  COL-D                    PIC X(01).
        |        03  COL-E                    PIC S9(9) COMP.
        |        03  COL-F                    PIC S9(07)V9(2) COMP-3.
        |        03  COL-G                    PIC S9(05)V9(4) COMP-3.
        |        03  COL-H                    PIC S9(9) COMP.
        |        03  COL-I                    PIC S9(9) COMP.
        |        03  COL-J                    PIC S9(4) COMP.
        |        03  COL-K                    PIC S9(16)V9(2) COMP-3.
        |        03  COL-L                    PIC S9(16)V9(2) COMP-3.
        |        03  COL-M                    PIC S9(16)V9(2) COMP-3.
        |        03  COL-N                    PIC X(4064)
        |""".stripMargin)

    val record = copyBook.toRecordBuilder.build
    val sp = RecordSchema(record)
    val in = DataGenUtil.generatorFor(sp, 100)
    val request = GRecvRequest.newBuilder
      .setSchema(record)
      .setLrecl(in.lRecl)
      .setBlksz(in.blkSize)
      .setBasepath(s"gs://$TestBucket/prefix")
      .setKeyfile(ByteString.EMPTY)
      .build

    val sendResult = GRecvClient.upload(request, serverCfg.host, serverCfg.port, trustCertCollectionFilePath, 1, Util.zProvider, in, None, None)
    assert(sendResult.exitCode == 0)
  }

  "DataGenUtil" should "generate" in {
    val sp: RecordSchema = {
      val b = Record.newBuilder
        .setEncoding("EBCDIC")
        .setSource(Record.Source.LAYOUT)
      b.addFieldBuilder().setName("STRING_COL")
        .setTyp(Field.FieldType.STRING)
        .setSize(4)
      b.addFieldBuilder().setName("DECIMAL_COL")
        .setTyp(Field.FieldType.DECIMAL)
        .setSize(PackedDecimal.sizeOf(5,2))
        .setPrecision(7)
        .setScale(2)
      b.addFieldBuilder().setName("INTEGER_COL")
        .setTyp(Field.FieldType.INTEGER)
        .setSize(4)
      RecordSchema(b.build)
    }
    val generator = DataGenUtil.generatorFor(sp, 100)
    val cfg = GsUtilConfig(schemaProvider = Option(sp),
      gcsUri = s"gs://$TestBucket/GENERATED",
      testInput = Option(generator),
      parallelism = 1,
      nConnections = 2,
      replace = true,
      remote = true,
      remoteHost = serverCfg.host,
      remotePort = serverCfg.port)
    val res = Cp.run(cfg, Linux, Map.empty)
    assert(res.exitCode == 0)
  }

  "Should change the provided schema" should "generate" in {
    val sp: SchemaProvider = CopyBook(
      """        01  TEST-LAYOUT-FIVE.
        03  ITEM-NBR                  PIC S9(9) COMP.
 |03  STORE-NBR                       PIC S9(9) COMP.
 |03  WM-YR-WK                        PIC S9(9) COMP.
 |03  VENDOR-NBR                      PIC S9(9) COMP.
 |03  EPC-MANAGER-NBR                 PIC X(12).
 |03  CASE-REC-QTY                    PIC S9(16)V9(2) COMP-3.
 |03  CASE-REC-SCAN-QTY               PIC S9(16)V9(2) COMP-3.
 |03  REC-READ-RATE-PCT               PIC S9(16)V9(2) COMP-3.
        |""".stripMargin)

    val generator = DataGenUtil.generatorFor(sp, 1)
    val cfg = GsUtilConfig(schemaProvider = Option(sp),
      gcsUri = s"gs://$TestBucket/test1",
      testInput = Option(generator),
      parallelism = 1,
      nConnections = 2,
      replace = true,
      remote = false,
      remoteHost = serverCfg.host,
      remotePort = serverCfg.port
      ,
      tfGCS = s"gs://$TestBucket/trs/tr.json"
    )
    val res = Cp.run(cfg, Linux, Map.empty)
    assert(res.exitCode == 0)
  }

  "Merger" should "merger fields" in {

    val sj =
      """{
        |  "source": "",
        |  "original": "",
        |  "field": [
        |    {
        |      "name": "COL_A",
        |      "typ": 1,
        |      "size": 1,
        |      "precision": 1,
        |      "scale": 1,
        |      "filler": false,
        |      "NullIf": {
        |        "filed": "",
        |        "value": ""
        |      },
        |      "cast": 1,
        |      "format": ""
        |    },
        |    {
        |      "name": "COL_D",
        |      "typ":2,
        |      "size": 1,
        |      "precision": 1,
        |      "scale": 1,
        |      "filler": false,
        |      "NullIf": {
        |        "filed": true,
        |        "value": ""
        |      },
        |      "cast": 1,
        |      "format": ""
        |    }
        |  ],
        |  "encoding": "",
        |  "vartext": false,
        |  "delimiter": ""
        |}""".stripMargin

    val schema: SchemaProvider = CopyBook(
      """    01  TEST-LAYOUT-FIVE.
        |        03  COL-A                    PIC S9(9) COMP.
        |        03  COL-B                    PIC S9(4) COMP.
        |        03  COL-C                    PIC S9(4) COMP.
        |        03  COL-D                    PIC X(01).
        |        03  COL-E                    PIC S9(9) COMP.
        |        03  COL-F                    PIC S9(07)V9(2) COMP-3.
        |        03  COL-G                    PIC S9(05)V9(4) COMP-3.
        |        03  COL-H                    PIC S9(9) COMP.
        |        03  COL-I                    PIC S9(9) COMP.
        |        03  COL-J                    PIC S9(4) COMP.
        |        03  COL-K                    PIC S9(16)V9(2) COMP-3.
        |        03  COL-L                    PIC S9(16)V9(2) COMP-3.
        |        03  COL-M                    PIC S9(16)V9(2) COMP-3.
        |""".stripMargin)

    val filds = schema.decoders
    val fildNames = schema.fieldNames
    val rb = schema.toRecordBuilder.build()
    val r = Cp.parseRecord(Option(sj)).get


    val newSchema = Cp.merge(schema, r)

    val sc = filds.zip(fildNames)
    val nsc = newSchema.decoders.zip(newSchema.fieldNames)

    println(sc.mkString("\n"))
    println(" - - - - - - - ")
    println(nsc.mkString("\n"))
    assert(newSchema.decoders.size == schema.decoders.size)
    assert(newSchema.fieldNames.size == schema.fieldNames.size)

    val updatedFiled = sc.find(_._2=="COL_A").get
    assert(nsc.exists(p => p._2 == updatedFiled._2))

    val updatedFiled2 = sc.find(_._2=="COL_D").get
    assert(nsc.exists(p => p._2 == updatedFiled2._2))


  }


  "Merger2" should "merger fields" in {

    val sj =
      """{
        |  "field": [
        |    {
        |      "name": "ITEM_NBR",
        |      "typ": 2,
        |      "size": 4,
        |      "precision": 1,
        |      "scale": 1,
        |      "filler": false,
        |      "NullIf": {
        |        "filed": "",
        |        "value": ""
        |      },
        |      "cast": 1,
        |      "format": ""
        |    },
        |    {
        |      "name": "STORE_NBR",
        |      "typ":2,
        |      "size": 4,
        |      "precision": 1,
        |      "scale": 1,
        |      "filler": false,
        |      "NullIf": {
        |        "filed": true,
        |        "value": ""
        |      },
        |      "cast": 1,
        |      "format": ""
        |    }
        |  ]
        |}""".stripMargin

    val schema: SchemaProvider = CopyBook(
      """        01  TEST-LAYOUT-FIVE.
        03  ITEM-NBR                        PIC S9(9) COMP.
 |03  STORE-NBR                       PIC S9(9) COMP.
 |03  WM-YR-WK                        PIC S9(9) COMP.
 |03  VENDOR-NBR                      PIC S9(9) COMP.
 |03  EPC-MANAGER-NBR                 PIC X(12).
 |03  CASE-REC-QTY                    PIC S9(16)V9(2) COMP-3.
 |03  CASE-REC-SCAN-QTY               PIC S9(16)V9(2) COMP-3.
 |03  REC-READ-RATE-PCT               PIC S9(16)V9(2) COMP-3.
        |""".stripMargin)

    val filds = schema.decoders
    val fildNames = schema.fieldNames
    val rb = schema.toRecordBuilder.build()
    val r = Cp.parseRecord(Option(sj)).get


    val newSchema = Cp.merge(schema, r)

    val sc = filds.zip(fildNames)
    val nsc = newSchema.decoders.zip(newSchema.fieldNames)

    println(sc.mkString("\n"))
    println(" - - - - - - - ")
    println(nsc.mkString("\n"))
    assert(newSchema.decoders.size == schema.decoders.size)
    assert(newSchema.fieldNames.size == schema.fieldNames.size)

    val updatedFiled = sc.find(_._2=="STORE_NBR").get
    assert(nsc.exists(p => p._2 == updatedFiled._2))

    val updatedFiled2 = sc.find(_._2=="ITEM_NBR").get
    assert(nsc.exists(p => p._2 == updatedFiled2._2))


  }

  it should "execute multiple cp jobs" in {
    val zos = Util.zProvider
        zos.init()
    val schema = CopyBook(
      """    01  TEST-LAYOUT-FIVE.
        |        03  COL-A                    PIC S9(9) COMP.
        |        03  COL-B                    PIC S9(4) COMP.
        |""".stripMargin).toRecordBuilder.build
    val schemaProvider = RecordSchema(schema)
    val input = DataGenUtil.generatorFor(schemaProvider, 10)

    implicit val ec = ExecutionContext.fromExecutor(Executors.newWorkStealingPool(10))
    val futures = (0 to 10).map{i =>
      Future {
        val cfg1 = GsUtilConfig(schemaProvider = Option(schemaProvider),
          gcsUri = s"gs://$TestBucket/testFile" + i,
          projectId = TestProject,
          datasetId = TestDataset,
          testInput = Option(input),
          parallelism = 1,
          nConnections = 3,
          replace = true,
          remote = true,
          remoteHost = serverCfg.host,
          remotePort = serverCfg.port)
        Cp.run(cfg1, zos, Map.empty)
      }
    }

    val results = Await.result(Future.sequence(futures),
      Duration(5, "min"))
    require(results.forall(_.exitCode == 0))
  }

}
