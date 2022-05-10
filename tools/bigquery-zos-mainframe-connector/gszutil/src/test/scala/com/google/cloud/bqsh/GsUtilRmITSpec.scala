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

import com.google.cloud.bqsh.cmd.GsUtilRm
import com.google.cloud.gszutil.TestUtil
import com.google.cloud.imf.gzos.Util
import com.google.cloud.imf.util.Services
import org.scalatest.flatspec.AnyFlatSpec

import java.util.concurrent.Executors
import scala.concurrent.duration.Duration
import scala.concurrent.{Await, ExecutionContext, Future}
import com.google.cloud.storage.BlobId
import com.google.cloud.storage.BlobInfo

class GsUtilRmITSpec extends AnyFlatSpec {
  it should "execute multiple gsutil rm jobs" in {
    val bucket = sys.env.get("BUCKET")
    val zos = Util.zProvider
    zos.init()
    val gcs = Services.storage(zos.getCredentialProvider().getCredentials)

    for (i <- 0 to 5) {
      val filename = if (i <= 2) s"vartext$i.txt" else s"mload${i - 3}.dat"
      val blobId = BlobId.of(bucket.get, filename)
      val blobInfo = BlobInfo.newBuilder(blobId).build
      gcs.create(blobInfo, TestUtil.resource(filename))
    }

    implicit val ec = ExecutionContext.fromExecutor(Executors.newWorkStealingPool(10))
    val futures = (0 to 5).map{ i =>
      Future {
        GsUtilRm.run(GsUtilConfig(
          gcsUri = if (i <= 2) s"gs://$bucket/vartext$i.txt" else s"gs://$bucket/mload${i - 3}.dat"
        ), zos, Map.empty)
      }
    }

    val results = Await.result(Future.sequence(futures),
      Duration(5, "min"))
    require(results.forall(_.exitCode == 0))
  }

}