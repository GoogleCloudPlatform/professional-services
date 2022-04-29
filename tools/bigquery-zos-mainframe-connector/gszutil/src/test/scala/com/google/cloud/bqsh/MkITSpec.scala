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