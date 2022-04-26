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
