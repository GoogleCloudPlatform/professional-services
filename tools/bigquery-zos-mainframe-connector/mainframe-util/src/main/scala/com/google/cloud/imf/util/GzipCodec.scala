/*
 * Copyright 2022 Google LLC All Rights Reserved.
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

import java.io.{InputStream, OutputStream}
import java.util.zip.{GZIPInputStream, GZIPOutputStream}

import io.grpc.{Codec, CompressorRegistry}

object GzipCodec extends Codec {
  override def getMessageEncoding: String = "gzip"
  override def decompress(is: InputStream): InputStream = new GZIPInputStream(is,4096)
  override def compress(os: OutputStream): OutputStream = new GZIPOutputStream(os, 4096)
  val compressorRegistry: CompressorRegistry = {
    val cr = CompressorRegistry.newEmptyInstance
    cr.register(GzipCodec)
    cr
  }
}
