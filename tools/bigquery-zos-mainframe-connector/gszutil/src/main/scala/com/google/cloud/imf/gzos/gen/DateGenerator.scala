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

package com.google.cloud.imf.gzos.gen

import java.nio.charset.Charset
import java.time.format.DateTimeFormatter
import java.time.{LocalDate, ZoneId}

import com.google.cloud.imf.gzos.pb.GRecvProto.Record

class DateGenerator(f: Record.Field, charset: Charset) extends ValueGenerator {
  override val size: Int = f.getSize
  override def toString: String = s"DateGenerator($size,${charset.displayName})"
  private val pattern = f.getFormat.replaceAllLiterally("D","d").replaceAllLiterally("Y","y")
  require(pattern.length == size,
    s"pattern length $pattern does not match field size $size")
  private val fmt: DateTimeFormatter = DateTimeFormatter.ofPattern(pattern)
  private val startDate = LocalDate.now(ZoneId.of("Etc/UTC"))

  override def generate(buf: Array[Byte], off: Int): Int = {
    val generated = fmt.format(startDate)
    val bytes = generated.getBytes(charset)
    System.arraycopy(bytes, 0, buf, off, size)
    size
  }
}

