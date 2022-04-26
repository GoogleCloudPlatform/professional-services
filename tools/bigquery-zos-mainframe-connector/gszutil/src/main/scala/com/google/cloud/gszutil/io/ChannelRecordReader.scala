/*
 * Copyright 2019 Google LLC All Rights Reserved.
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
import java.nio.channels.ReadableByteChannel

class ChannelRecordReader(rc: ReadableByteChannel, recordLength: Int, blockSize: Int)
  extends ZRecordReaderT {

  private var a: Array[Byte] = _
  private var b: ByteBuffer = _
  private var nRecordsRead: Long = 0

  override def getDsn: String = "DUMMY"

  override def read(buf: Array[Byte]): Int = read(buf, 0, buf.length)

  override def read(buf: Array[Byte], off: Int, len: Int): Int = {
    if (a == null || !buf.equals(a)) {
      a = buf
      b = ByteBuffer.wrap(a)
    }
    b.position(off)
    b.limit(off + len)
    val n = rc.read(b)
    if (n >= lRecl)
      nRecordsRead += n / lRecl
    n
  }

  override def close(): Unit = rc.close()

  override def isOpen: Boolean = rc.isOpen

  override val lRecl: Int = recordLength

  override val blkSize: Int = blockSize

  override def read(dst: ByteBuffer): Int = rc.read(dst)

  override def count(): Long = nRecordsRead
}
