package com.google.cloud.gszutil
import java.nio.charset.Charset

import com.google.common.base.Charsets

object Utf8 extends Transcoder {
  override val charset: Charset = Charsets.UTF_8
  override val SP: Byte = ' '.toByte
}
