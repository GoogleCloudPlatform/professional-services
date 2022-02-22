/*
 * Copyright 2019 Google LLC All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

package com.google.cloud.gszutil

import java.nio.ByteBuffer
import java.nio.charset.StandardCharsets

import com.google.cloud.gszutil.Decoding.{ebcdic2ASCIIString,DecimalDecoder,Decimal64Decoder,LongDecoder,StringDecoder}
import com.google.common.base.Charsets
import com.ibm.jzos.fields.daa
import org.apache.hadoop.hive.ql.exec.vector.{BytesColumnVector, Decimal64ColumnVector, DecimalColumnVector, LongColumnVector}
import org.apache.hadoop.hive.serde2.io.HiveDecimalWritable
import org.scalatest.FlatSpec

class DecodingSpec extends FlatSpec {
  "Decoder" should "decode 2 byte binary integer" in {
    val field = new daa.BinarySignedIntL2Field(0)
    val exampleData = Array[Byte](20.toByte, 140.toByte)
    val buf = ByteBuffer.wrap(exampleData)
    val decoder = LongDecoder(2)
    val col = decoder.columnVector(1)
    val minTwoByteInt = -32768
    val maxTwoByteInt = 32767
    val testValues = Seq(minTwoByteInt, -1, 0, 1, 5260, maxTwoByteInt)
    for (testValue <- testValues){
      field.putInt(testValue, exampleData,0)
      buf.clear()
      decoder.get(buf, col, 0)
      assert(col.asInstanceOf[LongColumnVector].vector(0) == testValue)
    }
  }

  it should "decode 4 byte binary integer" in {
    val field = new daa.BinarySignedIntL4Field(0)
    val exampleData = new Array[Byte](4)
    val buf = ByteBuffer.wrap(exampleData)
    val decoder = LongDecoder(4)
    val col = decoder.columnVector(1)

    val minFourByteInt = Int.MinValue
    val maxFourByteInt = Int.MaxValue

    val testValues = Seq(minFourByteInt, -174, -1, 1, 0, 11802921, maxFourByteInt)
    for (testValue <- testValues) {
      field.putInt(testValue, exampleData, 0)
      buf.clear()
      decoder.get(buf, col, 0)
      assert(col.asInstanceOf[LongColumnVector].vector(0) == testValue)
    }
  }

  it should "decode 8 byte binary long" in {
    val field = new daa.BinarySignedLongL8Field(0)
    val exampleData = new Array[Byte](8)
    val buf = ByteBuffer.wrap(exampleData)
    val decoder = LongDecoder(8)
    val col = decoder.columnVector(1)
    val minEightByteInteger = Long.MinValue
    val maxEightByteInteger = Long.MaxValue
    val testValues = Seq(minEightByteInteger, -174, -1, 1, 0, maxEightByteInteger)
    for (testValue <- testValues) {
      field.putLong(testValue, exampleData, 0)
      buf.clear()
      decoder.get(buf, col, 0)
      assert(col.asInstanceOf[LongColumnVector].vector(0) == testValue)
    }
  }

  it should "decode 4 byte binary unsigned integer" in {
    val field = new daa.BinaryUnsignedIntL4Field(0)
    val exampleData = new Array[Byte](4)
    val buf = ByteBuffer.wrap(exampleData)
    val decoder = LongDecoder(4)
    val col = decoder.columnVector(1)
    val testValues = Seq(0, 1, Int.MaxValue)
    for (testValue <- testValues) {
      field.putInt(testValue, exampleData, 0)
      buf.clear()
      decoder.get(buf, col, 0)
      assert(col.asInstanceOf[LongColumnVector].vector(0) == testValue)
    }
  }

  it should "decode 8 byte binary unsigned long" in {
    val field = new daa.BinaryUnsignedLongL8Field(0)
    val exampleData = new Array[Byte](8)
    val buf = ByteBuffer.wrap(exampleData)
    val decoder = LongDecoder(8)
    val col = decoder.columnVector(1)
    val testValues = Seq(0, 1, Long.MaxValue)
    for (testValue <- testValues) {
      field.putLong(testValue, exampleData, 0)
      buf.clear()
      decoder.get(buf, col, 0)
      assert(col.asInstanceOf[LongColumnVector].vector(0) == testValue)
    }
  }

  it should "unpack 4 byte decimal" in {
    val field = new daa.PackedSignedIntP7Field(0)
    val exampleData = Array[Byte](0x00.toByte,0x00.toByte,0x17.toByte, 0x4D.toByte)
    val buf = ByteBuffer.wrap(exampleData)
    val decoder = Decimal64Decoder(7,0)
    val col = decoder.columnVector(1)
    // 4 bytes contains 8 half-bytes, with 1 reserved for sign
    // so this field type supports a maximum of 7 digits
    val min7DigitInt = -9999999
    val max7DigitInt = 9999999
    val testValues = Seq(min7DigitInt, 0, 1, max7DigitInt)
    for (testValue <- testValues) {
      field.putInt(testValue, exampleData, 0)
      buf.clear()
      decoder.get(buf, col, 0)
      assert(col.asInstanceOf[LongColumnVector].vector(0) == testValue)
    }
  }

  it should "unpack 6 byte decimal" in {
    val field = new daa.PackedSignedLongP11Field(0)
    val exampleData = new Array[Byte](6)
    val buf = ByteBuffer.wrap(exampleData)
    val decoder = Decimal64Decoder(9,2)
    val col = decoder.columnVector(1)
    val w = new HiveDecimalWritable()
    // 6 bytes contains 12 half-bytes, with 1 reserved for sign
    // so this field type supports a maximum of 11 digits
    val min11DigitValue = -99999999999L
    val max11DigitValue = 99999999999L
    val testValues = Seq(min11DigitValue, 0, 1, 128, max11DigitValue)
    for (testValue <- testValues) {
      field.putLong(testValue, exampleData, 0)
      buf.clear()
      decoder.get(buf, col, 0)
      val got = col.asInstanceOf[LongColumnVector].vector(0)
      assert(got == testValue)
      w.setFromLongAndScale(testValue, 2)
      val fromHiveDecimal = w.serialize64(2)
      assert(fromHiveDecimal == testValue)
    }
  }

  it should "unpack 10 byte long" in {
    val field = new daa.PackedSignedLongP18Field(0)
    val exampleData = new Array[Byte](10)
    val buf = ByteBuffer.wrap(exampleData)
    val decoder = Decimal64Decoder(16,2)
    val col = decoder.columnVector(1)
    // 10 bytes contains 20 half-bytes, with 1 reserved for sign
    // but the first half-byte is not usable
    // so this field type supports a maximum of 18 digits
    val min18Digit = -999999999999999999L
    val max18Digit = 999999999999999999L
    val negative = -100000000000000001L
    val positive = 100000000000000001L
    val testValues = Seq(min18Digit, negative, 0, 1, positive, max18Digit)
    val w = new HiveDecimalWritable()
    for (testValue <- testValues) {
      field.putLong(testValue, exampleData, 0)
      buf.clear()
      decoder.get(buf, col, 0)
      val got = col.asInstanceOf[LongColumnVector].vector(0)
      assert(got == testValue)
      w.setFromLongAndScale(testValue, 2)
      val fromHiveDecimal = w.serialize64(2)
      assert(fromHiveDecimal == testValue)
    }
  }

  it should "unpack 18 digit decimal" in {
    val len = PackedDecimal.sizeOf(16,2)
    val exampleData = Array.fill[Byte](len)(0x00.toByte)
    exampleData(0) = 0x01.toByte
    exampleData(len-1) = 0x1C.toByte
    val buf = ByteBuffer.wrap(exampleData)
    val unpackedLong = PackedDecimal.unpack(ByteBuffer.wrap(exampleData), exampleData.length)
    val expected = 100000000000000001L
    assert(unpackedLong == expected)
    val decoder = Decimal64Decoder(16,2)
    val col = decoder.columnVector(1)
    decoder.get(buf, col, 0)
    val got = col.asInstanceOf[Decimal64ColumnVector].vector(0)
    assert(got == expected)
    val w = new HiveDecimalWritable()
    w.setFromLongAndScale(expected, 2)
    val fromHiveDecimal = w.serialize64(2)
    assert(fromHiveDecimal == expected)
  }

  it should "transcode EBCDIC" in {
    val test = Util.randString(10000)
    val in = test.getBytes(Decoding.CP1047)
    val expected = test.getBytes(StandardCharsets.UTF_8).toSeq
    val got = in.map(Decoding.ebcdic2utf8byte)
    assert(got.length == expected.length)
    assert(got.sameElements(expected))
  }

  it should "decode char" in {
    assert(Decoding.ebcdic2utf8byte(228.toByte) == "U".getBytes(Charsets.UTF_8).head)
    assert(Decoding.ebcdic2utf8byte(201.toByte) == "I".getBytes(Charsets.UTF_8).head)
    assert(Decoding.ebcdic2ASCIIByte(173.toByte) == "[".getBytes(Charsets.UTF_8).head)
    assert(Decoding.ebcdic2ASCIIByte(189.toByte) == "]".getBytes(Charsets.UTF_8).head)
  }

  it should "decode string" in {
    val buf = ByteBuffer.wrap(Array[Byte](228.toByte,201.toByte))
    val decoder = StringDecoder(2)
    val col = decoder.columnVector(1)
    decoder.get(buf, col, 0)
    val vec = col.asInstanceOf[BytesColumnVector].vector
    assert(vec.length == 1)
    val x = vec(0)
    val defaultBufferSize = 16384
    assert(x.length == defaultBufferSize)
    val chars = x.slice(0,2).toSeq
    val expected = "UI".getBytes(Charsets.UTF_8).toSeq
    assert(chars == expected)
  }

  it should "remove non-ascii characters" in {
    // Map all possible byte values to ASCII
    val exampleData: Seq[(Int,String)] = (0 until 256)
      .map(x => (x, ebcdic2ASCIIString(Array(x.toByte))))

    // The ranges below are EBCDIC byte values that can't be mapped to ASCII,
    // determined by printing the converted values
    val unmappableEBCDICBytes: Seq[Int] =
      (0 to 74) ++ (81 to 90) ++ (98 to 106) ++
      (112 to 120) ++ (138 to 144) ++ (154 to 160) ++ (170 to 172) ++
      (174 to 185) ++ (190 to 191) ++ (202 to 207) ++ (218 to 223) ++
      Seq(128, 188, 225) ++ (234 to 239) ++ (234 to 239) ++ (250 to 255)

    unmappableEBCDICBytes.foreach{i =>
      val decodedChar = exampleData(i)._2
      assert(decodedChar == " ")
    }
  }

  it should "read dataset as string" in {
    val data = Seq("SELECT    ","1         ","FROM DUAL ")
      .mkString("")
      .getBytes(Charsets.UTF_8)
    val result = Util.records2string(data, 10, Charsets.UTF_8, "\n ")
    val expected =
      """SELECT
        | 1
        | FROM DUAL""".stripMargin
    assert(result == expected)
  }

  it should "unpack 31 digit decimal" in {
    // Calculate how many bytes should be used to represent 31 digits
    val len = PackedDecimal.sizeOf(29,2) // precision = 29 + 2 = 31
    val exampleData = Array.fill[Byte](len)(0x00.toByte)
    exampleData(0) = 0x10.toByte
    exampleData(len-1) = 0x1C.toByte
    val decoder = DecimalDecoder(29,2)
    val col = decoder.columnVector(1)
    decoder.get(ByteBuffer.wrap(exampleData), col, 0)
    val expected = "10000000000000000000000000000.01"
    val got = col.asInstanceOf[DecimalColumnVector].vector(0).toString
    assert(got == expected)
  }
}
