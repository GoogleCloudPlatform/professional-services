package com.google.cloud.imf.gzos.gen

import com.google.cloud.imf.gzos.Binary
import com.google.cloud.imf.gzos.pb.GRecvProto.Record

class IntegerGenerator(f: Record.Field) extends ValueGenerator {
  override val size: Int = f.getSize
  override def toString: String = s"IntegerGenerator(${f.getSize})"
  private var i = 1
  override def generate(buf: Array[Byte], off: Int): Int = {
    Binary.encode(i, size, buf, off)
    i += 1
    size
  }
}
