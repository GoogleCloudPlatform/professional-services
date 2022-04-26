package com.google.cloud.imf.gzos.gen

import java.time.{LocalDate, ZoneId}

import com.google.cloud.imf.gzos.Binary
import com.google.cloud.imf.gzos.pb.GRecvProto.Record

/** generates integer dates
  *
  * @param f
  */
class IntDateGenerator(f: Record.Field) extends ValueGenerator {
  override val size: Int = f.getSize
  override def toString: String = s"IntDateGenerator($size)"
  private val startDate = LocalDate.now(ZoneId.of("Etc/UTC")).minusDays(30)
  private var i = 0

  override def generate(buf: Array[Byte], off: Int): Int = {
    val genDate = startDate.plusDays(i)
    val genInt = ((((genDate.getYear - 1900) * 100) +
      genDate.getMonthValue) * 100) +
      genDate.getDayOfMonth
    i += 1
    Binary.encode(genInt, size, buf, off)
    size
  }
}

