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
