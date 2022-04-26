package com.google.cloud.gszutil.io.exports

import com.google.cloud.bigquery.{FieldList, FieldValueList}
import com.google.cloud.bqsh.cmd.Result
import com.google.cloud.gszutil.BinaryEncoder

/**
  * Simplified version of {@link com.google.cloud.gszutil.io.exports.FileExporter}.
  * It is better to refactor {@link com.google.cloud.gszutil.io.exports.FileExporter} to have interface like this one.
  * For now this one will be used with adapter from {@link com.google.cloud.gszutil.io.exports.FileExporter}.
  */
trait SimpleFileExporter {

  def validateData(schema: FieldList, encoders: Array[BinaryEncoder]): Unit

  def exportData(rows: java.lang.Iterable[FieldValueList], schema: FieldList, encoders: Array[BinaryEncoder]): Result

  def endIfOpen(): Unit

  def getCurrentExporter: FileExport
}
