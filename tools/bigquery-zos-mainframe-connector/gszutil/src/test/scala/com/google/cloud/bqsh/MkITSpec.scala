package com.google.cloud.bqsh

import com.google.cloud.bqsh.cmd.Mk
import com.google.cloud.imf.gzos.Util
import org.scalatest.flatspec.AnyFlatSpec

import java.util.concurrent.Executors
import scala.concurrent.duration.Duration
import scala.concurrent.{Await, ExecutionContext, Future}

class MkITSpec extends AnyFlatSpec {
  it should "execute multiple mk jobs" in {
    val projectId = sys.env.get("PROJECT_ID")
    val datasetId = sys.env.get("DATASET_ID")
    val zos = Util.zProvider
    zos.init()
    val table = s"""test_tbl""".stripMargin
    val schema = Seq("STRINGCOL:STRING")

    implicit val ec = ExecutionContext.fromExecutor(Executors.newWorkStealingPool(5))
    val futures = (1 to 5).map{i =>
      Future {
        Mk.run(MkConfig(
          projectId = projectId.get,
          datasetId = datasetId.get,
          table = true,
          tablespec = table + i,
          schema = schema
        ), zos, Map.empty)
      }
    }

    val results = Await.result(Future.sequence(futures),
      Duration(5, "min"))
    require(results.forall(_.exitCode == 0))

  }

}