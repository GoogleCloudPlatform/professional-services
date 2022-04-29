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
