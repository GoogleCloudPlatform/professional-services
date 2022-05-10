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

import java.time.{LocalDate, ZoneId}

import com.google.cloud.imf.gzos.Binary
import com.google.cloud.imf.gzos.pb.GRecvProto.Record

/** generates integer dates
  *
  * @param f
  */
class IntDateGenerator(f: Record.Field) extends ValueGenerator {
  override val size: Int = f.getSize
  override def toString: String = s"IntDateGenerator($size)"
  private val startDate = LocalDate.now(ZoneId.of("Etc/UTC")).minusDays(30)
  private var i = 0

  override def generate(buf: Array[Byte], off: Int): Int = {
    val genDate = startDate.plusDays(i)
    val genInt = ((((genDate.getYear - 1900) * 100) +
      genDate.getMonthValue) * 100) +
      genDate.getDayOfMonth
    i += 1
    Binary.encode(genInt, size, buf, off)
    size
  }
}

