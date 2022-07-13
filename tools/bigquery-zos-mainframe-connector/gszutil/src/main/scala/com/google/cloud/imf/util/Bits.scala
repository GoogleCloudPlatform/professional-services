package com.google.cloud.imf.util

import java.io.{InputStream, OutputStream}

object Bits extends Logging {
  val littleEndian: Boolean = !System.getProperty("java.vm.vendor").contains("IBM")

  def getInt(is: InputStream): Int = {
    val buf = new Array[Byte](4)
    val n = is.read(buf)
    if (n != 4)
      logger.error(s"Expected 4 bytes from input but read $n")
    decodeIntL(buf)
  }

  def putInt(os: OutputStream, x: Int): Unit = {
    val l = encodeIntL(x)
    //val b = encodeIntB(x)
    //System.out.println("little endian: \n" +Bytes.hexValue(l))
    //System.out.println("big endian: \n" +Bytes.hexValue(b))
    os.write(l,0,4)
    //if (littleEndian) os.write(encodeIntL(x),0,4)
    //else os.write(encodeIntB(x),0,4)
  }

  def decodeIntL(b: Array[Byte]): Int = {
    (b(3) << 24) |
    ((b(2) & 0xff) << 16) |
    ((b(1) & 0xff) <<  8) |
    (b(0) & 0xff)
  }

  def decodeIntB(b: Array[Byte]): Int = {
    (b(0) << 24) |
    ((b(1) & 0xff) << 16) |
    ((b(2) & 0xff) <<  8) |
    (b(3) & 0xff)
  }

  def encodeIntL(x: Int): Array[Byte] = {
    Array[Byte](
      x.toByte,
      (x >> 8).toByte,
      (x >> 16).toByte,
      (x >> 24).toByte
    )
  }

  def encodeIntB(x: Int): Array[Byte] = {
    Array[Byte](
      (x >> 24).toByte,
      (x >> 16).toByte,
      (x >> 8).toByte,
      x.toByte,
    )
  }

  @inline
  def uint(b: Byte): Int = if (b < 0) 256 + b else b
}
