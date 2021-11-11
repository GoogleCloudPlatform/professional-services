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
import java.nio.charset.Charset

import com.google.cloud.gszutil.Util.Logging
import com.google.common.base.Charsets
import com.ibm.jzos.fields.daa
import org.apache.hadoop.hive.ql.exec.vector._
import org.apache.hadoop.hive.serde2.io.HiveDecimalWritable
import org.apache.orc.TypeDescription

import scala.collection.mutable.ArrayBuffer


object Decoding extends Logging {
  final val CP1047: Charset = Charset.forName("CP1047")

  // EBCDIC decimal byte values that map to valid ASCII characters
  private val validAscii = Array(
    75,76,77,78,79,80,
    91,92,93,94,95,96,97,
    107,108,109,110,111,
    121,122,123,124,125,126,127,
    129,130,131,132,133,134,135,136,137,
    145,146,147,148,149,150,151,152,153,
    161,162,163,164,165,166,167,168,169,
    173,
    189,
    192,193,194,195,196,197,198,199,200,201,
    208,209,210,211,212,213,214,215,216,217,
    224,
    226,227,228,229,230,231,232,233,
    240,241,242,243,244,245,246,247,248,249
  )

  final val Space: Byte = " ".getBytes(Charsets.US_ASCII).head

  final val EBCDIC2ASCII: Array[Byte] = {
    val buf = ByteBuffer.wrap((0 until 256).map(_.toByte).toArray)
    val cb = CP1047.decode(buf)
    val a = Array.fill(256)(Space)
    val b = cb.toString.toCharArray.map(_.toByte)
    for (i <- validAscii) a(i) = b(i)

    a(0xBA) = uint(91).toByte // EBCDIC [ is not the same as CP1047
    a(0xBB) = uint(93).toByte // EBCDIC ] is not the same as CP1047
    a
  }

  def ebcdic2ASCIIByte(b: Byte): Byte = EBCDIC2ASCII(uint(b))

  def ebcdic2ASCIIBytes(a: Array[Byte]): Array[Byte] = {
    val a1 = new Array[Byte](a.length)
    var i = 0
    while (i < a.length){
      a1(i) = EBCDIC2ASCII(uint(a(i)))
      i += 1
    }
    a1
  }

  def ebcdic2ASCIIString(a: Array[Byte]): String = {
    new String(ebcdic2ASCIIBytes(a), Charsets.UTF_8)
  }

  final val EBCDIC: Array[Byte] = {
    val buf = ByteBuffer.wrap((0 until 256).map(_.toByte).toArray)
    val a: Array[Byte] = CP1047.decode(buf)
      .toString
      .toCharArray
      .map(_.toByte)
    a(0xBA) = uint(91).toByte // [
    a(0xBB) = uint(93).toByte // ]
    a
  }

  def ebcdic2utf8byte(b: Byte): Byte = EBCDIC(uint(b))

  def ebcdic2utf8string(a: Array[Byte]): String = {
    new String(ebcdic2utf8bytes(a), Charsets.UTF_8)
  }

  def ebcdic2utf8bytes(a: Array[Byte]): Array[Byte] = {
    val a1 = new Array[Byte](a.length)
    var i = 0
    while (i < a.length){
      a1(i) = ebcdic2utf8byte(a(i))
      i += 1
    }
    a1
  }

  def uint(b: Byte): Int = {
    if (b < 0) 256 + b
    else b
  }

  def pad(x: Int): String = {
    val s = x.toString
    val n = s.length
    if (n < 4)
      "    ".substring(0, 4 - n) + s
    else s
  }

  trait Decoder {
    val size: Int

    /** Read a field into a mutable output builder
      *
      * @param buf ByteBuffer
      * @param i field index
      */
    def get(buf: ByteBuffer, row: ColumnVector, i: Int): Unit

    def columnVector(maxSize: Int): ColumnVector

    def typeDescription: TypeDescription
  }

  case class StringDecoder(override val size: Int, ascii: Boolean = true) extends Decoder {
    private final val charMap = if (ascii) EBCDIC2ASCII else EBCDIC
    override def get(buf: ByteBuffer, row: ColumnVector, i: Int): Unit = {
      val bcv = row.asInstanceOf[BytesColumnVector]
      val res = bcv.getValPreallocatedBytes
      var j = bcv.getValPreallocatedStart
      val j1 = j + size
      while (j < j1){
        res(j) = charMap(uint(buf.get))
        j += 1
      }
      bcv.setValPreallocated(i, size)
    }

    override def columnVector(maxSize: Int): ColumnVector = {
      val cv = new BytesColumnVector(maxSize)
      cv.initBuffer(size)
      cv
    }

    override def typeDescription: TypeDescription =
      TypeDescription.createChar().withMaxLength(size)

    override def toString: String = s"$size byte STRING"
  }

  case class LongDecoder(override val size: Int) extends Decoder {
    override def get(buf: ByteBuffer, row: ColumnVector, i: Int): Unit = {
      row.asInstanceOf[LongColumnVector]
        .vector.update(i, Binary.decode(buf, size))
    }

    override def columnVector(maxSize: Int): ColumnVector =
      new LongColumnVector(maxSize)

    override def typeDescription: TypeDescription =
      TypeDescription.createLong

    override def toString: String = s"$size byte INT64"
  }

  case class UnsignedLongDecoder(override val size: Int) extends Decoder {
    override def get(buf: ByteBuffer, row: ColumnVector, i: Int): Unit = {
      row.asInstanceOf[LongColumnVector]
        .vector.update(i, Binary.decodeUnsigned(buf, size))
    }

    override def columnVector(maxSize: Int): ColumnVector =
      new LongColumnVector(maxSize)

    override def typeDescription: TypeDescription =
      TypeDescription.createLong

    override def toString: String = s"$size byte INT64"
  }

  /** The maximum length of a computational item is 18 decimal digits,
    * except for a PACKED-DECIMAL item. If the ARITH(COMPAT) compiler option
    * is in effect, then the maximum length of a PACKED-DECIMAL item is
    * 18 decimal digits. If the ARITH(EXTEND) compiler option is in effect,
    * then the maximum length of a PACKED-DECIMAL item is 31 decimal digits.
    *
    * @param p numeric character positions
    * @param s decimal scaling positions
    */
  case class DecimalDecoder(p: Int, s: Int) extends Decoder {
    private val precision = p+s
    require(p + s <= 31 && p + s > 18, s"precision $precision not in range [19,31]")
    override val size: Int = PackedDecimal.sizeOf(p,s)

    // Use scale 0 to avoid rounding when converting to BigInteger for HiveDecimal
    private val field = new daa.PackedBigDecimalField(0, precision, 0)

    override def get(buf: ByteBuffer, row: ColumnVector, i: Int): Unit = {
      val r = row.asInstanceOf[DecimalColumnVector]
      val bigIntegerBytes = field.getBigDecimal(buf.array, buf.position)
        .toBigIntegerExact
        .toByteArray
      buf.position(buf.position + size)
      val w = new HiveDecimalWritable()
      w.setFromBigIntegerBytesAndScale(bigIntegerBytes, s)
      r.set(i, w)
    }

    override def columnVector(maxSize: Int): ColumnVector =
      new DecimalColumnVector(maxSize, p+s, s)

    override def typeDescription: TypeDescription =
      TypeDescription.createDecimal
        .withScale(s)
        .withPrecision(p+s)

    override def toString: String = s"$size byte NUMERIC($p,$s)"
  }

  case class Decimal64Decoder(p: Int, s: Int) extends Decoder {
    require(p+s <= 18 && p+s > 0, s"precision ${p+s} not in range [1,18]")
    override val size: Int = PackedDecimal.sizeOf(p,s)

    override def get(buf: ByteBuffer, row: ColumnVector, i: Int): Unit = {
      val x = PackedDecimal.unpack(buf, size)
      val vec: Array[Long] = row.asInstanceOf[Decimal64ColumnVector].vector
      if (x > TypeDescription.MAX_DECIMAL64 && PackedDecimal.relaxedParsing) {
        vec.update(i, TypeDescription.MAX_DECIMAL64)
      } else if (x < TypeDescription.MIN_DECIMAL64 && PackedDecimal.relaxedParsing) {
        vec.update(i, TypeDescription.MIN_DECIMAL64)
      } else {
        vec.update(i, x)
      }
    }

    override def columnVector(maxSize: Int): ColumnVector =
      new Decimal64ColumnVector(maxSize, p+s, s)

    override def typeDescription: TypeDescription =
      TypeDescription.createDecimal
        .withScale(s)
        .withPrecision(p+s)

    override def toString: String = s"$size byte NUMERIC($p,$s)"
  }

  private val charRegex = """PIC X\((\d{1,3})\)""".r
  private val numStrRegex = """PIC 9\((\d{1,3})\)""".r
  private val intRegex = """PIC S9\((\d{1,3})\) COMP""".r
  private val uintRegex = """PIC 9\((\d{1,3})\) COMP""".r
  private val decRegex = """PIC S9\((\d{1,3})\) COMP-3""".r
  private val decRegex2 = """PIC S9\((\d{1,3})\)V9\((\d{1,3})\) COMP-3""".r
  private val decRegex3 = """PIC S9\((\d{1,3})\)V(9{1,6}) COMP-3""".r
  def typeMap(typ: String): Decoder = {
    typ.stripSuffix(".") match {
      case charRegex(size) =>
        StringDecoder(size.toInt)
      case "PIC X" =>
        StringDecoder(1)
      case numStrRegex(size) =>
        StringDecoder(size.toInt)
      case decRegex(p) if p.toInt >= 1 =>
        p.toInt match {
          case x if x <= 18 =>
            Decimal64Decoder(p.toInt, 0)
          case _ =>
            DecimalDecoder(p.toInt, 0)
        }
      case decRegex2(p,s) if p.toInt >= 1 =>
        (p.toInt, s.toInt) match {
          case (p1,s1) if p1+s1 <= 18 =>
            Decimal64Decoder(p1, s1)
          case (p1,s1) =>
            DecimalDecoder(p1, s1)
        }
      case decRegex3(p,s) if p.toInt >= 1 =>
        (p.toInt, s.length) match {
          case (p1,s1) if p1+s1 <= 18 =>
            Decimal64Decoder(p1, s1)
          case (p1,s1) =>
            DecimalDecoder(p1, s1)
        }
      case "PIC S9 COMP" =>
        LongDecoder(2)
      case "PIC 9 COMP" =>
        UnsignedLongDecoder(2)
      case intRegex(p) if p.toInt <= 18 && p.toInt >= 1 =>
        val x = p.toInt
        if (x <= 4)
          LongDecoder(2)
        else if (x <= 9)
          LongDecoder(4)
        else
          LongDecoder(8)

      case uintRegex(p) if p.toInt <= 18 && p.toInt >= 1 =>
        val x = p.toInt
        if (x <= 4)
          UnsignedLongDecoder(2)
        else if (x <= 9)
          UnsignedLongDecoder(4)
        else
          UnsignedLongDecoder(8)
      case x =>
        types(x)
    }
  }

  val types: Map[String,Decoder] = Map(
    "PIC S9(6)V99 COMP-3" -> Decimal64Decoder(9,2),
    "PIC S9(13)V99 COMP-3" -> Decimal64Decoder(9,2),
    "PIC S9(7)V99 COMP-3" -> Decimal64Decoder(7,2)
  )

  sealed trait CopyBookLine
  case class CopyBookTitle(name: String) extends CopyBookLine {
    override def toString: String = name
  }
  case class CopyBookField(name: String, decoder: Decoder) extends CopyBookLine {
    override def toString: String = s"${decoder.size}\t$name\t$decoder"
  }
  case class Occurs(n: Int) extends CopyBookLine

  private val titleRegex = """^\d{1,2}\s+([A-Z0-9-_]*)\.$""".r
  private val titleRegex2 = """^[A-Z]+\s+\d{1,2}\s+([A-Z0-9-_]*)\.$""".r
  private val fieldRegex = """^\d{1,2}\s+([A-Z0-9-_]*)\s*(PIC.*)$""".r
  private val occursRegex = """^OCCURS (\d{1,2}) TIMES.$""".r

  def parseCopyBookLine(s: String): Option[CopyBookLine] = {
    val f = s.takeWhile(_ != '*').trim
    f match {
      case fieldRegex(name, typ) =>
        val typ1 = typ
          .replaceFirst("""\s+COMP""", " COMP")
          .replaceFirst("""\(0""", """\(""")
        val decoder = typeMap(typ1)
        Option(CopyBookField(name.trim, decoder))
      case titleRegex(name) =>
        Option(CopyBookTitle(name))
      case titleRegex2(name) =>
        Option(CopyBookTitle(name))
      case occursRegex(n) if n.forall(Character.isDigit) =>
        Option(Occurs(n.toInt))
      case x: String if x.isEmpty =>
        None
      case _ =>
        throw new RuntimeException(s"'$f' did not match a regex")
    }
  }
}
