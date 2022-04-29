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

package com.google.cloud.gszutil.io

import java.nio.ByteBuffer

class RandomBytes(val size: Long, blkSz: Int, lrecl: Int) extends ZRecordReaderT {
  private var consumed: Long = 0
  private var bb: ByteBuffer = _

  override def read(dst: ByteBuffer): Int = {
    val startPos = dst.position()
    if (consumed >= size) return -1
    var i = 111111L
    while (dst.remaining >= 32) {
      dst.putLong(i)
      dst.putLong(i)
      dst.putLong(i)
      dst.putLong(i)
      i += 1
    }
    while (dst.hasRemaining)
      dst.put('x'.toByte)
    val n = dst.position() - startPos
    consumed += n
    n
  }

  private var open = true
  override def close(): Unit = open = false
  override def isOpen: Boolean = open

  override def read(buf: Array[Byte]): Int =
    read(buf, 0, buf.length)

  override def read(buf: Array[Byte], off: Int, len: Int): Int = {
    if (bb == null || bb.array != buf) bb = ByteBuffer.wrap(buf)
    bb.clear()
    bb.position(off)
    bb.limit(off + len)
    read(bb)
  }

  override val lRecl: Int = lrecl
  override val blkSize: Int = blkSz
  override def getDsn: String = "???"
  override def count(): Long = consumed / lrecl
}
