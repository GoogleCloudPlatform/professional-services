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

import com.google.cloud.gszutil.Decoding.Decimal64Decoder
import com.google.cloud.gszutil.Encoding.DecimalToBinaryEncoder

object CopyBookDecoderAndEncoderOps {
  // Note: omit trailing '.' because it will be removed prior to regex matching
  val charRegex = """PIC X\((\d{1,3})\)""".r
  val charRegex2 = """PIC T\((\d{1,4})\)""".r
  val charRegex3 = """PIC (X{1,9})""".r
  val bytesRegex = """PIC X\((\d{4,})\)""".r
  val numStrRegex = """PIC 9\((\d{1,3})\)""".r
  val numStrRegex2 = """PIC (9{1,9})""".r
  val numStrRegex3 = """PIC \+9\((\d{1,3})\)""".r
  val decStrRegex = """PIC 9\((\d{1,3})\)V9\((\d{1,3})\)""".r
  val decStrRegex3 = """PIC 9\((\d{1,3})\)V(9{1,7})""".r
  val decStrRegex4 = """PIC (9{1,9})V(9{1,9})""".r
  val decStrRegex2 = """PIC \+9\((\d{1,3})\)\.9\((\d{1,3})\)""".r
  val intRegex = """PIC S9\((\d{1,3})\) COMP""".r
  val uintRegex = """PIC 9\((\d{1,3})\) COMP""".r
  val decRegex = """PIC S9\((\d{1,3})\) COMP-3""".r
  val decRegex4 = """PIC S(9{1,9}) COMP-3""".r
  val decRegex2 = """PIC S9\((\d{1,3})\)V9\((\d{1,3})\) COMP-3""".r
  val decRegex3 = """PIC S9\((\d{1,3})\)V(9{1,9}) COMP-3""".r
  val decRegex5 = """PIC S(9{1,9})V(9{1,9}) COMP-3""".r
  val decRegex6 = """PIC S(9{1,9})V9\((\d{1,3})\) COMP-3""".r

  val types: Map[String,(Decoder, BinaryEncoder)] = Map(
    "PIC S9(6)V99 COMP-3" -> (Decimal64Decoder(9,2), DecimalToBinaryEncoder(9,2)),
    "PIC S9(13)V99 COMP-3" -> (Decimal64Decoder(9,2), DecimalToBinaryEncoder(9,2)),
    "PIC S9(7)V99 COMP-3" -> (Decimal64Decoder(7,2), DecimalToBinaryEncoder(7,2)),
  )
}
