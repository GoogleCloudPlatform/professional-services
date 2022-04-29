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

import java.nio.charset.StandardCharsets
import java.time.LocalDate

import com.google.cloud.gszutil.Decoding.{StringDecoder,NullableStringDecoder,StringAsIntDecoder,
  StringAsDateDecoder,IntegerAsDateDecoder,StringAsDecimalDecoder}
import com.google.cloud.imf.gzos.pb.GRecvProto.Record.Field
import org.apache.hadoop.hive.ql.exec.vector.{BytesColumnVector, ColumnVector, DateColumnVector, Decimal64ColumnVector, LongColumnVector}

object VartextDecoding {
  def getVartextDecoder(f: Field, transcoder: Transcoder): Decoder = {
    import com.google.cloud.imf.gzos.pb.GRecvProto.Record.Field.FieldType._
    val filler: Boolean = f.getFiller || f.getName.toUpperCase.startsWith("FILLER")
    if (f.getTyp == STRING) {
      if (f.getCast == INTEGER)
        new VartextStringAsIntDecoder(transcoder, f.getSize, filler)
      else if (f.getCast == DATE)
        new VartextStringAsDateDecoder(transcoder, f.getSize, f.getFormat, filler)
      else if (f.getCast == DECIMAL)
        new VartextStringAsDecimalDecoder(transcoder, f.getSize,
          f.getPrecision, f.getScale, filler)
      else if (f.getCast == LATIN_STRING) {
        val nullIf = Option(f.getNullif)
          .map(_.getValue.toByteArray)
          .getOrElse(Array.empty)
        new VartextNullableStringDecoder(LatinTranscoder, f.getSize, nullIf,
          filler = filler)
      } else {
        val nullIf = Option(f.getNullif)
          .map(_.getValue.toByteArray)
          .getOrElse(Array.empty)
        if (nullIf.isEmpty)
          new VartextStringDecoder(transcoder, f.getSize, filler = filler)
        else
          new VartextNullableStringDecoder(transcoder, f.getSize, nullIf, filler =
            filler)
      }
    } else if (f.getTyp == INTEGER) {
      if (f.getCast == DATE){
        new VartextIntegerAsDateDecoder(transcoder, f.getSize, filler)
      } else new VartextStringAsIntDecoder(transcoder, f.getSize, filler)
    } else if (f.getTyp == DECIMAL)
      new VartextStringAsDecimalDecoder(transcoder, f.getSize, f.getPrecision, f
        .getScale, filler)
    else if (f.getTyp == DATE)
      new VartextStringAsDateDecoder(transcoder, f.getSize, f.getFormat, filler)
    else if (f.getTyp == UNSIGNED_INTEGER)
      new VartextStringAsIntDecoder(transcoder, f.getSize, filler)
    else
      throw new IllegalArgumentException("unrecognized field type")
  }

  class VartextStringDecoder(override val transcoder: Transcoder,
                             override val size: Int,
                             override val filler: Boolean = false)
    extends StringDecoder(transcoder, size, filler) with VartextDecoder {
    override def get(s: String, row: ColumnVector, i: Int): Unit = {
      val bcv = row.asInstanceOf[BytesColumnVector]
      val bytes = s.getBytes(StandardCharsets.UTF_8)
      val dest = bcv.getValPreallocatedBytes
      val destPos = bcv.getValPreallocatedStart
      System.arraycopy(bytes, 0, dest, destPos, bytes.length)
      bcv.setValPreallocated(i, bytes.length)
    }
  }

  class VartextNullableStringDecoder(override val transcoder: Transcoder,
                                     override val size: Int,
                                     override val nullIf: Array[Byte],
                                     override val filler: Boolean = false)
    extends NullableStringDecoder(transcoder, size, nullIf, filler) with VartextDecoder {
    private val nullStr = new String(nullIf, transcoder.charset)
    override def get(s: String, row: ColumnVector, i: Int): Unit = {
      val bcv = row.asInstanceOf[BytesColumnVector]
      if (s == nullStr){
        bcv.isNull(i) = true
        bcv.noNulls = false
        bcv.setValPreallocated(i, 0)
      } else {
        val bytes = s.getBytes(StandardCharsets.UTF_8)
        val dest = bcv.getValPreallocatedBytes
        val destPos = bcv.getValPreallocatedStart
        System.arraycopy(bytes, 0, dest, destPos, bytes.length)
        bcv.setValPreallocated(i, bytes.length)
      }
    }
  }

  class VartextStringAsIntDecoder(override val transcoder: Transcoder,
                                  override val size: Int,
                                  override val filler: Boolean = false)
    extends StringAsIntDecoder(transcoder, size, filler) with VartextDecoder {
    override def get(s: String, row: ColumnVector, i: Int): Unit = {

      val s1 = { // remove all trailing zeros from number so long can be converted !
        val arr = s.split("\\.")
        if (arr.length == 2 && arr(1).matches("^0+$"))
          arr(0)
        else
          s
      }
      row.asInstanceOf[LongColumnVector].vector.update(i, s1.toLong)
    }
  }

  class VartextStringAsDateDecoder(override val transcoder: Transcoder,
                                   override val size: Int,
                                   override val format: String,
                                   override val filler: Boolean = false)
    extends StringAsDateDecoder(transcoder, size, format, filler) with VartextDecoder {
    override def get(s: String, row: ColumnVector, i: Int): Unit = {
      val dcv = row.asInstanceOf[DateColumnVector]
      if (s.count(_ == '0') == 8) {
        dcv.vector.update(i, -1)
        dcv.isNull.update(i, true)
      } else {
        val dt = LocalDate.from(fmt.parse(s.filter(_.isDigit))).toEpochDay
        dcv.vector.update(i, dt)
      }
    }
  }

  class VartextIntegerAsDateDecoder(override val transcoder: Transcoder,
                                    override val size: Int,
                                    override val filler: Boolean = false)
    extends IntegerAsDateDecoder(size, filler = filler) with VartextDecoder {
    override def get(s: String, row: ColumnVector, i: Int): Unit = {
      putValue(s.toLong, row, i)
    }
  }

  class VartextStringAsDecimalDecoder(override val transcoder: Transcoder,
                                      override val size: Int,
                                      precision: Int,
                                      scale: Int,
                                      override val filler: Boolean = false)
    extends StringAsDecimalDecoder(transcoder, size, precision, scale, filler) with VartextDecoder {
    override def get(s: String, row: ColumnVector, i: Int): Unit = {
      val j1 = s.indexOf('.')
      val scale1 = s.length - (j1+1)
      require(scale1 == scale, s"$s has scale $scale1 but expected $scale")
      val j0 = s.indexWhere(_ != '0')
      val long =
        if (j0 == -1) 0L
        else (s.substring(j0,j1) + s.substring(j1+1,s.length)).toLong
      row.asInstanceOf[Decimal64ColumnVector].vector.update(i, long)
    }
  }
}
