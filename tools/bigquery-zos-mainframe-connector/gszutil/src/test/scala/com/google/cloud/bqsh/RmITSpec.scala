package com.google.cloud.bqsh

import com.google.cloud.bqsh.cmd.Rm
import com.google.cloud.imf.gzos.Util
import com.google.cloud.imf.util.Services
import org.scalatest.flatspec.AnyFlatSpec
import com.google.cloud.bigquery.{Field, Schema, StandardSQLTypeName, StandardTableDefinition, TableDefinition, TableId, TableInfo}

import java.util.concurrent.Executors
import scala.concurrent.duration.Duration
import scala.concurrent.{Await, ExecutionContext, Future}

class RmITSpec extends AnyFlatSpec {
  it should "execute multiple rm jobs" in {
    val projectId = sys.env.get("PROJECT_ID")
    val datasetId = sys.env.get("DATASET_ID")
    val zos = Util.zProvider
    zos.init()
    val table = s"""test_tbl""".stripMargin

    val bq = Services.bigQuery(projectId.get, "US", zos.getCredentialProvider().getCredentials)

    val schema =
      Schema.of(
        Field.of("stringField", StandardSQLTypeName.STRING))
    val tableDefinition = StandardTableDefinition.of(schema)

    for (i <- 0 to 5) {
      val tableId = BQ.resolveTableSpec(table + i, projectId.get, datasetId.get)
      if (!bq.getTable(tableId).exists()) {
        val tableInfo = TableInfo.newBuilder(
          TableId.of(datasetId.get, table + i), tableDefinition).build
        bq.create(tableInfo)
      }
    }

    implicit val ec = ExecutionContext.fromExecutor(Executors.newWorkStealingPool(5))
    val futures = (0 to 5).map{i =>
      Future {
        Rm.run(RmConfig(
          projectId = projectId.get,
          datasetId = datasetId.get,
          table = true,
          tablespec = table + i,
        ), zos, Map.empty)
      }
    }

    val results = Await.result(Future.sequence(futures),
      Duration(5, "min"))
    require(results.forall(_.exitCode == 0))

  }

}