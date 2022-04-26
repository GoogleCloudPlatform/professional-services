package com.google.cloud.imf.gzos.gen

import com.google.cloud.imf.gzos.PackedDecimal
import com.google.cloud.imf.gzos.pb.GRecvProto.Record

class DecimalGenerator(f: Record.Field) extends ValueGenerator {
  override val size: Int = f.getSize
  override def toString: String = s"DecimalGenerator(${f.getSize})"
  private var i = 0
  override def generate(buf: Array[Byte], off: Int): Int = {
    PackedDecimal.pack(i, size, buf, off)
    i += 1
    size
  }
}
