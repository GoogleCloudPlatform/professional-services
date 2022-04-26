package com.google.cloud.gszutil

import java.nio.ByteBuffer
import java.nio.charset.{Charset, StandardCharsets}

import com.google.common.io.Resources

object TestUtil {
  def resource(name: String): Array[Byte] = Resources.toByteArray(Resources.getResource(name))
  def getBytes(name: String): ByteBuffer = ByteBuffer.wrap(resource(name))

  def getData(name: String,
              srcCharset: Charset = StandardCharsets.UTF_8,
              destCharset: Charset = StandardCharsets.UTF_8): ByteBuffer = {
    val bytes = new String(resource(name), srcCharset).filterNot(_ == '\n')
      .getBytes(destCharset)
    ByteBuffer.wrap(bytes)
  }
}
