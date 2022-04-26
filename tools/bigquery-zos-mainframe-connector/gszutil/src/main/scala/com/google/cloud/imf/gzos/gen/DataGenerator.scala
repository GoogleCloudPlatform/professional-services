package com.google.cloud.imf.gzos.gen

import java.nio.ByteBuffer
import java.nio.charset.Charset

import com.google.cloud.gszutil.SchemaProvider
import com.google.cloud.gszutil.io.ZRecordReaderT
import com.google.cloud.imf.gzos.pb.GRecvProto.Record
import com.google.cloud.imf.util.Logging

import scala.jdk.CollectionConverters.ListHasAsScala

class DataGenerator(sp: SchemaProvider, nRecords: Long, charset: Charset)
  extends ZRecordReaderT with Logging {
  override val lRecl: Int = sp.LRECL
  override val blkSize: Int = lRecl * 1024
  private val fields: Seq[Record.Field] = sp.toRecordBuilder.getFieldList.asScala.toIndexedSeq
  private val record: Array[Byte] = new Array[Byte](lRecl)
  private val n: Long = nRecords
  private var i: Long = 0
  private var isClosed = false
  val generators: Seq[ValueGenerator] = fields.map(DataGenUtil.getGenerator(_, charset))

  private def genRecord(): Unit = {
    var pos = 0
    var i = 0
    try {
      while (i < generators.length){
        val gen = generators(i)
        pos += gen.generate(record, pos)
        i += 1
      }
    } catch {
      case e: Throwable =>
        logger.error(s"failed on column $i", e)
    }
  }

  override def read(buf: Array[Byte]): Int = read(buf, 0, lRecl)

  override def read(buf: Array[Byte], off: Int, len: Int): Int = {
    if (i < n) {
      i += 1
      genRecord()
      System.arraycopy(record,0,buf,off,len)
      lRecl
    } else -1
  }

  override def close(): Unit = isClosed = true

  override def isOpen: Boolean = !isClosed

  override def getDsn: String = "GENERATED"

  override def count(): Long = i

  override def read(dst: ByteBuffer): Int = {
    if (i < n){
      genRecord()
      dst.put(record)
      i += 1
      lRecl
    } else -1
  }
}
