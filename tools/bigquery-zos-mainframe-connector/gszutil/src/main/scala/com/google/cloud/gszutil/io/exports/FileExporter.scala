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