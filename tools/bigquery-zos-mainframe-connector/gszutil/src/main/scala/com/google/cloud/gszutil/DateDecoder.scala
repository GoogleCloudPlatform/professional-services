package com.google.cloud.gszutil

import java.time.format.DateTimeFormatter

/** Teradata date format delimiters are ignored
  * so YYYY/MM/DD accepts 2020-04-09
  * therefore, we remove the delimiters from the format
  * and remove them from the incoming value prior to parsing
  */
trait DateDecoder extends Decoder {
  val format: String
  protected val pattern: String = format
    .filter(_.isLetter)
    .replaceAllLiterally("D","d")
    .replaceAllLiterally("Y","y")
  protected val fmt: DateTimeFormatter = DateTimeFormatter.ofPattern(pattern)
}
