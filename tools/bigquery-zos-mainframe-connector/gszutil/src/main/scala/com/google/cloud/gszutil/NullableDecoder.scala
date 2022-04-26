package com.google.cloud.gszutil

trait NullableDecoder extends Decoder {
  protected def nullIf: Array[Byte]

  // check for null condition
  protected def isNull(bytes: Array[Byte], i: Int, nullIf: Array[Byte]): Boolean = {
    if (size < nullIf.length || nullIf.isEmpty)
      return false

    var j = 0
    while (j < nullIf.length){
      if (bytes(i+j) != nullIf(j))
        return false
      j += 1
    }
    true
  }
}
