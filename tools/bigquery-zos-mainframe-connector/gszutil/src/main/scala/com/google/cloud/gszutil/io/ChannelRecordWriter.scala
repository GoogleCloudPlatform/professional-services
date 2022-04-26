package com.google.cloud.gszutil.io
import java.nio.ByteBuffer
import java.nio.channels.WritableByteChannel

case class ChannelRecordWriter(channel: WritableByteChannel,
                               lrecl: Int,
                               blksize: Int) extends ZRecordWriterT {
  override val lRecl: Int = lrecl
  override val blkSize: Int = blksize
  private var nRecordsWritten: Int = 0
  override val recfm: String = "FB"

  override def write(src: Array[Byte]): Unit = {
    channel.write(ByteBuffer.wrap(src))
  }

  override def flush(): Unit = {}

  override def write(src: ByteBuffer): Int = {
    channel.write(src)
    nRecordsWritten = nRecordsWritten + 1

    nRecordsWritten
  }

  override def isOpen: Boolean = channel.isOpen

  override def close(): Unit = channel.close()


  /** Number of records written */
  override def count(): Long = {
    nRecordsWritten
  }

  /** DSN */
  override def getDsn: String = "DUMMY"
}
