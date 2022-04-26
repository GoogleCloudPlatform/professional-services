package com.google.cloud.gszutil

import java.nio.ByteBuffer
import java.nio.charset.Charset
import java.time.LocalDate
import java.time.format.DateTimeFormatter

trait Transcoder {
  val charset: Charset
  val SP: Byte

  @inline
  protected final def uint(b: Byte): Int = if (b < 0) 256 + b else b

  protected final lazy val bytes: Array[Byte] = {
    val buf = ByteBuffer.wrap((0 until 256).map(_.toByte).toArray)
    charset.decode(buf)
      .toString
      .toCharArray
      .map(_.toByte)
  }

  /** Read String from EBCDIC in ByteBuffer */
  @inline
  final def getString(buf: ByteBuffer, size: Int): String = {
    val i1 = buf.position() + size
    val s = new String(buf.array, buf.position(), size, charset)
    buf.position(i1)
    s
  }

  /** Read EBCDIC in ByteBuffer */
  @inline
  final def arraycopy(buf: ByteBuffer, dest: Array[Byte], destPos: Int, size: Int): Array[Byte] = {
    val i1 = buf.position() + size
    System.arraycopy(buf.array, buf.position(), dest, destPos, size)
    buf.position(i1)
    var i = destPos
    while (i < destPos + size){
      dest.update(i, decodeByte(dest(i)))
      i += 1
    }
    dest
  }

  def countTrailingSpaces(src: Array[Byte], off: Int, len: Int): Int = {
    var i = off + len - 1
    var n = 0
    while (i >= off) {
      if (src(i) == SP)
        n += 1
      else return n
      i -= 1
    }
    n
  }

  /** Read Long from EBCDIC in ByteBuffer */
  @inline
  final def getLong(buf: ByteBuffer, size: Int): Long = {
    val i1 = buf.position() + size
    val s = new String(buf.array, buf.position(), size, charset).filter(c => c.isDigit || c == '-')
    buf.position(i1)
    s.toLong
  }

  /** Read Epoch Day from EBCDIC in ByteBuffer */
  def getEpochDay(buf: ByteBuffer, size: Int, fmt: DateTimeFormatter): Option[Long] = {
    val s = new String(buf.array, buf.position(), size, charset)
    val s1 = s.filter(_.isDigit)
    val i1 = buf.position() + size
    buf.position(i1)
    if (s1.nonEmpty) Option(LocalDate.from(fmt.parse(s1)).toEpochDay)
    else None
  }

  /** Convert byte from EBCDIC to ASCII */
  @inline
  final def decodeByte(b: Byte): Byte = bytes(uint(b))

  /** Convert byte array from EBCDIC to ASCII in place */
  @inline
  final def decodeBytes(a: Array[Byte]): Array[Byte] = {
    var i = 0
    while (i < a.length){
      a.update(i, decodeByte(a(i)))
      i += 1
    }
    a
  }
}
