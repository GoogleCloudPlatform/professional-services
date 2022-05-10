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

package com.google.cloud.gszutil.io.exports

import com.google.cloud.bigquery._
import com.google.cloud.bqsh.cmd.Result
import org.scalatest.flatspec.AnyFlatSpec

import java.util

class LocalFileExporterSpec extends AnyFlatSpec {

  private class MockFileExport(recordLength: Int, consumer: Array[Byte] => Unit) extends FileExport {
    private var rowCounter: Long = 0
    override def close(): Unit = {}
    override def lRecl: Int = recordLength
    override def recfm: String = recordLength.toString
    override def rowsWritten(): Long = rowCounter
    override def appendBytes(buf: Array[Byte]): Unit = {
      rowCounter += 1
      consumer(buf)
    }
  }

  it should "Run pipe delimited export without NPE" in {
    val lRecl = 15
    val mockFileExport = new MockFileExport(lRecl, s => assert(s.length == lRecl))

    val exporter = new LocalFileExporter()
    exporter.newExport(mockFileExport)

    val schema = FieldList.of(
      Field.of("id", LegacySQLTypeName.INTEGER),
      Field.of("name", LegacySQLTypeName.STRING),
      Field.of("favorite_number", LegacySQLTypeName.NUMERIC)
    )

    val values = util.Arrays.asList(
      FieldValue.of(FieldValue.Attribute.PRIMITIVE, 123),
      FieldValue.of(FieldValue.Attribute.PRIMITIVE, "dummy"),
      FieldValue.of(FieldValue.Attribute.PRIMITIVE, null)
    )

    val rows = util.Arrays.asList(FieldValueList.of(values, schema))

    assert(mockFileExport.rowsWritten() == 0)
    assert(exporter.exportPipeDelimitedRows(rows, 1) == Result(activityCount = 1))
    assert(mockFileExport.rowsWritten() == 1)
  }
}
