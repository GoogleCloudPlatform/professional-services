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

package com.google.cloud.bqsh

import com.google.cloud.gszutil.Decoding._
import com.google.cloud.gszutil.Encoding._
import com.google.cloud.gszutil.{CopyBook, Decoding, Encoding, Utf8}
import com.google.cloud.imf.gzos.{Ebcdic, LocalizedTranscoder, Util}
import com.google.cloud.imf.util.Logging
import org.scalatest.flatspec.AnyFlatSpec

class CopyBookSpec extends AnyFlatSpec with Logging {

  val picTCharset = Some("JPNEBCDIC1399_4IJ")
  val localizedTranscoder = LocalizedTranscoder(picTCharset)
  val transcoder = Ebcdic
  val cbFields = Seq(
    "PIC S9 COMP." -> (new LongDecoder(2), LongToBinaryEncoder(2)),
    "PIC S9(4) COMP." -> (new LongDecoder(2), LongToBinaryEncoder(2)),
    "PIC S9(5) COMP." -> (new LongDecoder(4), LongToBinaryEncoder(4)),
    "PIC S9(9) COMP." -> (new LongDecoder(4), LongToBinaryEncoder(4)),
    "PIC S9(10) COMP." -> (new LongDecoder(8), LongToBinaryEncoder(8)),
    "PIC S9(18) COMP." -> (new LongDecoder(8), LongToBinaryEncoder(8)),
    "PIC 9 COMP." -> (UnsignedLongDecoder(2), LongToBinaryEncoder(2)),
    "PIC 9(4) COMP." -> (UnsignedLongDecoder(2), LongToBinaryEncoder(2)),
    "PIC 9(5) COMP." -> (UnsignedLongDecoder(4), LongToBinaryEncoder(4)),
    "PIC 9(9) COMP." -> (UnsignedLongDecoder(4), LongToBinaryEncoder(4)),
    "PIC 9(10) COMP." -> (UnsignedLongDecoder(8), LongToBinaryEncoder(8)),
    "PIC 9(18) COMP." -> (UnsignedLongDecoder(8), LongToBinaryEncoder(8)),
    "PIC X." -> (new NullableStringDecoder(transcoder, 1, Array.emptyByteArray), StringToBinaryEncoder(transcoder, 1)),
    "PIC X(8)." -> (new NullableStringDecoder(transcoder, 8, Array.emptyByteArray), StringToBinaryEncoder(transcoder, 8)),
    "PIC X(16)." -> (new NullableStringDecoder(transcoder, 16, Array.emptyByteArray), StringToBinaryEncoder(transcoder, 16)),
    "PIC X(30)." -> (new NullableStringDecoder(transcoder, 30, Array.emptyByteArray), StringToBinaryEncoder(transcoder, 30)),
    "PIC X(20)." -> (new NullableStringDecoder(transcoder, 20, Array.emptyByteArray), StringToBinaryEncoder(transcoder, 20)),
    "PIC X(2)." -> (new NullableStringDecoder(transcoder, 2, Array.emptyByteArray), StringToBinaryEncoder(transcoder, 2)),
    "PIC X(10)." -> (new NullableStringDecoder(transcoder, 10, Array.emptyByteArray), StringToBinaryEncoder(transcoder, 10)),
    "PIC S9(9)V9(2) COMP-3." -> (Decimal64Decoder(9,2), DecimalToBinaryEncoder(9,2)),
    "PIC S9(9)V9(3) COMP-3." -> (Decimal64Decoder(9,3), DecimalToBinaryEncoder(9,3)),
    "PIC S9(13) COMP-3." -> (Decimal64Decoder(13,0), DecimalToBinaryEncoder(13,0)),
    "PIC S9(13)V9(0) COMP-3." -> (Decimal64Decoder(13,0), DecimalToBinaryEncoder(13,0)),
    "PIC S9(3) COMP-3." -> (Decimal64Decoder(3,0), DecimalToBinaryEncoder(3,0)),
    "PIC S9(7) COMP-3." -> (Decimal64Decoder(7,0), DecimalToBinaryEncoder(7,0)),
    "PIC S9(9) COMP-3." -> (Decimal64Decoder(9,0), DecimalToBinaryEncoder(9,0)),
    "PIC S9(9)V99 COMP-3." -> (Decimal64Decoder(9,2), DecimalToBinaryEncoder(9,2)),
    "PIC S9(6)V99 COMP-3." -> (Decimal64Decoder(6,2), DecimalToBinaryEncoder(6,2)),
    "PIC S9(13)V99 COMP-3." -> (Decimal64Decoder(13,2), DecimalToBinaryEncoder(13,2)),
    "PIC S9(7)V99 COMP-3." -> (Decimal64Decoder(7,2), DecimalToBinaryEncoder(7,2)),
    "PIC S9(7)V999 COMP-3." -> (Decimal64Decoder(7,3), DecimalToBinaryEncoder(7,3)),
    "PIC S9(16)V9(2) COMP-3." -> (Decimal64Decoder(16,2), DecimalToBinaryEncoder(16,2)),
    "PIC X(4064)" -> (new BytesDecoder(4064), BytesToBinaryEncoder(4064)),
    "PIC T(100)" -> (new LocalizedNullableStringDecoder(localizedTranscoder, 100, Array.emptyByteArray), LocalizedStringToBinaryEncoder(localizedTranscoder, 100))
  )

  "CopyBook" should "parse" in {
    val examples = Seq(
      """       01 DAILY-ITEMS.
        |          03 STORE               PIC S9(4) COMP.
        |          03 ITEM                PIC S9(9) COMP.
        |          03 WEEK                PIC S9(4) COMP.
        |          03 PRICE               PIC S9(9)V9(2) COMP-3.
        |          03 SALES               PIC S9(9)V9(2) COMP-3.
        |          03 QTY                 PIC S9(9) COMP.
        |          03 LOCATION            PIC X.
        |          03 TYPE-CODE           PIC X(08).
      """.stripMargin,
      """        03  STOREKEY.
        |            05 CODE            PIC X(08).
        |            05 STORE-NO        PIC S9(03)   COMP-3.
        |        03  DATE               PIC S9(07)   COMP-3.
        |        03  DEPT-NO            PIC S9(03)   COMP-3.
        |        03  QTY-SOLD           PIC S9(9)    COMP-3.
        |        03  SALE-PRICE         PIC S9(9)V99 COMP-3.
      """.stripMargin,
      """       01 TEST-TABLE-THREE.
        |          03 COL_1      PIC S9(9) COMP.
        |          03 COL_2      PIC S9(9) COMP.
        |          03 COL_3      PIC S9(4) COMP.
        |          03 COL_4      PIC S9(9) COMP.
        |          03 COL_5      PIC S9(16)V9(2) COMP-3.
        |          03 COL_6      PIC S9(16)V9(2) COMP-3.
        |          03 COL_7      PIC S9(9) COMP.
        |          03 COL_8      PIC S9(16)V9(2) COMP-3.
        |          03 COL_9      PIC S9(16)V9(2) COMP-3.
        |          03 COL_10     PIC S9(9) COMP.
        |          03 COL_11     PIC S9(9) COMP.
        |          03 COL_12     PIC S9(9) COMP.
      """.stripMargin,
      """       01 EXAMPLE-DATA-REC.
        |          03 DEPT_NBR   PIC X(02).
        |          03 ITEM_CODE  PIC X(04).
        |          03 VEN_NBR    PIC X(06).
      """.stripMargin,
      """    01  TEST-LAYOUT-FIVE.
        |        03  COL-A                    PIC S9(9) COMP.
        |        03  COL-B                    PIC S9(4) COMP.
        |        03  COL-C                    PIC S9(4) COMP.
        |        03  COL-D                    PIC X(01).
        |        03  COL-E                    PIC S9(9) COMP.
        |        03  COL-F                    PIC S9(07)V9(2) COMP-3.
        |        03  COL-G                    PIC S9(05)V9(4) COMP-3.
        |        03  COL-H                    PIC S9(9) COMP.
        |        03  COL-I                    PIC S9(9) COMP.
        |        03  COL-J                    PIC S9(4) COMP.
        |        03  COL-K                    PIC S9(16)V9(2) COMP-3.
        |        03  COL-L                    PIC S9(16)V9(2) COMP-3.
        |        03  COL-M                    PIC S9(16)V9(2) COMP-3.
      """.stripMargin
    )
    val expectedLRECL = Seq(33, 27, 70, 12, 63)
    val expectedFieldCount = Seq(8, 6, 12, 3, 13)
    examples.indices.foreach{i =>
      val cb = CopyBook(examples(i), Utf8)
      assert(cb.LRECL == expectedLRECL(i))
      assert(cb.fieldNames.length == expectedFieldCount(i))
    }
  }

  it should "map types" in {
    cbFields.foreach{x =>
      val picString = x._1
      val expectedDecoder = x._2._1
      val decoder = Decoding.typeMap(picString, transcoder, picTCharset, filler = false, isDate = false)
      assert(decoder == expectedDecoder)
    }
  }

  it should "get encoders" in {
    cbFields.foreach{x =>
      val picString = x._1
      val expectedEncoder = x._2._2
      val decoder = Decoding.typeMap(picString, transcoder, picTCharset, filler = false, isDate = true)
      val encoder = Encoding.getEncoder(CopyBookField("", decoder, picString), transcoder, picTCharset)
      assert(encoder == expectedEncoder)
    }
  }

  it should "get date encoder PIC S9(9) COMP." in {
    val picString = "PIC S9(9) COMP."
    val expectedEncoder = DateStringToBinaryEncoder()
    val decoder = Decoding.typeMap(picString, transcoder, picTCharset, filler = false, isDate = true)
    val encoder = Encoding.getEncoder(CopyBookField("03  DATE", decoder, picString), transcoder, picTCharset)
    assert(encoder == expectedEncoder)
  }

  it should "trim" in {
    assert(Util.trimRight("abc   ", ' ') == "abc")
    assert(Util.trimRight("   ", ' ') == "")
    assert(Util.trimRight("", ' ') == "")
  }
}
