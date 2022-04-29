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

import com.google.cloud.gszutil.io.ZRecordWriterT
import com.google.cloud.imf.gzos.MVS
import com.google.cloud.imf.util.Logging

import java.nio.ByteBuffer

case class MVSFileExport(outDD: String, zos: MVS) extends FileExport with Logging {
  val ddName: String = outDD
  logger.debug(s"Initializing writer for DD:$ddName")
  val writer: ZRecordWriterT = zos.writeDD(ddName)
  val dsn: String = writer.getDsn
  logger.debug(s"Opened DSN: $dsn")
  val lRecl: Int = writer.lRecl
  val recfm: String = writer.recfm
  private val buf = ByteBuffer.allocate(lRecl)
  private var bytesWritten = 0L

  override def appendBytes(bytes: Array[Byte]): Unit = {
    buf.clear()
    buf.put(bytes)
    buf.flip()
    writer.write(buf)
    bytesWritten += bytes.length
  }

  override def close(): Unit = {
    logger.info(s"Closing RecordWriter for DD:$ddName DSN:$dsn after writing $bytesWritten bytes")
    writer.flush()
    writer.close()
  }

  override def rowsWritten(): Long = writer.count()
}
