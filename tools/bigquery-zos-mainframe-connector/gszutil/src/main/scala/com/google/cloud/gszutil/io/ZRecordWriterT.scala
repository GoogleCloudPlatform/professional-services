package com.google.cloud.gszutil.io

import java.nio.ByteBuffer
import java.nio.channels.WritableByteChannel

trait ZRecordWriterT extends WritableByteChannel {
  def write(src: Array[Byte]): Unit
  def flush(): Unit
  override def write(src: ByteBuffer): Int
  override def isOpen: Boolean
  override def close(): Unit

  /** Record length */
  val lRecl: Int

  /** Maximum block size */
  val blkSize: Int

  val recfm: String

  /** Number of records read */
  def count(): Long

  /** DSN */
  def getDsn: String
}
