package com.google.cloud.gszutil

trait BinaryEncoding {
  def encoders: Array[BinaryEncoder]
}
