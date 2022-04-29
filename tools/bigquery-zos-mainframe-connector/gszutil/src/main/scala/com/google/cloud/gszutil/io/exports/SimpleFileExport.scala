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

package com.google.cloud.gszutil.io.exports

import java.io.{File, FileOutputStream}
import java.nio.ByteBuffer

/**
  * File export that was done mostly for testing reasons
  */
class SimpleFileExport(filepath: String, recordLength: Int) extends FileExport {
  private val out = new FileOutputStream(new File(filepath))
  private val buf = ByteBuffer.allocate(recordLength)
  private var rowCounter: Long = 0

  override def close(): Unit = out.close()

  override def recfm: String = "FB"

  override def appendBytes(data: Array[Byte]): Unit = {
    buf.clear()
    buf.put(data)
    out.write(buf.array())
    rowCounter += 1
  }

  override def rowsWritten(): Long = rowCounter

  override def lRecl: Int = recordLength
}