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

import com.google.cloud.gszutil.Decoding._
import com.google.cloud.gszutil.Encoding.DecimalToBinaryEncoder
import com.google.cloud.gszutil.io.ZReader
import com.google.cloud.imf.gzos.pb.GRecvProto.Record.Field
import com.google.cloud.imf.gzos.pb.GRecvProto.Record.Field.FieldType
import com.google.cloud.imf.gzos.{Binary, Ebcdic, LocalizedTranscoder, PackedDecimal, Util}
import com.google.common.base.Charsets
import com.ibm.jzos.fields.daa
import org.apache.hadoop.hive.ql.exec.vector.{BytesColumnVector, DateColumnVector, Decimal64ColumnVector, LongColumnVector}
import org.apache.hadoop.hive.serde2.io.HiveDecimalWritable
import org.scalatest.flatspec.AnyFlatSpec

import java.nio.ByteBuffer
import java.nio.charset.StandardCharsets
import java.time.LocalDate
import java.time.format.DateTimeFormatter

class DecodingSpec extends AnyFlatSpec {
  "Decoder" should "decode 2 byte binary integer" in {
    val field = new daa.BinarySignedIntL2Field(0)
    val exampleData = Array[Byte](20.toByte, 140.toByte)
    val buf = ByteBuffer.wrap(exampleData)
    val decoder = new LongDecoder(2)
    val col = decoder.columnVector(1)
    val minTwoByteInt = -32768
    val maxTwoByteInt = 32767
    val testValues = Seq(minTwoByteInt, -1, 0, 1, 5260, maxTwoByteInt)
    for (testValue <- testValues) {
      field.putInt(testValue, exampleData, 0)
      buf.clear()
      decoder.get(buf, col, 0)
      assert(col.asInstanceOf[LongColumnVector].vector(0) == testValue)
    }
  }

  it should "decode 4 byte binary integer" in {
    val field = new daa.BinarySignedIntL4Field(0)
    val exampleData = new Array[Byte](4)
    val buf = ByteBuffer.wrap(exampleData)
    val decoder = new LongDecoder(4)
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
    val decoder = new LongDecoder(8)
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
    val decoder = new LongDecoder(4)
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
    val decoder = new LongDecoder(8)
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
    val exampleData = Array[Byte](0x00.toByte, 0x00.toByte, 0x17.toByte, 0x4D.toByte)
    val buf = ByteBuffer.wrap(exampleData)
    val decoder = Decimal64Decoder(7, 0)
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
    val decoder = Decimal64Decoder(9, 2)
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
    val decoder = Decimal64Decoder(16, 2)
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
    val len = PackedDecimal.sizeOf(16, 2)
    val exampleData = Array.fill[Byte](len)(0x00.toByte)
    exampleData(0) = 0x01.toByte
    exampleData(len - 1) = 0x1C.toByte
    val buf = ByteBuffer.wrap(exampleData)
    val unpackedLong = PackedDecimal.unpack(ByteBuffer.wrap(exampleData), exampleData.length)
    val expected = 100000000000000001L
    assert(unpackedLong == expected)
    val decoder = Decimal64Decoder(16, 2)
    val col = decoder.columnVector(1)
    decoder.get(buf, col, 0)
    val got = col.asInstanceOf[Decimal64ColumnVector].vector(0)
    assert(got == expected)
    val w = new HiveDecimalWritable()
    w.setFromLongAndScale(expected, 2)
    val fromHiveDecimal = w.serialize64(2)
    assert(fromHiveDecimal == expected)
  }

  it should "null packed decimal" in {
    val len = PackedDecimal.sizeOf(16, 2)
    val exampleData = Array.fill[Byte](len)(0x00.toByte)
    val buf = ByteBuffer.wrap(exampleData)
    assert(0 == PackedDecimal.unpack(ByteBuffer.wrap(exampleData), exampleData.length))
    //assertThrows[IllegalArgumentException](PackedDecimal.unpack(ByteBuffer.wrap(exampleData), exampleData.length))
    val decoder = Decimal64Decoder(16, 2)
    val col = decoder.columnVector(1)
    decoder.get(buf, col, 0)
    val dcv = col.asInstanceOf[Decimal64ColumnVector]
    assert(!dcv.noNulls)
    assert(dcv.isNull(0))
  }

  it should "invalid packed decimal sign" in {
    val len = PackedDecimal.sizeOf(16, 2)
    val exampleData = Array.fill[Byte](len)(0x00.toByte)
    exampleData.update(len - 2, 0x12)
    exampleData.update(len - 1, 0x18)
    val buf = ByteBuffer.wrap(exampleData)
    assert(121 == PackedDecimal.unpack(buf, len))
    //assertThrows[IllegalArgumentException](PackedDecimal.unpack(buf, len))
  }

  it should "decode from ebcdic939 to Japanese string" in {
    val localizedTranscoder = LocalizedTranscoder(Some("x-ibm939"))
    val decoder = new LocalizedNullableStringDecoder(localizedTranscoder, 10, "null".getBytes("utf-8"))

    val values = List(
      "" -> asByteArray(0x40, 0x40, 0x40, 0x40, 0x40, 0x40, 0x40, 0x40, 0x40, 0x40),
      null.asInstanceOf[String] -> asByteArray(0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00),
      null.asInstanceOf[String] -> asByteArray(0x95, 0xA4, 0x93, 0x93, 0x40, 0x40, 0x40, 0x40, 0x40, 0x40),
      "aA1" -> asByteArray(0x81, 0xC1, 0xF1, 0x40, 0x40, 0x40, 0x40, 0x40, 0x40, 0x40),
      "aA1" -> asByteArray(0x81, 0xC1, 0xF1, 0x40, 0x40, 0x40, 0x40, 0x00, 0x00, 0x00),
      "水" -> asByteArray(0x0E, 0x45, 0x9C, 0x0F, 0x40, 0x40, 0x40, 0x40, 0x40, 0x40),
      "水Aア" -> asByteArray(0x0E, 0x45, 0x9C, 0x0F, 0xC1, 0x0E, 0x43, 0x81, 0x0F, 0x40),
      "水です" -> asByteArray(0x0E, 0x45, 0x9C, 0x44, 0xCD, 0x44, 0x8E, 0x0F, 0x40, 0x40),
    )

    values.foreach {
      case (null | "", bytes) =>
        val v = decoder.columnVector(1).asInstanceOf[BytesColumnVector]
        decoder.get(ByteBuffer.wrap(bytes), v, 0)
        val actual = v.vector(0).slice(v.start(0), v.start(0) + v.length(0))
        assert(v.isNull(0))
        assertResult(Array[Byte]())(actual)
      case (str, bytes) =>
        val v = decoder.columnVector(1).asInstanceOf[BytesColumnVector]
        decoder.get(ByteBuffer.wrap(bytes), v, 0)
        val actual = v.vector(0).slice(v.start(0), v.start(0) + v.length(0))
        val expected = str.getBytes("utf-8")
        if (!actual.sameElements(expected)) {
          println("Bytes : " + bytes.map("%02X" format _).mkString("Array(", ", ", ")"))
        }
        assert(!v.isNull(0))
        assertResult(expected)(actual)
    }
  }

  it should "decode from utf-8 to Japanese string" in {
    val localizedTranscoder = LocalizedTranscoder(Some("utf-8"))
    val decoder = new LocalizedNullableStringDecoder(localizedTranscoder, 10, "null".getBytes("utf-8"))

    val values = List(
      "" -> asByteArray(0x20, 0x20, 0x20, 0x20, 0x20, 0x20, 0x20, 0x20, 0x20, 0x20),
      null.asInstanceOf[String] -> asByteArray(0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00),
      null.asInstanceOf[String] -> asByteArray(0x6E, 0x75, 0x6C, 0x6C, 0x20, 0x20, 0x20, 0x20, 0x20, 0x20),
      "aA1" -> asByteArray(0x61, 0x41, 0x31, 0x20, 0x20, 0x20, 0x20, 0x20, 0x20, 0x20),
      "aA1" -> asByteArray(0x61, 0x41, 0x31, 0x20, 0x20, 0x20, 0x20, 0x00, 0x00, 0x00),
      "水" -> asByteArray(0xE6, 0xB0, 0xB4, 0x20, 0x20, 0x20, 0x20, 0x20, 0x20, 0x20),
      "水Aア" -> asByteArray(0xE6, 0xB0, 0xB4, 0x41, 0xE3, 0x82, 0xA2, 0x20, 0x20, 0x20),
      "水です" -> asByteArray(0xE6, 0xB0, 0xB4, 0xE3, 0x81, 0xA7, 0xE3, 0x81, 0x99, 0x20),
    )

    values.foreach {
      case (null | "", bytes) =>
        val v = decoder.columnVector(1).asInstanceOf[BytesColumnVector]
        decoder.get(ByteBuffer.wrap(bytes), v, 0)
        val actual = v.vector(0).slice(v.start(0), v.start(0) + v.length(0))
        assert(v.isNull(0))
        assertResult(Array[Byte]())(actual)
      case (str, bytes) =>
        val v = decoder.columnVector(1).asInstanceOf[BytesColumnVector]
        decoder.get(ByteBuffer.wrap(bytes), v, 0)
        val actual = v.vector(0).slice(v.start(0), v.start(0) + v.length(0))
        val expected = str.getBytes("utf-8")
        if (!actual.sameElements(expected)) {
          println("Bytes : " + bytes.map("%02X" format _).mkString("Array(", ", ", ")"))
        }
        assert(!v.isNull(0))
        assertResult(expected)(actual)
    }
  }

  it should "decode from ebcdic935 to Chinese string" in {
    val localizedTranscoder = LocalizedTranscoder(Some("SCHEBCDIC935_6IJ"))
    val decoder = new LocalizedNullableStringDecoder(localizedTranscoder, 10, "null".getBytes("utf-8"))

    val values = List(
      "" -> asByteArray(0x40, 0x40, 0x40, 0x40, 0x40, 0x40, 0x40, 0x40, 0x40, 0x40),
      null.asInstanceOf[String] -> asByteArray(0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00),
      null.asInstanceOf[String] -> asByteArray(0x95, 0xA4, 0x93, 0x93, 0x40, 0x40, 0x40, 0x40, 0x40, 0x40),
      "aA1" -> asByteArray(0xFFFFFF81, 0xFFFFFFC1, 0xFFFFFF1, 0x40, 0x40, 0x40, 0x40, 0x40, 0x40, 0x40),
      "国" -> asByteArray(0x0E, 0x4D, 0xffffff9b, 0x0F, 0x40, 0x40, 0x40, 0x40, 0x40, 0x40),
      "国A果" -> asByteArray(0x0E, 0x4D, 0xFFFFFF9B, 0x0F, 0xFFFFFFC1, 0x0E, 0x4D, 0xFFFFFF9C, 0x0F, 0x40),
      "苹果国" -> asByteArray(0x0E, 0x53, 0xFFFFFFBA, 0x4D, 0xFFFFFF9C, 0x4D, 0xFFFFFF9B, 0x0F, 0x40, 0x40),
    )

    values.foreach {
      case (null | "", bytes) =>
        val v = decoder.columnVector(1).asInstanceOf[BytesColumnVector]
        decoder.get(ByteBuffer.wrap(bytes), v, 0)
        val actual = v.vector(0).slice(v.start(0), v.start(0) + v.length(0))
        assert(v.isNull(0))
        assertResult(Array[Byte]())(actual)
      case (str, bytes) =>
        val v = decoder.columnVector(1).asInstanceOf[BytesColumnVector]
        decoder.get(ByteBuffer.wrap(bytes), v, 0)
        val actual = v.vector(0).slice(v.start(0), v.start(0) + v.length(0))
        val expected = str.getBytes("utf-8")
        if (!actual.sameElements(expected)) {
          println("Bytes : " + bytes.map("%02X" format _).mkString("Array(", ", ", ")"))
        }
        assert(!v.isNull(0))
        assertResult(expected)(actual)
    }
  }

  it should "decode values" in {
    val decoder = Decimal64Decoder(5, 2)
    val values = List(
      0 -> asByteArray(0x00, 0x00, 0x00, 0x0C),
      0.01 -> asByteArray(0x00, 0x00, 0x00, 0x1C),
      1 -> asByteArray(0x00, 0x00, 0x10, 0x0C),
      12345.67 -> asByteArray(0x12, 0x34, 0x56, 0x7C),
      99999.99 -> asByteArray(0x99, 0x99, 0x99, 0x9C),
      166666.65 -> asByteArray(0xFF, 0xFF, 0xFF, 0xFF), //no validation here

      //negative values
      -0 -> asByteArray(0x00, 0x00, 0x00, 0x0D),
      -0.01 -> asByteArray(0x00, 0x00, 0x00, 0x1D),
      -1 -> asByteArray(0x00, 0x00, 0x10, 0x0D),
      -12345.67 -> asByteArray(0x12, 0x34, 0x56, 0x7D),
      -99999.99 -> asByteArray(0x99, 0x99, 0x99, 0x9D),
      -166666.65 -> asByteArray(0xFF, 0xFF, 0xFF, 0xFD), //no validation here

      -0 -> asByteArray(0x00, 0x00, 0x00, 0x0B),
      -0.01 -> asByteArray(0x00, 0x00, 0x00, 0x1B),
      -1 -> asByteArray(0x00, 0x00, 0x10, 0x0B),
      -12345.67 -> asByteArray(0x12, 0x34, 0x56, 0x7B),
      -99999.99 -> asByteArray(0x99, 0x99, 0x99, 0x9B),
      -166666.65 -> asByteArray(0xFF, 0xFF, 0xFF, 0xFB), //no validation here
    )

    values.foreach {
      case (expected, bytes) =>
        val v = decoder.columnVector(1).asInstanceOf[Decimal64ColumnVector]
        decoder.get(ByteBuffer.wrap(bytes), v, 0)
        val actual = v.vector(0) / math.pow(10, v.scale)
        if (expected != actual)
          println("Bytes : " + bytes.map("%02X" format _).mkString("Array(", ", ", ")"))
        assert(!v.isNull(0))
        assertResult(expected)(actual)
    }

    //nulls
    val v = decoder.columnVector(1).asInstanceOf[Decimal64ColumnVector]
    decoder.get(ByteBuffer.wrap(asByteArray(0x00, 0x00, 0x00, 0x00)), v, 0)
    assertResult(0)(v.vector(0))
    assert(v.isNull(0))
  }

  it should "decode values zero scale" in {
    val decoder = Decimal64Decoder(4, 0)
    val values = List(
      0 -> asByteArray(0x00, 0x00, 0x0C),
      1 -> asByteArray(0x00, 0x00, 0x1C),
      12 -> asByteArray(0x00, 0x01, 0x2C),
      1234 -> asByteArray(0x01, 0x23, 0x4C),
      9999 -> asByteArray(0x09, 0x99, 0x9C),
      12345 -> asByteArray(0x12, 0x34, 0x5C), //overflow, number of digits should be 4
      166665 -> asByteArray(0xFF, 0xFF, 0xFF), //no validation here

      //negative values
      -0 -> asByteArray(0x00, 0x00, 0x0D),
      -1 -> asByteArray(0x00, 0x00, 0x1D),
      -12 -> asByteArray(0x00, 0x01, 0x2D),
      -1234 -> asByteArray(0x01, 0x23, 0x4D),
      -9999 -> asByteArray(0x09, 0x99, 0x9D),
      -12345 -> asByteArray(0x12, 0x34, 0x5D), //overflow, number of digits should be 4
      -166665 -> asByteArray(0xFF, 0xFF, 0xFD), //no validation here

      -0 -> asByteArray(0x00, 0x00, 0x0B),
      -1 -> asByteArray(0x00, 0x00, 0x1B),
      -12 -> asByteArray(0x00, 0x01, 0x2B),
      -1234 -> asByteArray(0x01, 0x23, 0x4B),
      -9999 -> asByteArray(0x09, 0x99, 0x9B),
      -12345 -> asByteArray(0x12, 0x34, 0x5B), //overflow, number of digits should be 4
      -166665 -> asByteArray(0xFF, 0xFF, 0xFB), //no validation here
    )

    values.foreach {
      case (expected, bytes) =>
        val v = decoder.columnVector(1).asInstanceOf[Decimal64ColumnVector]
        decoder.get(ByteBuffer.wrap(bytes), v, 0)
        val actual = v.vector(0) / math.pow(10, v.scale)
        if (expected != actual)
          println("Bytes : " + bytes.map("%02X" format _).mkString("Array(", ", ", ")"))
        assert(!v.isNull(0))
        assertResult(expected)(actual)
    }

    //nulls
    val v = decoder.columnVector(1).asInstanceOf[Decimal64ColumnVector]
    decoder.get(ByteBuffer.wrap(asByteArray(0x00, 0x00, 0x00)), v, 0)
    assertResult(0)(v.vector(0))
    assert(v.isNull(0))
  }

  it should "invalid packed decimal digit" in {
    val len = PackedDecimal.sizeOf(16, 2)
    val exampleData = Array.fill[Byte](len)(0x00.toByte)
    exampleData.update(len - 2, 0xFF.toByte)
    exampleData.update(len - 1, 0xFC.toByte)
    val buf = ByteBuffer.wrap(exampleData)
    println(PackedDecimal.unpack(buf, len))
    //assertThrows[IllegalArgumentException](PackedDecimal.unpack(buf, len))
  }

  it should "transcode EBCDIC" in {
    val test = Util.randString(10000)
    val in = test.getBytes(Ebcdic.charset)
    val expected = test.getBytes(StandardCharsets.UTF_8).toSeq
    val got = in.map(Ebcdic.decodeByte)
    assert(got.length == expected.length)
    assert(got.sameElements(expected))
  }

  it should "decode char" in {
    assert(Ebcdic.decodeByte(228.toByte) == "U".getBytes(Charsets.UTF_8).head)
    assert(Ebcdic.decodeByte(201.toByte) == "I".getBytes(Charsets.UTF_8).head)
    assert(Ebcdic.decodeByte(173.toByte) == "[".getBytes(Charsets.UTF_8).head)
    assert(Ebcdic.decodeByte(189.toByte) == "]".getBytes(Charsets.UTF_8).head)
  }

  it should "decode string" in {
    val buf = ByteBuffer.wrap(Array[Byte](228.toByte, 201.toByte))
    val decoder = new StringDecoder(Ebcdic, 2)
    val col = decoder.columnVector(1)
    decoder.get(buf, col, 0)
    val vec = col.asInstanceOf[BytesColumnVector].vector
    assert(vec.length == 1)
    val x = vec(0)
    val defaultBufferSize = 16384
    assert(x.length == defaultBufferSize)
    val chars = x.slice(0, 2).toSeq
    val expected = "UI".getBytes(Charsets.UTF_8).toSeq
    assert(chars == expected)
  }

  it should "decode string as int" in {
    val examples = Seq((" 0", 0), ("00", 0), ("08", 8), ("42", 42))
    val decoder = new StringAsIntDecoder(Ebcdic, 2)
    val col = decoder.columnVector(1)
    for ((a, b) <- examples) {
      val buf = Ebcdic.charset.encode(a)
      decoder.get(buf, col, 0)
      val vec: Array[Long] = col.asInstanceOf[LongColumnVector].vector
      assert(vec(0) == b)
    }
  }

  it should "decode string as date 1" in {
    val exampleDate = "02/01/2020"
    val fmt = DateTimeFormatter.ofPattern("MM/dd/yyyy")
    val ld = LocalDate.from(fmt.parse(exampleDate))
    val examples = Seq(
      (exampleDate, ld.toEpochDay, false),
      ("00/00/0000", -1L, true)
    )
    val decoder = new StringAsDateDecoder(Ebcdic, 10, "MM/DD/YYYY")
    val col = decoder.columnVector(examples.length)
    val vec: Array[Long] = col.asInstanceOf[DateColumnVector].vector
    val isNull: Array[Boolean] = col.asInstanceOf[DateColumnVector].isNull
    for (i <- examples.indices) {
      val (a, b, c) = examples(i)
      decoder.get(Ebcdic.charset.encode(a), col, i)
      assert(vec(i) == b)
      assert(isNull(i) == c)
    }
  }

  it should "decode string as date 2" in {
    val exampleDate = "20/02/01"
    val fmt = DateTimeFormatter.ofPattern("yy/MM/dd")
    val ld = LocalDate.from(fmt.parse(exampleDate))
    val examples = Seq(
      (exampleDate, ld.toEpochDay, false),
    )
    val decoder = new StringAsDateDecoder(Ebcdic, 8, "yy/MM/dd")
    val col = decoder.columnVector(examples.length)
    val vec: Array[Long] = col.asInstanceOf[DateColumnVector].vector
    val isNull: Array[Boolean] = col.asInstanceOf[DateColumnVector].isNull
    for (i <- examples.indices) {
      val (a, b, c) = examples(i)
      decoder.get(Ebcdic.charset.encode(a), col, i)
      assert(vec(i) == b)
      assert(isNull(i) == c)
    }
  }

  it should "decode string as decimal" in {
    val examples = Seq(("0000004.82", 482))
    val decoder = new StringAsDecimalDecoder(Ebcdic, 10, 9, 2)
    val col = decoder.columnVector(1)
    for ((a, b) <- examples) {
      val buf = Ebcdic.charset.encode(a)
      decoder.get(buf, col, 0)
      val vec: Array[Long] = col.asInstanceOf[LongColumnVector].vector
      assert(vec(0) == b)
    }
  }

  it should "read dataset as string" in {
    val data = Seq("SELECT    ", "1         ", "FROM DUAL ")
      .mkString("")
      .getBytes(Charsets.UTF_8)
    val result = Util.records2string(data, 10, Charsets.UTF_8, "\n ")
    val expected =
      """SELECT
        | 1
        | FROM DUAL""".stripMargin
    assert(result == expected)
  }

  it should "decode example with cast" in {
    val example =
      "US.000000001.000100003.07.02/01/2020.02/09/2020.0000002.10.WK. .02/07/2020"

    val decoders = Array[Decoder](
      new StringDecoder(Ebcdic, 2),
      new StringDecoder(Ebcdic, 1, filler = true),
      new StringAsIntDecoder(Ebcdic, 9),
      new StringDecoder(Ebcdic, 1, filler = true),
      new StringAsIntDecoder(Ebcdic, 9),
      new StringDecoder(Ebcdic, 1, filler = true),
      new StringAsIntDecoder(Ebcdic, 2),
      new StringDecoder(Ebcdic, 1, filler = true),
      new StringAsDateDecoder(Ebcdic, 10, "MM/DD/YYYY"),
      new StringDecoder(Ebcdic, 1, filler = true),
      new StringAsDateDecoder(Ebcdic, 10, "MM/DD/YYYY"),
      new StringDecoder(Ebcdic, 1, filler = true),
      new StringAsDecimalDecoder(Ebcdic, 10, 9, 2),
      new StringDecoder(Ebcdic, 1, filler = true),
      new StringDecoder(Ebcdic, 2),
      new StringDecoder(Ebcdic, 1, filler = true),
      new StringDecoder(Ebcdic, 1),
      new StringDecoder(Ebcdic, 1, filler = true),
      new StringAsDateDecoder(Ebcdic, 10, "MM/DD/YYYY")
    )

    val cols = decoders.map(_.columnVector(8))
    val buf = ByteBuffer.wrap(example.getBytes(Ebcdic.charset))

    var i = 0
    var pos = 0
    while (i < decoders.length) {
      val d = decoders(i)
      val col = cols(i)

      d.get(buf, col, 0)
      pos += d.size

      assert(buf.position() == pos)
      i += 1
    }

    val dcv = cols(12).asInstanceOf[Decimal64ColumnVector]
    assert(dcv.vector(0) == 210L)
    assert(dcv.scale == 2)

    val dateCol = cols.last.asInstanceOf[DateColumnVector]
    val dt = dateCol.formatDate(0)
    assert(dt == "2020-02-07")
  }

  it should "decode bigger example with cast" in {
    val decoders = Array[Decoder](
      new StringDecoder(Ebcdic, 2),
      new StringDecoder(Ebcdic, 1, filler = true),
      new StringAsIntDecoder(Ebcdic, 9),
      new StringDecoder(Ebcdic, 1, filler = true),
      new StringAsIntDecoder(Ebcdic, 9),
      new StringDecoder(Ebcdic, 1, filler = true),
      new StringAsIntDecoder(Ebcdic, 2),
      new StringDecoder(Ebcdic, 1, filler = true),
      new StringAsDateDecoder(Ebcdic, 10, "MM/DD/YYYY"),
      new StringDecoder(Ebcdic, 1, filler = true),
      new StringAsDateDecoder(Ebcdic, 10, "MM/DD/YYYY"),
      new StringDecoder(Ebcdic, 1, filler = true),
      new StringAsDecimalDecoder(Ebcdic, 10, 9, 2),
      new StringDecoder(Ebcdic, 1, filler = true),
      new StringDecoder(Ebcdic, 2),
      new StringDecoder(Ebcdic, 1, filler = true),
      new StringDecoder(Ebcdic, 1),
      new StringDecoder(Ebcdic, 1, filler = true),
      new StringAsDateDecoder(Ebcdic, 10, "MM/DD/YYYY")
    )

    val batchSize = 8
    val cols = decoders.map(_.columnVector(batchSize))
    val buf = TestUtil.getBytes("mload0.dat")
    val lrecl = buf.array.length / batchSize
    val rBuf = ByteBuffer.allocate(lrecl)
    val errBuf = ByteBuffer.allocate(lrecl)
    val (rowId, errCt) = ZReader.readBatch(buf, decoders, cols, batchSize, lrecl, rBuf, errBuf)
    assert(rowId == batchSize)
    assert(errCt == 0)

    // reset buffer to replay the data
    buf.clear
    var i = 0
    var pos = 0
    while (i < decoders.length) {
      val d = decoders(i)
      val col = cols(i)

      d.get(buf, col, 0)
      pos += d.size

      assert(buf.position() == pos)
      i += 1
    }

    val dcv = cols(12).asInstanceOf[Decimal64ColumnVector]
    assert(dcv.vector(0) == 210L)
    assert(dcv.scale == 2)

    val dateCol = cols.last.asInstanceOf[DateColumnVector]
    val dt = dateCol.formatDate(0)
    assert(dt == "2020-02-07")

    val strCol = cols.head.asInstanceOf[BytesColumnVector]
    val strCol2 = cols(14).asInstanceOf[BytesColumnVector]
    var j = 0
    while (j < batchSize) {
      val a = strCol.vector(j)
      val start = strCol.start(j)
      val len = strCol.length(j)
      val s = new String(a, start, len, Charsets.UTF_8)
      assert(s == "US", s"row $j")

      val a2 = strCol2.vector(j)
      val start2 = strCol2.start(j)
      val len2 = strCol2.length(j)
      val s2 = new String(a2, start2, len2, Charsets.UTF_8)
      assert(s2 == "WK", s"row $j")
      j += 1
    }
  }

  it should "cast integer to date" in {
    val b = Field.newBuilder
      .setTyp(FieldType.INTEGER)
      .setCast(FieldType.DATE)
      .setFormat("YYMMDD")
      .build
    val decoder = Decoding.getDecoder(b, Utf8)
    assert(decoder.isInstanceOf[IntegerAsDateDecoder])
  }

  it should "nullif" in {
    val examples = Seq(
      (Array[Byte](0x5b, 0x5b, 0x4a, 0x4a, 0, 1, 2, 3), true),
      (Array[Byte](0x5b, 0x5b, 0, 0, 0, 1, 2, 3), false)
    )

    val nullIf = Array[Byte](0x5b, 0x5b, 0x4a, 0x4a)
    Ebcdic.decodeBytes(nullIf)

    for ((example, expected) <- examples) {
      val buf = ByteBuffer.wrap(example)
      val decoder = new NullableStringDecoder(Ebcdic, 4, nullIf)
      val bcv = decoder.columnVector(1)
      decoder.get(buf, bcv, 0)
      assert(bcv.isNull(0) == expected, "should be null")
    }
  }

  it should "cast decimal(5, 2) to string" in {
    // prepare input
    val example = 3L
    val precision = 5
    val scale = 2
    val encoder = DecimalToBinaryEncoder(precision - scale, scale)
    val decimalInputBuf = ByteBuffer.wrap(encoder.encode(example))

    // decode as String
    val decoder = DecimalAsStringDecoder(precision - scale, scale, (precision - scale) * 2, Ebcdic, filler = false)
    val col = decoder.columnVector(decoder.size).asInstanceOf[BytesColumnVector]
    decoder.get(decimalInputBuf, col, 0)

    val a = col.vector(0)
    val start = col.start(0)
    val len = col.length(0)
    val s = new String(a, start, len, Utf8.charset)
    assert(s == "0.03")
  }

  it should "cast integer to string" in {
    val example = 1234567
    val binary = Binary.encode(example, 4)
    val decoder = LongAsStringDecoder(Ebcdic, 4, 8, filler = false)
    val col = decoder.columnVector(decoder.size).asInstanceOf[BytesColumnVector]
    decoder.get(ByteBuffer.wrap(binary), col, 0)

    val a = col.vector(0)
    val start = col.start(0)
    val len = col.length(0)
    val s = new String(a, start, len, Utf8.charset)
    assert(s == "1234567")
  }

  it should "cast decimal(3,0) to integer " in {
    val buf = PackedDecimal.pack(12L, PackedDecimal.sizeOf(3, 0))
    val decoder = Decimal64Decoder(3, 0)
    val vec = decoder.columnVector(1).asInstanceOf[LongColumnVector]
    decoder.get(ByteBuffer.wrap(buf), vec, 0)
    assert(vec.vector(0) == 12L)
  }

  it should "return DecimalScale0ToLongDecoder" in {
    val f = Field.newBuilder
      .setTyp(FieldType.DECIMAL)
      .setPrecision(3)
      .setCast(FieldType.INTEGER)
      .setFormat("YYMMDD")
      .build

    Decoding.getDecoder(f, Ebcdic) match {
      case d: DecimalScale0AsLongDecoder =>
      case _ => fail("DecimalScale0AsLongDecoder expected")
    }
  }

  private def asByteArray(bytes: Int*): Array[Byte] = {
    bytes.map(_.toByte).toArray
  }
}
