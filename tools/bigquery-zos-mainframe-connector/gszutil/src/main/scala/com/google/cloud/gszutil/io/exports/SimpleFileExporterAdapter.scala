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

import com.google.cloud.bigquery.{FieldList, FieldValueList}
import com.google.cloud.bqsh.ExportConfig
import com.google.cloud.bqsh.cmd.Result
import com.google.cloud.gszutil.BinaryEncoder

/**
  * Wrapper for FileExporter
  *
  * @todo remove it after FileExporter API refactoring.
  */
class SimpleFileExporterAdapter(fe: FileExporter, cfg: ExportConfig) extends SimpleFileExporter {
  def validateData(schema: FieldList, encoders: Array[BinaryEncoder]): Unit = {
    if (!cfg.vartext) {
      fe.validateExport(schema, encoders) //TODO: currently validation is performed for each file, we actually need to run it only once
    }
  }

  def exportData(rows: java.lang.Iterable[FieldValueList], schema: FieldList, encoders: Array[BinaryEncoder]): Result = {
    if (cfg.vartext) {
      //zero is passed as rowCount, it is used only for logging so it is safe to ignore it
      fe.exportPipeDelimitedRows(rows, 0)
    } else {
      fe.exportBQSelectResult(rows, schema, encoders)
    }
  }

  def getCurrentExporter: FileExport = {
    fe.currentExport
  }

  def endIfOpen(): Unit = fe.endIfOpen()

  override def toString: String = fe.toString
}
