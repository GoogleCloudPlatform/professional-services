package com.google.cloud.imf.gzos.gen

import com.google.cloud.imf.gzos.pb.GRecvProto.Record

import scala.util.Random

class ByteGenerator(f: Record.Field) extends ValueGenerator {
  override def size: Int = f.getSize
  override def toString: String = s"ByteGenerator($size)"

  override def generate(buf: Array[Byte], off: Int): Int = {
    val bytes = Random.nextBytes(size)
    System.arraycopy(bytes,0,buf,off,size)
    size
  }
}
