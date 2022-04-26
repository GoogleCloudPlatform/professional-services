package com.google.cloud.gszutil

import com.google.cloud.gszutil.Decoding.Decimal64Decoder
import com.google.cloud.gszutil.Encoding.DecimalToBinaryEncoder

object CopyBookDecoderAndEncoderOps {

  val charRegex = """PIC X\((\d{1,3})\)""".r
  val charRegex2 = """PIC T\((\d{1,4})\)""".r
  val bytesRegex = """PIC X\((\d{4,})\)""".r
  val numStrRegex = """PIC 9\((\d{1,3})\)""".r
  val intRegex = """PIC S9\((\d{1,3})\) COMP""".r
  val uintRegex = """PIC 9\((\d{1,3})\) COMP""".r
  val decRegex = """PIC S9\((\d{1,3})\) COMP-3""".r
  val decRegex2 = """PIC S9\((\d{1,3})\)V9\((\d{1,3})\) COMP-3""".r
  val decRegex3 = """PIC S9\((\d{1,3})\)V(9{1,6}) COMP-3""".r

  val types: Map[String,(Decoder, BinaryEncoder)] = Map(
    "PIC S9(6)V99 COMP-3" -> (Decimal64Decoder(9,2), DecimalToBinaryEncoder(9,2)),
    "PIC S9(13)V99 COMP-3" -> (Decimal64Decoder(9,2), DecimalToBinaryEncoder(9,2)),
    "PIC S9(7)V99 COMP-3" -> (Decimal64Decoder(7,2), DecimalToBinaryEncoder(7,2)),
  )
}
