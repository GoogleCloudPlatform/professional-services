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

import com.google.cloud.gszutil.SchemaProvider
import com.google.cloud.imf.util.Logging
import com.google.cloud.storage.Storage
import org.apache.hadoop.fs.Path

class WriterCore(schemaProvider: SchemaProvider,
                 lrecl: Int,
                 basePath: Path,
                 gcs: Storage,
                 name: String) extends Logging {
  require(schemaProvider.LRECL > 0, "LRECL must be a positive number")
  require(schemaProvider.fieldNames.nonEmpty, "schema must not be empty")
  if(schemaProvider.LRECL < lrecl) {
    logger.warn(s"Schema LRECL ${schemaProvider.LRECL} less then input lrecl $lrecl)")
  }
  val orc = new OrcContext(gcs, schemaProvider.ORCSchema, basePath, name)
  val BatchSize = 1024
  private val reader = new ZReader(schemaProvider, BatchSize, lrecl)
  private val errBuf = ByteBuffer.allocate(lrecl * BatchSize)
  private var errorCount: Long = 0
  private var bytesIn: Long = 0
  def getBytesIn: Long = bytesIn
  def getErrorCount: Long = errorCount

  def write(buf: ByteBuffer): WriteResult = {
    bytesIn += buf.limit()
    val res = orc.write(reader, buf, errBuf)
    errorCount += res.errCount
    res
  }

  def close(): Unit = {
    logger.debug("closing ORC Context")
    orc.close()
  }
}
