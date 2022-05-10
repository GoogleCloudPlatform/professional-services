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

import com.google.cloud.imf.gzos.pb.GRecvProto.Record

import scala.util.Random

class ByteGenerator(f: Record.Field) extends ValueGenerator {
  override def size: Int = f.getSize
  override def toString: String = s"ByteGenerator($size)"

  override def generate(buf: Array[Byte], off: Int): Int = {
    val bytes = Random.nextBytes(size)
    System.arraycopy(bytes,0,buf,off,size)
    size
  }
}
