/*
 * Copyright 2022 Google LLC All Rights Reserved
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

import com.google.cloud.bigquery.FieldValue
import com.google.cloud.bigquery.FieldValue.Attribute
import com.google.cloud.gszutil.Decoding.{Decimal64Decoder, IntAsDateDecoder, LongDecoder}
import com.google.cloud.gszutil.Encoding._
import com.google.cloud.imf.gzos.{Ebcdic, LocalizedTranscoder, PackedDecimal}
import org.apache.hadoop.hive.ql.exec.vector.{DateColumnVector, Decimal64ColumnVector, LongColumnVector}
import org.scalatest.flatspec.AnyFlatSpec

import java.nio.ByteBuffer
import java.nio.charset.Charset
import java.time.LocalDate

class EncodingSpec extends AnyFlatSpec {

  "StringToBinaryEncoder" should "encode ASCII string" in {
    val example = "abcd"
    val encoder = StringToBinaryEncoder(Ebcdic, example.length)
    val buf = encoder.encode(example)
    val decoded = new String(buf, Ebcdic.charset)
    assert(example.equals(decoded))
  }

  "StringToBinaryEncoder" should "throw an error when size higher than expected" in {
    assertThrows[RuntimeException] {
      StringToBinaryEncoder(Ebcdic, 2).encode("abcd")
    }
  }

  "StringToBinaryEncoder" should "encode string with length less than expected" in {
    val example = "abc"
    val res = StringToBinaryEncoder(Ebcdic, 4).encode(example)
    assert(res.length == 4)
    assert("abc".trim.equals(new String(res, Ebcdic.charset).trim))
  }

  "LongToBinaryEncoder" should "encode integer" in {
    val example = 1234L
    val encoder = LongToBinaryEncoder(4)
    val buf: Array[Byte] = encoder.encode(example)
    assert(buf.length == 4)

    val decoder = new LongDecoder(4)
    val col = decoder.columnVector(1)
    decoder.get(ByteBuffer.wrap(buf), col, 0)

    val decoded = col.asInstanceOf[LongColumnVector].vector(0)
    assert(example == decoded)
  }

  "DecimalToBinaryEncoder" should "encode decimal" in {
    val example = 1234L
    val precision = 4
    val scale = 2
    val encoder = DecimalToBinaryEncoder(precision, scale)
    val buf = encoder.encode(example)

    val decoder = Decimal64Decoder(precision, scale)
    val col = decoder.columnVector(1)
    decoder.get(ByteBuffer.wrap(buf), col, 0)

    val decoded = col.asInstanceOf[Decimal64ColumnVector].vector(0)
    assert(example == decoded)
  }

  "DateToBinaryEncoder" should "encode date" in {
    val date = "2020-07-08"
    val encoder = DateStringToBinaryEncoder()
    val encoded: Array[Byte] = encoder.encode(date)
    assert(encoded.length == 4)
    assert(encoded.exists(_ != 0))

    // decode encoded value
    val decoder = IntAsDateDecoder()
    val col = decoder.columnVector(1)
    decoder.get(ByteBuffer.wrap(encoded), col, 0)

    val l = col.asInstanceOf[DateColumnVector].vector(0)
    val d = LocalDate.ofEpochDay(l)

    assert(2020 == d.getYear)
    assert(7 == d.getMonthValue)
    assert(8 == d.getDayOfMonth)
  }

  "BytesToBinaryEncoder" should "encode" in {
    val example = Array[Byte](0x01, 0x02, 0x03, 0x04)
    assert(example == BytesToBinaryEncoder(4).encode(example))
  }

  it should "encode nulls" in {
    assert(StringToBinaryEncoder(Ebcdic, 10).encode(null).filter(_ != 0x00).isEmpty)
    assert(DateStringToBinaryEncoder().encode(null).filter(_ != 0x00).isEmpty)
    assert(LongToBinaryEncoder(4).encode(null).filter(_ != 0x00).isEmpty)

    val decimalEncoder = DecimalToBinaryEncoder(7, 2)
    val encoded = decimalEncoder.encode(null)
    val size = PackedDecimal.sizeOf(7, 2)
    assert(encoded.length == size)
    assert(decimalEncoder.encode(null).filter(_ != 0x00).isEmpty)
  }

  "packed decimal" should "encode" in {
    val s = 2
    val value = "153.99"
    var v1 = value.toDouble
    var scale = 0
    while (scale < s) {
      v1 *= 10d
      scale += 1
    }
    val l = v1.toLong
    assert(l == 15399L)
  }

  "packed decimal" should "encode scale 0 decimal" in {
    val e = DecimalToBinaryEncoder(5, 0)
    val v = FieldValue.of(Attribute.PRIMITIVE, "12345")
    val r = e.encodeValue(v)

    val d = Decimal64Decoder(5, 0)
    val dv = d.columnVector(1).asInstanceOf[Decimal64ColumnVector]
    d.get(ByteBuffer.wrap(r), dv, 0)

    assert(12345 == dv.vector(0))
  }

  it should "encode Japanese characters to ebcdic939" in {
    val localizedTranscoder = LocalizedTranscoder(Some("x-ibm939"))
    val encoder = LocalizedStringToBinaryEncoder(localizedTranscoder, 10)
    val values = List(
      "" -> asByteArray(0x40, 0x40, 0x40, 0x40, 0x40, 0x40, 0x40, 0x40, 0x40, 0x40),
      " " -> asByteArray(0x40, 0x40, 0x40, 0x40, 0x40, 0x40, 0x40, 0x40, 0x40, 0x40),
      null.asInstanceOf[String] -> asByteArray(0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00),
      "aA1" -> asByteArray(0x81, 0xC1, 0xF1, 0x40, 0x40, 0x40, 0x40, 0x40, 0x40, 0x40),
      "水" -> asByteArray(0x0E, 0x45, 0x9C, 0x0F, 0x40, 0x40, 0x40, 0x40, 0x40, 0x40),
      "水Aア" -> asByteArray(0x0E, 0x45, 0x9C, 0x0F, 0xC1, 0x0E, 0x43, 0x81, 0x0F, 0x40),
      "水です" -> asByteArray(0x0E, 0x45, 0x9C, 0x44, 0xCD, 0x44, 0x8E, 0x0F, 0x40, 0x40),
    )
    assertEncodedValues(encoder, values)
    assertThrows[IllegalArgumentException](assertEncodedValues(encoder, List("水水水水水" -> Array[Byte]())))
  }

  it should "encode Japanese characters to utf-8" in {
    val localizedTranscoder = LocalizedTranscoder(Some("utf-8"))
    val encoder = LocalizedStringToBinaryEncoder(localizedTranscoder, 10)
    val values = List(
      "" -> asByteArray(0x20, 0x20, 0x20, 0x20, 0x20, 0x20, 0x20, 0x20, 0x20, 0x20),
      " " -> asByteArray(0x20, 0x20, 0x20, 0x20, 0x20, 0x20, 0x20, 0x20, 0x20, 0x20),
      null.asInstanceOf[String] -> asByteArray(0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00),
      "aA1" -> asByteArray(0x61, 0x41, 0x31, 0x20, 0x20, 0x20, 0x20, 0x20, 0x20, 0x20),
      "水" -> asByteArray(0xE6, 0xB0, 0xB4, 0x20, 0x20, 0x20, 0x20, 0x20, 0x20, 0x20),
      "水Aア" -> asByteArray(0xE6, 0xB0, 0xB4, 0x41, 0xE3, 0x82, 0xA2, 0x20, 0x20, 0x20),
      "水です" -> asByteArray(0xE6, 0xB0, 0xB4, 0xE3, 0x81, 0xA7, 0xE3, 0x81, 0x99, 0x20),
    )
    assertEncodedValues(encoder, values)
    assertThrows[IllegalArgumentException](assertEncodedValues(encoder, List("水水水水水" -> Array[Byte]())))
  }

  it should "encode Chinese characters to ebcdic935" in {
    val localizedTranscoder = LocalizedTranscoder(Some("SCHEBCDIC935_6IJ"))
    val encoder = LocalizedStringToBinaryEncoder(localizedTranscoder, 10)
    val values = List(
      "" -> asByteArray(0x40, 0x40, 0x40, 0x40, 0x40, 0x40, 0x40, 0x40, 0x40, 0x40),
      " " -> asByteArray(0x40, 0x40, 0x40, 0x40, 0x40, 0x40, 0x40, 0x40, 0x40, 0x40),
      null.asInstanceOf[String] -> asByteArray(0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00),
      "aA1" -> asByteArray(0xFFFFFF81, 0xFFFFFFC1, 0xFFFFFF1, 0x40, 0x40, 0x40, 0x40, 0x40, 0x40, 0x40),
      "国" -> asByteArray(0x0E, 0x4D, 0xffffff9b, 0x0F, 0x40, 0x40, 0x40, 0x40, 0x40, 0x40),
      "国A果" -> asByteArray(0x0E, 0x4D, 0xFFFFFF9B, 0x0F, 0xFFFFFFC1, 0x0E, 0x4D, 0xFFFFFF9C, 0x0F, 0x40),
      "苹果国" -> asByteArray(0x0E, 0x53, 0xFFFFFFBA, 0x4D, 0xFFFFFF9C, 0x4D, 0xFFFFFF9B, 0x0F, 0x40, 0x40),
    )
    assertEncodedValues(encoder, values)
    assertThrows[IllegalArgumentException](assertEncodedValues(encoder, List("国国国国国" -> Array[Byte]())))
  }

  it should "encode decimal (odd size)" in {
    val e = DecimalToBinaryEncoder(5, 2)
    val values = List(
      "00000.01" -> asByteArray(0x00, 0x00, 0x00, 0x1C),
      "00000.001" -> asByteArray(0x00, 0x00, 0x00, 0x0C),
      "0000.01" -> asByteArray(0x00, 0x00, 0x00, 0x1C),
      "0.01" -> asByteArray(0x00, 0x00, 0x00, 0x1C),
      "99999.99" -> asByteArray(0x99, 0x99, 0x99, 0x9C),
      "99999.999" -> asByteArray(0x99, 0x99, 0x99, 0x9C),
      "99999" -> asByteArray(0x99, 0x99, 0x90, 0x0C),
      "00001" -> asByteArray(0x00, 0x00, 0x10, 0x0C),
      "001" -> asByteArray(0x00, 0x00, 0x10, 0x0C),
      "1" -> asByteArray(0x00, 0x00, 0x10, 0x0C),
      "00000.99" -> asByteArray(0x00, 0x00, 0x09, 0x9C),
      "000.99" -> asByteArray(0x00, 0x00, 0x09, 0x9C),
      "0.99" -> asByteArray(0x00, 0x00, 0x09, 0x9C),
      "123.4" -> asByteArray(0x00, 0x12, 0x34, 0x0C),
      "12345.67" -> asByteArray(0x12, 0x34, 0x56, 0x7C),
      "12345.60" -> asByteArray(0x12, 0x34, 0x56, 0x0C),
      "0" -> asByteArray(0x00, 0x00, 0x00, 0x0C),
      "0.0" -> asByteArray(0x00, 0x00, 0x00, 0x0C),
      "00000.00" -> asByteArray(0x00, 0x00, 0x00, 0x0C),
      null.asInstanceOf[String] -> asByteArray(0x00, 0x00, 0x00, 0x00),
    )
    val negativeValues = List(
      "-00000.01" -> asByteArray(0x00, 0x00, 0x00, 0x1D),
      "-00000.001" -> asByteArray(0x00, 0x00, 0x00, 0x0C),
      "-0000.01" -> asByteArray(0x00, 0x00, 0x00, 0x1D),
      "-0.01" -> asByteArray(0x00, 0x00, 0x00, 0x1D),
      "-99999.99" -> asByteArray(0x99, 0x99, 0x99, 0x9D),
      "-99999.999" -> asByteArray(0x99, 0x99, 0x99, 0x9D),
      "-99999" -> asByteArray(0x99, 0x99, 0x90, 0x0D),
      "-00001" -> asByteArray(0x00, 0x00, 0x10, 0x0D),
      "-001" -> asByteArray(0x00, 0x00, 0x10, 0x0D),
      "-1" -> asByteArray(0x00, 0x00, 0x10, 0x0D),
      "-00000.99" -> asByteArray(0x00, 0x00, 0x09, 0x9D),
      "-000.99" -> asByteArray(0x00, 0x00, 0x09, 0x9D),
      "-0.99" -> asByteArray(0x00, 0x00, 0x09, 0x9D),
      "-123.4" -> asByteArray(0x00, 0x12, 0x34, 0x0D),
      "-12345.67" -> asByteArray(0x12, 0x34, 0x56, 0x7D),
      "-12345.60" -> asByteArray(0x12, 0x34, 0x56, 0x0D),
      "-0" -> asByteArray(0x00, 0x00, 0x00, 0x0C),
      "-0.0" -> asByteArray(0x00, 0x00, 0x00, 0x0C),
      "-00000.00" -> asByteArray(0x00, 0x00, 0x00, 0x0C),
      null.asInstanceOf[String] -> asByteArray(0x00, 0x00, 0x00, 0x00),
    )

    assertEncodedValues(e, values ++ negativeValues)
  }

  it should "encode decimal (odd size, case 2)" in {
    val e = DecimalToBinaryEncoder(4, 3)
    val values = List(
      "0000.01" -> asByteArray(0x00, 0x00, 0x01, 0x0C),
      "0000.001" -> asByteArray(0x00, 0x00, 0x00, 0x1C), //precision loss
      "000.01" -> asByteArray(0x00, 0x00, 0x01, 0x0C),
      "0.01" -> asByteArray(0x00, 0x00, 0x01, 0x0C),
      "9999.99" -> asByteArray(0x99, 0x99, 0x99, 0x0C),
      "9999.999" -> asByteArray(0x99, 0x99, 0x99, 0x9C), //precision loss
      "9999" -> asByteArray(0x99, 0x99, 0x00, 0x0C),
      "0001" -> asByteArray(0x00, 0x01, 0x00, 0x0C),
      "001" -> asByteArray(0x00, 0x01, 0x00, 0x0C),
      "1" -> asByteArray(0x00, 0x01, 0x00, 0x0C),
      "0000.99" -> asByteArray(0x00, 0x00, 0x99, 0x0C),
      "00.99" -> asByteArray(0x00, 0x00, 0x99, 0x0C),
      "0.99" -> asByteArray(0x00, 0x00, 0x99, 0x0C),
      "123.4" -> asByteArray(0x01, 0x23, 0x40, 0x0C),
      "1234.567" -> asByteArray(0x12, 0x34, 0x56, 0x7C),
      "1234.560" -> asByteArray(0x12, 0x34, 0x56, 0x0C),
      "0" -> asByteArray(0x00, 0x00, 0x00, 0x0C),
      "0.0" -> asByteArray(0x00, 0x00, 0x00, 0x0C),
      "0000.00" -> asByteArray(0x00, 0x00, 0x00, 0x0C),
      null.asInstanceOf[String] -> asByteArray(0x00, 0x00, 0x00, 0x00),
    )
    val negativeValues = List(
      "-0000.01" -> asByteArray(0x00, 0x00, 0x01, 0x0D),
      "-0000.001" -> asByteArray(0x00, 0x00, 0x00, 0x1D), //precision loss
      "-000.01" -> asByteArray(0x00, 0x00, 0x01, 0x0D),
      "-0.01" -> asByteArray(0x00, 0x00, 0x01, 0x0D),
      "-9999.99" -> asByteArray(0x99, 0x99, 0x99, 0x0D),
      "-9999.999" -> asByteArray(0x99, 0x99, 0x99, 0x9D), //precision loss
      "-9999" -> asByteArray(0x99, 0x99, 0x00, 0x0D),
      "-0001" -> asByteArray(0x00, 0x01, 0x00, 0x0D),
      "-001" -> asByteArray(0x00, 0x01, 0x00, 0x0D),
      "-1" -> asByteArray(0x00, 0x01, 0x00, 0x0D),
      "-0000.99" -> asByteArray(0x00, 0x00, 0x99, 0x0D),
      "-00.99" -> asByteArray(0x00, 0x00, 0x99, 0x0D),
      "-0.99" -> asByteArray(0x00, 0x00, 0x99, 0x0D),
      "-123.4" -> asByteArray(0x01, 0x23, 0x40, 0x0D),
      "-1234.567" -> asByteArray(0x12, 0x34, 0x56, 0x7D),
      "-1234.560" -> asByteArray(0x12, 0x34, 0x56, 0x0D),
      "-0" -> asByteArray(0x00, 0x00, 0x00, 0x0C),
      "-0.0" -> asByteArray(0x00, 0x00, 0x00, 0x0C),
      "-0000.00" -> asByteArray(0x00, 0x00, 0x00, 0x0C),
      null.asInstanceOf[String] -> asByteArray(0x00, 0x00, 0x00, 0x00),
    )
    assertEncodedValues(e, values ++ negativeValues)
  }

  it should "encode decimal for zero scale (odd size)" in {
    val e = DecimalToBinaryEncoder(5, 0)
    val values = List(
      "00000.01" -> asByteArray(0x00, 0x00, 0x0C), //precision loss
      "00000.001" -> asByteArray(0x00, 0x00, 0x0C), //precision loss
      "0000.01" -> asByteArray(0x00, 0x00, 0x0C), //precision loss
      "0.01" -> asByteArray(0x00, 0x00, 0x0C), //precision loss
      "99999.99" -> asByteArray(0x99, 0x99, 0x9C), //precision loss
      "99999.999" -> asByteArray(0x99, 0x99, 0x9C), //precision loss
      "99999" -> asByteArray(0x99, 0x99, 0x9C), //precision loss
      "00001" -> asByteArray(0x00, 0x00, 0x1C),
      "001" -> asByteArray(0x00, 0x00, 0x1C),
      "1" -> asByteArray(0x00, 0x00, 0x1C),
      "00000.99" -> asByteArray(0x00, 0x00, 0x0C), //precision loss
      "000.99" -> asByteArray(0x00, 0x00, 0x0C), //precision loss
      "0.99" -> asByteArray(0x00, 0x00, 0x0C), //precision loss
      "123.4" -> asByteArray(0x00, 0x12, 0x3C), //precision loss
      "12345.67" -> asByteArray(0x12, 0x34, 0x5C),
      "12345.60" -> asByteArray(0x12, 0x34, 0x5C),
      "0" -> asByteArray(0x00, 0x00, 0x0C),
      "0.0" -> asByteArray(0x00, 0x00, 0x0C),
      "00000.00" -> asByteArray(0x00, 0x00, 0x0C),
      null.asInstanceOf[String] -> asByteArray(0x00, 0x00, 0x00),
    )
    val negativeNumbers = List(
      "-00000.01" -> asByteArray(0x00, 0x00, 0x0C), //precision loss
      "-00000.001" -> asByteArray(0x00, 0x00, 0x0C), //precision loss
      "-0000.01" -> asByteArray(0x00, 0x00, 0x0C), //precision loss
      "-0.01" -> asByteArray(0x00, 0x00, 0x0C), //precision loss
      "-99999.99" -> asByteArray(0x99, 0x99, 0x9D), //precision loss
      "-99999.999" -> asByteArray(0x99, 0x99, 0x9D), //precision loss
      "-99999" -> asByteArray(0x99, 0x99, 0x9D), //precision loss
      "-00001" -> asByteArray(0x00, 0x00, 0x1D),
      "-001" -> asByteArray(0x00, 0x00, 0x1D),
      "-1" -> asByteArray(0x00, 0x00, 0x1D),
      "-00000.99" -> asByteArray(0x00, 0x00, 0x0C), //precision loss
      "-000.99" -> asByteArray(0x00, 0x00, 0x0C), //precision loss
      "-0.99" -> asByteArray(0x00, 0x00, 0x0C), //precision loss
      "-123.4" -> asByteArray(0x00, 0x12, 0x3D), //precision loss
      "-12345.67" -> asByteArray(0x12, 0x34, 0x5D),
      "-12345.60" -> asByteArray(0x12, 0x34, 0x5D),
      "-0" -> asByteArray(0x00, 0x00, 0x0C),
      "-0.0" -> asByteArray(0x00, 0x00, 0x0C),
      "-00000.00" -> asByteArray(0x00, 0x00, 0x0C),
      null.asInstanceOf[String] -> asByteArray(0x00, 0x00, 0x00),
    )
    assertEncodedValues(e, values ++ negativeNumbers)
  }

  it should "encode decimal (even size)" in {
    val e = DecimalToBinaryEncoder(4, 2)
    val values = List(
      "0000.01" -> asByteArray(0x00, 0x00, 0x00, 0x1C),
      "0000.001" -> asByteArray(0x00, 0x00, 0x00, 0x0C), //precision loss
      "000.01" -> asByteArray(0x00, 0x00, 0x00, 0x1C),
      "0.01" -> asByteArray(0x00, 0x00, 0x00, 0x1C),
      "9999.99" -> asByteArray(0x09, 0x99, 0x99, 0x9C),
      "9999.999" -> asByteArray(0x09, 0x99, 0x99, 0x9C), //precision loss
      "9999" -> asByteArray(0x09, 0x99, 0x90, 0x0C),
      "0001" -> asByteArray(0x00, 0x00, 0x10, 0x0C),
      "001" -> asByteArray(0x00, 0x00, 0x10, 0x0C),
      "1" -> asByteArray(0x00, 0x00, 0x10, 0x0C),
      "0000.99" -> asByteArray(0x00, 0x00, 0x09, 0x9C),
      "000.99" -> asByteArray(0x00, 0x00, 0x09, 0x9C),
      "0.99" -> asByteArray(0x00, 0x00, 0x09, 0x9C),
      "1234.56" -> asByteArray(0x01, 0x23, 0x45, 0x6C),
      "1234.50" -> asByteArray(0x01, 0x23, 0x45, 0x0C),
      "0" -> asByteArray(0x00, 0x00, 0x00, 0x0C),
      "0.0" -> asByteArray(0x00, 0x00, 0x00, 0x0C),
      "0000.00" -> asByteArray(0x00, 0x00, 0x00, 0x0C),
      null.asInstanceOf[String] -> asByteArray(0x00, 0x00, 0x00, 0x00),
    )

    val negativeValues = List(
      "-0000.01" -> asByteArray(0x00, 0x00, 0x00, 0x1D),
      "-0000.001" -> asByteArray(0x00, 0x00, 0x00, 0x0C), //precision loss
      "-000.01" -> asByteArray(0x00, 0x00, 0x00, 0x1D),
      "-0.01" -> asByteArray(0x00, 0x00, 0x00, 0x1D),
      "-9999.99" -> asByteArray(0x09, 0x99, 0x99, 0x9D),
      "-9999.999" -> asByteArray(0x09, 0x99, 0x99, 0x9D), //precision loss
      "-9999" -> asByteArray(0x09, 0x99, 0x90, 0x0D),
      "-0001" -> asByteArray(0x00, 0x00, 0x10, 0x0D),
      "-001" -> asByteArray(0x00, 0x00, 0x10, 0x0D),
      "-1" -> asByteArray(0x00, 0x00, 0x10, 0x0D),
      "-0000.99" -> asByteArray(0x00, 0x00, 0x09, 0x9D),
      "-000.99" -> asByteArray(0x00, 0x00, 0x09, 0x9D),
      "-0.99" -> asByteArray(0x00, 0x00, 0x09, 0x9D),
      "-1234.56" -> asByteArray(0x01, 0x23, 0x45, 0x6D),
      "-1234.50" -> asByteArray(0x01, 0x23, 0x45, 0x0D),
      "-0" -> asByteArray(0x00, 0x00, 0x00, 0x0C),
      "-0.0" -> asByteArray(0x00, 0x00, 0x00, 0x0C),
      "-0000.00" -> asByteArray(0x00, 0x00, 0x00, 0x0C),
      null.asInstanceOf[String] -> asByteArray(0x00, 0x00, 0x00, 0x00),
    )
    assertEncodedValues(e, values ++ negativeValues)
    //Illegal values
    assertThrows[IllegalArgumentException](e.encodeValue(FieldValue.of(Attribute.PRIMITIVE, "11111.11")))
    assertThrows[IllegalArgumentException](e.encodeValue(FieldValue.of(Attribute.PRIMITIVE, "11111.111")))
    assertThrows[IllegalArgumentException](e.encodeValue(FieldValue.of(Attribute.PRIMITIVE, "11111")))
  }

  it should "encode decimal for zero scale (even size)" in {
    val e = DecimalToBinaryEncoder(4, 0)
    val values = List(
      "0000.01" -> asByteArray(0x00, 0x00, 0x0C), //precision loss
      "000.01" -> asByteArray(0x00, 0x00, 0x0C), //precision loss
      "0.01" -> asByteArray(0x00, 0x00, 0x0C), //precision loss
      "9999.99" -> asByteArray(0x09, 0x99, 0x9C), //precision loss
      "9999.999" -> asByteArray(0x09, 0x99, 0x9C), //precision loss
      "9999" -> asByteArray(0x09, 0x99, 0x9C),
      "0001" -> asByteArray(0x00, 0x00, 0x1C),
      "001" -> asByteArray(0x00, 0x00, 0x1C),
      "1" -> asByteArray(0x00, 0x00, 0x1C),
      "0000.99" -> asByteArray(0x00, 0x00, 0x0C), //precision loss
      "000.99" -> asByteArray(0x00, 0x00, 0x0C), //precision loss
      "0.99" -> asByteArray(0x00, 0x00, 0x0C), //precision loss
      "1234.56" -> asByteArray(0x01, 0x23, 0x4C), //precision loss
      "1234.50" -> asByteArray(0x01, 0x23, 0x4C), //precision loss
      "0" -> asByteArray(0x00, 0x00, 0x0C),
      "0.0" -> asByteArray(0x00, 0x00, 0x0C),
      "0000.00" -> asByteArray(0x00, 0x00, 0x0C),
      null.asInstanceOf[String] -> asByteArray(0x00, 0x00, 0x00),
    )

    val negativeValues = List(
      "-0000.01" -> asByteArray(0x00, 0x00, 0x0C), //precision loss
      "-000.01" -> asByteArray(0x00, 0x00, 0x0C), //precision loss
      "-0.01" -> asByteArray(0x00, 0x00, 0x0C), //precision loss
      "-9999.99" -> asByteArray(0x09, 0x99, 0x9D), //precision loss
      "-9999.999" -> asByteArray(0x09, 0x99, 0x9D), //precision loss
      "-9999" -> asByteArray(0x09, 0x99, 0x9D),
      "-0001" -> asByteArray(0x00, 0x00, 0x1D),
      "-001" -> asByteArray(0x00, 0x00, 0x1D),
      "-1" -> asByteArray(0x00, 0x00, 0x1D),
      "-0000.99" -> asByteArray(0x00, 0x00, 0x0C), //precision loss
      "-000.99" -> asByteArray(0x00, 0x00, 0x0C), //precision loss
      "-0.99" -> asByteArray(0x00, 0x00, 0x0C), //precision loss
      "-1234.56" -> asByteArray(0x01, 0x23, 0x4D), //precision loss
      "-1234.50" -> asByteArray(0x01, 0x23, 0x4D), //precision loss
      "0" -> asByteArray(0x00, 0x00, 0x0C),
      "0.0" -> asByteArray(0x00, 0x00, 0x0C),
      "0000.00" -> asByteArray(0x00, 0x00, 0x0C),
      null.asInstanceOf[String] -> asByteArray(0x00, 0x00, 0x00),
    )
    assertEncodedValues(e, values ++ negativeValues)
    //illegal values
    assertThrows[IllegalArgumentException](e.encodeValue(FieldValue.of(Attribute.PRIMITIVE, "11111.11")))
    assertThrows[IllegalArgumentException](e.encodeValue(FieldValue.of(Attribute.PRIMITIVE, "11111")))
  }

  private def asByteArray(bytes: Int*): Array[Byte] = {
    bytes.map(_.toByte).toArray
  }

  private def assertEncodedValues(e: BinaryEncoder, valueToBinaryValue: List[(String, Array[Byte])]): Unit = {
    valueToBinaryValue.map {
      case (strValue, bytes) => FieldValue.of(Attribute.PRIMITIVE, strValue) -> bytes
    }.foreach {
      case (fieldValue, expected) =>
        val actual = e.encodeValue(fieldValue)
        if (!expected.sameElements(actual)) {
          val expectedMessage = expected.map("0x%02X" format _).mkString("Array(", ", ", ")")
          val actualMessage = actual.map("0x%02X" format _).mkString("Array(", ", ", ")")
          print(s"Expected $expectedMessage, actual $actualMessage")
        }
        assertResult(expected)(actual)
    }
  }

}
