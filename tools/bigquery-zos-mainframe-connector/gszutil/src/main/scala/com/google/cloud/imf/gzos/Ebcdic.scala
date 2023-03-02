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

import java.nio.charset.Charset

import com.google.cloud.gszutil.Transcoder

/** Default Transcoder
  * Uses EBCDIC US charset by default.
  * Obtains charset name from ENCODING environment variable.
  */
case object Ebcdic extends Transcoder {
  override final val charset: Charset = {
    sys.env.get("ENCODING") match {
      case Some(charset) =>
        System.out.println(s"Using Charset '$charset'")
        Charset.forName(charset)
      case None =>
        new EBCDIC1()
    }
  }
  override val SP: Byte = 0x40
}
