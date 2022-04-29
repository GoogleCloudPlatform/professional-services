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


import com.google.cloud.bqsh.cmd.Scp.blobId
import com.google.cloud.imf.util.Logging
import com.google.cloud.storage.{BlobInfo, Storage}
import com.google.common.io.CountingOutputStream

import java.io.{BufferedOutputStream, OutputStream}
import java.nio.channels.Channels

case class GcsFileExport(gcs: Storage, gcsOutUri: String, lrecl: Int) extends FileExport with Logging {

  val recfm: String = "FB"
  val lRecl: Int = lrecl
  lazy val os = new CountingOutputStream(openGcsUri(gcs, gcsOutUri))
  var rowsWritten: Long = 0L

  override def appendBytes(buf: Array[Byte]): Unit = {
    os.write(buf, 0, lrecl)
    rowsWritten += 1
  }

  override def close(): Unit = {
    logger.info(s"Trying to close GcsFileExport for uri:$gcsOutUri")
    os.close()
    logger.info(s"Closed GcsFileExport for uri:$gcsOutUri after writing ${os.getCount} bytes and $rowsWritten rows.")
  }

  def openGcsUri(gcs: Storage, uri: String): OutputStream = {
    val blobInfo = BlobInfo.newBuilder(blobId(uri))
      .setContentType("application/octet-stream")
      .setContentEncoding("identity").build
    openGcsBlob(gcs, blobInfo)
  }

  def openGcsBlob(gcs: Storage, blobInfo: BlobInfo): OutputStream = {
    logger.info(s"opening Cloud Storage Writer:\n$blobInfo")
    new BufferedOutputStream(Channels.newOutputStream(gcs.writer(blobInfo)), 1 * 1024 * 1024)
  }

  override def toString: String = s"GcsFileExport with uri: $gcsOutUri"
}
