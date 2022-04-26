package com.google.cloud.imf.gzos.gen

import java.nio.charset.Charset

import com.google.cloud.imf.gzos.pb.GRecvProto.Record

class StringGenerator(f: Record.Field, charset: Charset) extends ValueGenerator {
  override val size: Int = f.getSize
  override def toString: String = s"StringGenerator(${f.getSize},${charset.displayName()})"
  private val chars: String = "abcdefghijklmnopqrstuvwxyz0123456789"
  private var i = 1
  protected def str(i: Int): String = {
    var j = i
    val sb = new StringBuilder
    while (j > 0){
      sb.append(chars(j%36))
      j /= 36
    }
    sb.result()
  }
  override def generate(buf: Array[Byte], off: Int): Int = {
    val generated = str(i).reverse.padTo(size,' ').reverse
    val bytes = generated.getBytes(charset)
    i += 1
    System.arraycopy(bytes,0,buf,off,size)
    size
  }
}
