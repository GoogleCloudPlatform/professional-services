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

class ZDataSet(srcBytes: Array[Byte],
               override val lRecl: Int,
               override val blkSize: Int,
               limit: Int = -1,
               position: Int = 0) extends ZRecordReaderT {
  private val buf = ByteBuffer.wrap(srcBytes)
  private var open = true
  private var bytesRead: Long = 0
  private var nRecordsRead: Long = 0

  if (position > 0) buf.position(position)
  if (limit >= 0) buf.limit(limit)

  override def read(bytes: Array[Byte]): Int =
    read(bytes, 0, bytes.length)

  override def read(bytes: Array[Byte], off: Int, len: Int): Int = {
    if (!buf.hasRemaining) -1
    else {
      val n = math.min(buf.remaining, len)
      buf.get(bytes, off, n)
      bytesRead += n
      nRecordsRead += 1
      n
    }
  }

  override def isOpen: Boolean = open || buf.hasRemaining
  override def close(): Unit = open = false

  override def read(dst: ByteBuffer): Int = {
    val i = dst.position()
    val n = read(dst.array, i, lRecl)
    if (n > 0) dst.position(i + n)
    n
  }

  override def getDsn: String = "DUMMY"

  /** Number of records read */
  override def count(): Long = nRecordsRead
}
