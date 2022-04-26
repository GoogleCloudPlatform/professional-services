/*
 * Copyright 2021 Google LLC All Rights Reserved.
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

package com.google.cloud.gszutil.io

import com.google.cloud.bqsh.cmd.Scp
import com.google.cloud.imf.grecv.server.GRecvServerListener
import com.google.cloud.imf.util.Services
import com.google.cloud.storage.BlobId
import org.scalatest.flatspec.AnyFlatSpec

import java.io.InputStream
import java.nio.charset.StandardCharsets
import scala.util.Random

class StorageITSpec extends AnyFlatSpec {

  "gcs" should "serve gzip" in {
    val gcs = Services.storage()
    val lowLevelApi = Services.storageApi(Services.storageCredentials())
    val bucket = sys.env("BUCKET")
    val name = "test1.gz"
    val obj = Scp.openGcsUri(gcs, s"gs://$bucket/$name", 8, compress = true)
    val s0 = Random.alphanumeric.take(32).toString()
    val bytes = s0.getBytes(StandardCharsets.UTF_8)
    obj.write(bytes)
    obj.close()

    val blob = gcs.get(BlobId.of(bucket,name))
    val is: InputStream = GRecvServerListener.open(gcs, lowLevelApi, blob)
    val bytes1 = new Array[Byte](bytes.length)
    val n = is.read(bytes1)
    assert(n == bytes1.length)
    is.close()
    val s1 = new String(bytes1, StandardCharsets.UTF_8)
    assert(s1 == s0)
  }
}
