/*
 * Copyright 2019 Google LLC
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

package com.google.cloud.bqhiveloader

import com.google.cloud.bigquery.{BigQuery, BigQueryOptions, StandardTableDefinition, TableId, TableInfo}
import com.google.cloud.bqhiveloader.ExternalTableManager.Orc
import com.google.cloud.bqhiveloader.MetaStore.Partition
import org.apache.spark.sql.types.DataTypes.{DoubleType, IntegerType, LongType, StringType}
import org.apache.spark.sql.types.{StructField, StructType}
import org.scalatest.{BeforeAndAfterAll, FlatSpec}


class ExternalTableManagerSpec extends FlatSpec with BeforeAndAfterAll {
  private var client: Option[BigQuery] = None

  val TestSchema = StructType(Seq(
    StructField("date", StringType),
    StructField("region", StringType),
    StructField("id", StringType),
    StructField("x", IntegerType),
    StructField("y", LongType),
    StructField("z", DoubleType)
  ))

  val TestORCSchema = StructType(Seq(
    StructField("id", StringType),
    StructField("x", IntegerType),
    StructField("y", LongType),
    StructField("z", DoubleType)
  ))

  val TestProject = "retail-poc-demo"
  val TestBucket = "bq_hive_load_demo"
  val TestTable = s"test_1541"

  val TestPartition = Partition(Seq(("region", "US"),("date", "2019-04-11")),"")
  val LoadDataset = "load_tmp"
  val TargetDataset = "load_target"
  val ExtTableId: TableId = TableId.of(TestProject,LoadDataset,TestTable+"_ext")
  val TargetTableId: TableId = TableId.of(TestProject,TargetDataset,TestTable)

  def newClient(): BigQuery = {
    BigQueryOptions
      .getDefaultInstance
      .toBuilder
      .setProjectId(TestProject)
      .build()
      .getService
  }

  override def beforeAll(): Unit = {
    client = Option(newClient())
  }

  def getBigQuery: BigQuery = {
    if (client.isDefined) client.get
    else {
      client = Option(newClient())
      client.get
    }
  }

  "ExternalTableManager" should "Generate SQL" in {
    val extTable = TableId.of("project", "dataset", "table")
    val generatedSql = SQLGenerator.generateSelectFromExternalTable(
      extTable = extTable,
      schema = TestSchema,
      partition = TestPartition,
      unusedColumnName = "unused")
    val expectedSql =
      """select
        |  'US' as region,
        |  '2019-04-11' as date,
        |  id,
        |  x,
        |  y,
        |  z
        |from `project.dataset.table`""".stripMargin
    assert(generatedSql == expectedSql)
  }

  it should "define external table" in {
    val schema = Mapping.convertStructType(TestORCSchema)
    val locations = Seq(
      s"gs://$TestBucket/test/US_2019-04-11_part_11.snappy.orc"
    )
    val createdTable = ExternalTableManager.create(
      ExtTableId,
      schema,
      locations,
      Orc,
      getBigQuery,
      false)
    System.out.println(createdTable)
  }

  it should "select into new table" in {
    val bq = getBigQuery
    bq.create(TableInfo.of(TargetTableId, StandardTableDefinition.of(Mapping.convertStructType(TestSchema))))
    Thread.sleep(5000)
    ExternalTableManager.loadPart(
      destTableId = TargetTableId,
      schema = TestSchema,
      partition = TestPartition,
      extTableId = ExtTableId,
      unusedColumnName = "unused",
      partColFormats = Map.empty,
      bigqueryWrite = bq,
      batch = false
    )
  }

  it should "parse date format" in {
    import ExternalTableManager._
    val fmt = "%Y%U"
    val fmt2 = "YYYYWW"
    val fmt3 = "%Y%V"

    assert(getAsDate("201900", fmt) == "2018-12-30")
    assert(getAsDate("201901", fmt) == "2019-01-06")
    assert(getAsDate("201902", fmt) == "2019-01-13")
    assert(getAsDate("201901", fmt2) == "2018-12-30")
    assert(getAsDate("201902", fmt2) == "2019-01-06")
    assert(getAsDate("201901", fmt3) == "2018-12-31")
    assert(getAsDate("201701", fmt3) == "2017-01-09")
  }

  it should "parse YRWK" in {
    import ExternalTableManager._
    val fmt = "YRWK"
    assert(getAsDate("201901", fmt) == "2019-01-01")
    assert(getAsDate("201902", fmt) == "2019-01-08")
    assert(getAsDate("201951", fmt) == "2019-12-17")
    assert(getAsDate("201952", fmt) == "2019-12-24")
    assert(getAsDate("201953", fmt) == "2019-12-31")

    assert(getAsDate("202001", fmt) == "2020-01-01")
    assert(getAsDate("202002", fmt) == "2020-01-08")
    assert(getAsDate("202051", fmt) == "2020-12-16")
    assert(getAsDate("202052", fmt) == "2020-12-23")
    assert(getAsDate("202053", fmt) == "2020-12-30")

    assert(getAsDate("202101", fmt) == "2021-01-01")
    assert(getAsDate("202102", fmt) == "2021-01-08")
    assert(getAsDate("202151", fmt) == "2021-12-17")
    assert(getAsDate("202152", fmt) == "2021-12-24")
    assert(getAsDate("202153", fmt) == "2021-12-31")
  }
}
