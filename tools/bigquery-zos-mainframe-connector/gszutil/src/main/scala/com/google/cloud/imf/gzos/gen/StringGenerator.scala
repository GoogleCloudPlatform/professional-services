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

import com.google.cloud.imf.gzos.pb.GRecvProto.Record

class StringGenerator(f: Record.Field, charset: Charset) extends ValueGenerator {
  override val size: Int = f.getSize
  override def toString: String = s"StringGenerator(${f.getSize},${charset.displayName()})"
  private val chars: String = "abcdefghijklmnopqrstuvwxyz0123456789"
  private var i = 1
  protected def str(i: Int): String = {
    var j = i
    val sb = new StringBuilder
    while (j > 0){
      sb.append(chars(j%36))
      j /= 36
    }
    sb.result()
  }
  override def generate(buf: Array[Byte], off: Int): Int = {
    val generated = str(i).reverse.padTo(size,' ').reverse
    val bytes = generated.getBytes(charset)
    i += 1
    System.arraycopy(bytes,0,buf,off,size)
    size
  }
}
