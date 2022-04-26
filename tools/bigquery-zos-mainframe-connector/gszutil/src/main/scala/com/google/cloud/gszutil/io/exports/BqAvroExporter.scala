package com.google.cloud.gszutil.io.exports

import com.google.cloud.bigquery.{FieldList, FieldValueList}
import com.google.cloud.bigquery.storage.v1.AvroRows
import com.google.cloud.bqsh.cmd.Result
import com.google.cloud.gszutil.SchemaProvider
import com.google.cloud.imf.util.Logging
import org.apache.avro.Schema
import org.apache.avro.io.{BinaryDecoder, DecoderFactory}

import scala.jdk.CollectionConverters._

class BqAvroExporter(exporter: SimpleFileExporter,
                     avroSchema: Schema,
                     bqTableSchema: FieldList,
                     sp: SchemaProvider,
                     streamId: String) extends Logging {

  private val datumReader: AvroDatumReader = new AvroDatumReader(avroSchema, bqTableSchema)
  private var decoder: BinaryDecoder = _

  private val RowsCountLogThreshold = 500_000
  var rowsLogThreshold = 0L

  def processRows(rows: AvroRows): Long = {
    decoder = DecoderFactory.get.binaryDecoder(rows.getSerializedBinaryRows.toByteArray, decoder);
    val convertedRows = toFieldValues()

    exporter.exportData(convertedRows.asJava, bqTableSchema, sp.encoders) match {
      case Result(_, 0, written, _, _) =>
        rowsLogThreshold += written
        written
      case Result(_, _, _, msg, _) => throw new IllegalStateException(s"Stream $streamId Failed when encoding values to file: $msg")
    }
  }

  def rowsWritten: Long = exporter.getCurrentExporter.rowsWritten()

  def logIfNeeded(exportedRows: Long, totalRows: Long): Unit = {
    if(rowsLogThreshold > RowsCountLogThreshold) {
      logger.info(s"Stream [$streamId] already exported [$rowsWritten], total rows exported [$exportedRows : $totalRows].")
      rowsLogThreshold = 0
    }
  }

  def close(): Unit = exporter.endIfOpen()

  private def toFieldValues(): List[FieldValueList] = {
    var result: List[FieldValueList] = Nil
    while (!decoder.isEnd) {
      result = datumReader.read(null.asInstanceOf[FieldValueList], decoder) :: result
    }
    result
  }

  override def toString: String = exporter.toString
}
