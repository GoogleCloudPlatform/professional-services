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

package com.google.cloud.imf.util

import org.apache.logging.log4j.core.{LogEvent, StringLayout}
import org.mockito.ArgumentMatchers._
import org.mockito.Mockito._
import org.scalatest.flatspec.AnyFlatSpec

class SpoolConsoleLayoutSpec extends AnyFlatSpec {

  it should "split by last space or 10 chars" in {
    val values = Map(
      "abcd" -> "abcd\n",
      "ab cd ef gh" -> "ab cd ef \ngh\n",
      "ab cd efgh a" -> "ab cd efgh \na\n", //still fit in 10, trailing space does not count
      "ab cd efgh  a" -> "ab cd efgh \n a\n",
      "ab\n cd\n ef\n" -> "ab\n cd\n ef\n",
      "abcdefabcdefabcdefabcdef" -> "abcdefabcd\nefabcdefab\ncdef\n",
      "abcde\nfabcdefabcdefab\ncdef" -> "abcde\nfabcdefabc\ndefab\ncdef\n",
      "" -> "\n"
    )

    for ((input, expected) <- values) {
      val layout = mock(classOf[StringLayout])
      when(layout.toSerializable(any[LogEvent]())).thenReturn(input)
      val actual = new SpoolConsoleLayout(10, layout).toSerializable(mock(classOf[LogEvent]))
      assertResult(expected)(actual)
    }
  }

}
