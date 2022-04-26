package com.google.cloud.imf.gzos.gen

import java.nio.charset.Charset
import java.time.format.DateTimeFormatter
import java.time.{LocalDate, ZoneId}

import com.google.cloud.imf.gzos.pb.GRecvProto.Record

class DateGenerator(f: Record.Field, charset: Charset) extends ValueGenerator {
  override val size: Int = f.getSize
  override def toString: String = s"DateGenerator($size,${charset.displayName})"
  private val pattern = f.getFormat.replaceAllLiterally("D","d").replaceAllLiterally("Y","y")
  require(pattern.length == size,
    s"pattern length $pattern does not match field size $size")
  private val fmt: DateTimeFormatter = DateTimeFormatter.ofPattern(pattern)
  private val startDate = LocalDate.now(ZoneId.of("Etc/UTC"))

  override def generate(buf: Array[Byte], off: Int): Int = {
    val generated = fmt.format(startDate)
    val bytes = generated.getBytes(charset)
    System.arraycopy(bytes, 0, buf, off, size)
    size
  }
}

