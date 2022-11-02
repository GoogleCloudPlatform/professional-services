package com.google.cloud.imf.gzos

import com.google.cloud.gszutil.Transcoder

import java.nio.charset.Charset

/** Transcoder with user-specified character set
  * @param encoding name of character set
  */
case class CharsetTranscoder(encoding: String) extends Transcoder {
  override val charset: Charset = Charset.forName(encoding)
  override val SP: Byte = {
    val bytes = charset.encode(" ").array()
    require(bytes.length == 1, "multi-byte space character not supported")
    bytes.head
  }
}
