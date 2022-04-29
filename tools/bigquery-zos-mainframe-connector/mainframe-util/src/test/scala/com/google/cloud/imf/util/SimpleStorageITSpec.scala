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

package com.google.cloud.imf.util

import java.util.zip.GZIPOutputStream

import com.google.auth.oauth2.AccessToken
import org.scalatest.flatspec.AnyFlatSpec

import scala.util.Random

class SimpleStorageITSpec extends AnyFlatSpec {
  lazy val token: AccessToken = Services.storageCredentials().refreshAccessToken()
  def bucket: String = sys.env("BUCKET")
  def obj: String = sys.env("OBJ")

  "gcs" should "post" in {
    val os = new StorageObjectOutputStream(token, bucket, obj, print = true)
    val gzos = new GZIPOutputStream(os,32*1024, true)

    val n = 256*1024
    val buf = new Array[Byte](n)

    var m: Long = 0
    val rng = new Random()
    val limit = n*2
    while (m <= limit){
      rng.nextBytes(buf)
      gzos.write(buf, 0, n)
      m += n
    }
    gzos.close()
  }

  it should "get" in {
    val is = new StorageObjectInputStream(token, bucket, obj, print = true)
    val bytes = new InputStreamByteSource(is).read()
    System.out.println(s"${bytes.length}")
  }
}
