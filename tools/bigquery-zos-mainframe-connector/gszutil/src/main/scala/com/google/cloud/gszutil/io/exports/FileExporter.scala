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
import com.google.cloud.bqsh.cmd.Result
import com.google.cloud.gszutil.BinaryEncoder

trait FileExporter {
  def isOpen: Boolean

  def currentExport: FileExport

  def newExport(e: FileExport): Unit

  def endIfOpen(): Unit
  /** Use when TD types are known for all of the projections */
  def exportBQSelectResult(rows: java.lang.Iterable[FieldValueList],
                           bqSchema: FieldList,
                           mvsEncoders: Array[BinaryEncoder]): Result

  /** Exports data into pipe delimited string file */
  def exportPipeDelimitedRows(rows: java.lang.Iterable[FieldValueList], rowCount: Long): Result

  def validateExport(bqSchema: FieldList,
                     mvsEncoders: Array[BinaryEncoder]): Unit
}