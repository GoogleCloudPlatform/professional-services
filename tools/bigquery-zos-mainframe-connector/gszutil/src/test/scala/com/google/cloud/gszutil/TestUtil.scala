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

package com.google.cloud.gszutil

import java.nio.ByteBuffer
import java.nio.charset.{Charset, StandardCharsets}

import com.google.common.io.Resources

object TestUtil {
  def resource(name: String): Array[Byte] = Resources.toByteArray(Resources.getResource(name))
  def getBytes(name: String): ByteBuffer = ByteBuffer.wrap(resource(name))

  def getData(name: String,
              srcCharset: Charset = StandardCharsets.UTF_8,
              destCharset: Charset = StandardCharsets.UTF_8): ByteBuffer = {
    val bytes = new String(resource(name), srcCharset).filterNot(_ == '\n')
      .getBytes(destCharset)
    ByteBuffer.wrap(bytes)
  }
}
