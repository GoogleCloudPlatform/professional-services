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