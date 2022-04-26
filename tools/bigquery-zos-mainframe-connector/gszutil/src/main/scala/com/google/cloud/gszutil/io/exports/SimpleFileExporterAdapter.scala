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
