package com.google.cloud.imf.gzos.gen


trait ValueGenerator {
  def size: Int
  def generate(buf: Array[Byte], off: Int): Int
}
