package com.google.cloud.imf.util

import java.io.InputStream

import com.google.common.io.ByteSource

class InputStreamByteSource(is: InputStream) extends ByteSource {
  override def openStream(): InputStream = is
}
