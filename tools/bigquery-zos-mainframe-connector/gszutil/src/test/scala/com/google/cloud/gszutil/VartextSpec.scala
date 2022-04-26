package com.google.cloud.gszutil

import java.nio.ByteBuffer
import java.time.LocalDate
import java.time.format.DateTimeFormatter

import com.google.cloud.gszutil.VartextDecoding.{VartextStringAsDateDecoder, VartextStringAsDecimalDecoder, VartextStringAsIntDecoder, VartextStringDecoder}
import com.google.cloud.gszutil.io.ZReader
import com.google.cloud.imf.gzos.Ebcdic
import com.google.common.base.Charsets
import org.apache.hadoop.hive.ql.exec.vector.{BytesColumnVector, DateColumnVector, Decimal64ColumnVector, LongColumnVector}
import org.scalatest.flatspec.AnyFlatSpec

class VartextSpec extends AnyFlatSpec {
  private def exampleDecoders(transcoder: Transcoder): Array[VartextDecoder] = {
    Array[VartextDecoder](
      new VartextStringDecoder(transcoder,2),
      new VartextStringAsIntDecoder(transcoder,9),
      new VartextStringAsIntDecoder(transcoder,9),
      new VartextStringAsIntDecoder(transcoder,2),
      new VartextStringAsDateDecoder(transcoder,10, "MM/DD/YYYY"),
      new VartextStringAsDateDecoder(transcoder,10, "MM/DD/YYYY"),
      new VartextStringAsDecimalDecoder(transcoder,10,9,2),
      new VartextStringDecoder(transcoder,2),
      new VartextStringDecoder(transcoder,1),
      new VartextStringAsDateDecoder(transcoder,10, "MM/DD/YYYY")
    )
  }

  val EbcdicPipe = "|".getBytes(Ebcdic.charset)

  "vartext" should "decode example with cast" in {
    val buf = TestUtil.getData("vartext0.txt",Utf8.charset,Ebcdic.charset)
    val decoders = exampleDecoders(Ebcdic)
    val cols = decoders.map(_.columnVector(8))
    val delimiters = new Array[Int](cols.length+1)
    ZReader.locateDelimiters(buf.array, EbcdicPipe, delimiters)
    ZReader.readVartextRecord(buf.array, delimiters, EbcdicPipe.length, Ebcdic.charset, decoders,
      cols, 0)

    val dcv = cols(6).asInstanceOf[Decimal64ColumnVector]
    assert(dcv.vector(0) == 210L)
    assert(dcv.scale == 2)

    val dateCol = cols.last.asInstanceOf[DateColumnVector]
    val dt = dateCol.formatDate(0)
    assert(dt == "2020-02-07")
  }

  it should "decode bigger example with cast" in {
    val buf = TestUtil.getData("vartext1.txt", Utf8.charset, Ebcdic.charset)
    val decoders = exampleDecoders(Ebcdic)
    val batchSize = 8
    val lrecl = buf.array.length / batchSize
    val cols = decoders.map(_.columnVector(batchSize))
    val err = ByteBuffer.allocate(buf.capacity)
    ZReader.readVartextBatch(buf, decoders, cols,
      EbcdicPipe, Ebcdic.charset, batchSize, lrecl, err)

    val col = cols(6).asInstanceOf[Decimal64ColumnVector]
    assert(col.vector(0) == 210L)
    assert(col.scale == 2)

    val dateCol = cols.last.asInstanceOf[DateColumnVector]
    val dt = dateCol.formatDate(0)
    assert(dt == "2020-02-07")

    val strCol = cols.head.asInstanceOf[BytesColumnVector]
    val strCol2 = cols(7).asInstanceOf[BytesColumnVector]
    var j = 0
    while (j < 8){
      assert(new String(strCol.vector(j),strCol.start(j),strCol.length(j),Charsets.UTF_8) == "US"
        , s"row $j")
      assert(new String(strCol2.vector(j),strCol2.start(j),strCol2.length(j),Charsets.UTF_8) ==
        "WK", s"row $j")
      j += 1
    }
  }

  it should "decode delimited" in {
    val buf = TestUtil.getData("vartext2.txt")
    val decoders = exampleDecoders(Utf8)
    val batchSize = 8
    val cols = decoders.map(_.columnVector(batchSize))
    val lrecl = buf.array.length / batchSize
    val err = ByteBuffer.allocate(buf.capacity)
    val delimiterUtf8 = "þ".getBytes(Utf8.charset)
    ZReader.readVartextBatch(buf, decoders, cols, delimiterUtf8, Utf8.charset, batchSize, lrecl, err)

    val dcv = cols(6).asInstanceOf[Decimal64ColumnVector]
    assert(dcv.vector(0) == 210L)
    assert(dcv.scale == 2)

    val dateCol = cols.last.asInstanceOf[DateColumnVector]
    val dt = dateCol.formatDate(0)
    assert(dt == "2020-02-07")

    val strCol = cols.head.asInstanceOf[BytesColumnVector]
    val strCol2 = cols(7).asInstanceOf[BytesColumnVector]
    var j = 0
    while (j < 8){
      assert(new String(strCol.vector(j),strCol.start(j),strCol.length(j),Charsets.UTF_8) == "US"
        , s"row $j")
      assert(new String(strCol2.vector(j),strCol2.start(j),strCol2.length(j),Charsets.UTF_8) ==
        "WK", s"row $j")
      j += 1
    }
  }

  it should "locate delimiters" in {
    val nCols = 3
    val a = Array[Byte](0,79,0,79,0,79,0,0)
    val delimiter = Array[Byte](79)
    val delimiters = new Array[Int](nCols+1)
    ZReader.locateDelimiters(a, delimiter, delimiters)
    val expected = Seq(-1,1,3,5)
    assert(delimiters.toSeq == expected)
  }

  it should "locate delimiters 2" in {
    val nCols = 3
    val a = Array[Byte](0,79,0,79,0,79,79,79)
    val delimiter = Array[Byte](79)
    val delimiters = new Array[Int](nCols+1)
    ZReader.locateDelimiters(a, delimiter, delimiters)
    val expected = Seq(-1,1,3,5)
    assert(delimiters.toSeq == expected)
  }

  it should "locate multi byte delimiters" in {
    val nCols = 3
    val a = Array[Byte](0,79,79,0,79,79,0,79,79,0,0)
    val delimiter = Array[Byte](79,79)
    val delimiters = new Array[Int](nCols+1)
    ZReader.locateDelimiters(a, delimiter, delimiters)
    val expected = Seq(-2,1,4,7)
    assert(delimiters.toSeq == expected)
  }

  it should "handle mload vartext" in {
    val buf = TestUtil.getBytes("mload1.dat")
    val lrecl = 111
    val batchSize = buf.capacity / lrecl

    val decoders = new Array[VartextDecoder](13)

    val tc = Ebcdic
    decoders(0) = new VartextStringAsIntDecoder(tc, 10)
    decoders(1) = new VartextStringDecoder(tc, 10)
    decoders(2) = new VartextStringAsDateDecoder(tc, 8, "YYYYMMDD")
    decoders(3) = new VartextStringDecoder(tc, 1)
    decoders(4) = new VartextStringDecoder(tc, 20)
    decoders(5) = new VartextStringAsIntDecoder(tc, 10)
    decoders(6) = new VartextStringDecoder(tc, 4)
    decoders(7) = new VartextStringAsIntDecoder(tc, 10)
    decoders(8) = new VartextStringAsIntDecoder(tc, 10)
    decoders(9) = new VartextStringDecoder(tc, 2)
    decoders(10) = new VartextStringAsDateDecoder(tc, 8, "YYYYMMDD")
    decoders(11) = new VartextStringAsIntDecoder(tc, 10)
    decoders(12) = new VartextStringDecoder(tc, 8)

    val cols = decoders.map(_.columnVector(batchSize))
    val errBuf = ByteBuffer.allocate(lrecl)
    ZReader.readVartextBatch(buf, decoders, cols,
      EbcdicPipe, Ebcdic.charset, batchSize, lrecl, errBuf)
    assert(cols(0).asInstanceOf[LongColumnVector].vector.head == 1506838086)
    assert(cols(11).asInstanceOf[LongColumnVector].vector.last == 142051)
    val fmt = DateTimeFormatter.ofPattern("yyyyMMdd")
    val expectedDateInt = LocalDate.from(fmt.parse("20191023")).toEpochDay
    assert(cols(2).asInstanceOf[DateColumnVector].vector.head == expectedDateInt)

    val bcv = cols(12).asInstanceOf[BytesColumnVector]
    val lastStr = new String(bcv.vector.last,bcv.start.last,bcv.length.last,Utf8.charset)
    assert(lastStr == "315")
  }
}
