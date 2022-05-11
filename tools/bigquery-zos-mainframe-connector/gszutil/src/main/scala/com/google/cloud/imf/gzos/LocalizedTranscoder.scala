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

package com.google.cloud.imf.gzos

import com.google.cloud.gszutil.Transcoder

import java.nio.charset.Charset

case class LocalizedTranscoder(localizedCharset: Option[String]) extends Transcoder {
  require(localizedCharset.isDefined, "Charset for international type is mandatory.")

  override val charset: Charset = localizedCharset
    .map(aliasToCharset)
    .map(c => Charset.forName(c))
    .get

  override val SP: Byte = charset.encode(" ").array().head

  private def aliasToCharset(alias: String): String = {
    Option(alias).getOrElse("").trim.toLowerCase match {
      case "jpnebcdic1399_4ij" => "x-IBM939"
      case "schebcdic935_6ij" => "x-IBM935"
      case s => s
    }
  }
}
