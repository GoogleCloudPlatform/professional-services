package com.google.cloud.gszutil.io

import java.nio.ByteBuffer

import com.google.cloud.imf.util.Logging
import com.google.cloud.storage.Storage
import org.apache.hadoop.fs.{FileSystem, Path, SimpleGCSFileSystem}
import org.apache.orc.OrcFile.WriterOptions
import org.apache.orc.impl.WriterImpl
import org.apache.orc.{OrcFile, TypeDescription, Writer}

/**
  *
  * @param gcs Cloud Storage client
  * @param schema ORC TypeDescription
  * @param basePath GCS URI where parts will be written
  * @param prefix the id of this writer which will be appended to output paths
  */
final class OrcContext(private val gcs: Storage, schema: TypeDescription,
                       basePath: Path, prefix: String)
  extends AutoCloseable with Logging {

  private final val BytesBetweenFlush: Long = 32*1024*1024
  private final val PartSize = 128L*1024*1024

  private val fs = new SimpleGCSFileSystem(gcs,
    new FileSystem.Statistics(SimpleGCSFileSystem.Scheme))
  val writerOptions: WriterOptions = OrcConfig.buildWriterOptions(schema, fs)

  private var partId: Long = -1
  private var bytesSinceLastFlush: Long = 0
  private var bytesRead: Long = 0 // bytes received across all partitions
  private var bytesWritten: Long = 0 // bytes written across all partitions
  private var rowsWritten: Long = 0 // rows written across all partitions
  private var partRowsWritten: Long = 0 // rows written to current partition
  private var errors: Long = 0 // errors across all partitions
  private var writer: Writer = _
  private var currentPath: Path = _
  newWriter() // Initialize Writer and Path

  def errPct: Double = errors.doubleValue / rowsWritten

  private def newWriter(): Unit = {
    if (writer != null) closeWriter()
    partId += 1
    val w1 = s"/$prefix-$partId.orc"
    currentPath = basePath.suffix(w1)
    writer = OrcFile.createWriter(currentPath, writerOptions)
    logger.info(s"Opened Writer for $currentPath")
  }

  override def close(): Unit = {
    if (writer != null){
      closeWriter()
      writer = null
    }
  }

  def closeWriter(): Unit = {
    writer.close()
    bytesWritten += fs.getBytesWritten()
    logger.info(s"Closed ORCWriter $currentPath")
    partRowsWritten = 0
    fs.resetStats()
  }

  /**
    *
    * @param reader
    * @param buf
    * @param err
    * @return errCount
    */
  def write(reader: ZReader, buf: ByteBuffer, err: ByteBuffer): WriteResult = {
    bytesRead += buf.limit()
    bytesSinceLastFlush += buf.limit()
    val (rowCount,errorCount) = reader.readOrc(buf, writer, err)
    errors += errorCount
    rowsWritten += rowCount
    partRowsWritten += rowCount
    if (buf.remaining > 0)
      logger.warn(s"ByteBuffer has ${buf.remaining} bytes remaining.")

    // flush write buffer
    if (bytesSinceLastFlush > BytesBetweenFlush){
      writer.asInstanceOf[WriterImpl].checkMemory(0)
      bytesSinceLastFlush = 0
    }
    val currentPartitionSize = fs.getBytesWritten()
    val partFinished = currentPartitionSize > PartSize
    val partPath = currentPath
    if (partFinished) newWriter()
    WriteResult(rowCount, errorCount, currentPartitionSize, partFinished, partPath.toString)
  }

  def getCurrentPartRowsWritten: Long = partRowsWritten
  def getCurrentPartBytesWritten: Long = fs.getBytesWritten()
  def getBytesRead: Long = bytesRead
  def getBytesWritten: Long = bytesWritten + fs.getBytesWritten()
  def getRowsWritten: Long = rowsWritten
}
