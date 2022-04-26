package com.google.cloud.gszutil

import java.nio.ByteBuffer

import com.google.cloud.gszutil.Decoding.{StringAsDateDecoder, StringAsIntDecoder, StringDecoder}
import com.google.cloud.gszutil.io.ZReader
import com.google.cloud.imf.gzos.Ebcdic
import org.apache.hadoop.hive.ql.exec.vector.DateColumnVector
import org.scalatest.flatspec.AnyFlatSpec

class ExcessBytesSpec extends AnyFlatSpec {
  private def exampleDecoders(transcoder: Transcoder): Array[Decoder] = {
    Array[Decoder](
      new StringDecoder(transcoder, 5),
      new StringDecoder(transcoder, 9),
      new StringAsDateDecoder(transcoder, 10, "YYYY/MM/DD"),
      new StringDecoder(transcoder, 8),
      new StringAsIntDecoder(transcoder, 9),
      new StringAsIntDecoder(transcoder, 9),
      new StringAsIntDecoder(transcoder, 9),
      new StringDecoder(transcoder, 1),
      new StringAsIntDecoder(transcoder, 7),
      new StringAsIntDecoder(transcoder, 5),
      new StringAsDateDecoder(transcoder, 10, "YYYY/MM/DD"),
      new StringAsIntDecoder(transcoder, 9),
      new StringAsIntDecoder(transcoder, 5),
    )
  }

  // schema reads only 96 bytes but dataset lrecl is 98
  "ZReader" should "handle excess bytes" in {
    val buf = TestUtil.getBytes("mload2.dat")
    val decoders = exampleDecoders(Ebcdic)
    val cols = decoders.map(_.columnVector(4))
    val lrecl = 96
    val rBuf = ByteBuffer.allocate(lrecl)
    val errBuf = ByteBuffer.allocate(buf.capacity())
    val (a,b) = ZReader.readBatch(buf, decoders, cols, 4, lrecl+2, rBuf, errBuf)
    val v = cols(2).asInstanceOf[DateColumnVector]
  }
}
