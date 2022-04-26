package com.google.cloud.gszutil.io.exports

import com.google.cloud.bigquery._
import com.google.cloud.bqsh.cmd.Result
import com.google.cloud.gszutil.BinaryEncoder
import com.google.cloud.gszutil.Encoding.StringToBinaryEncoder
import com.google.cloud.imf.gzos.Ebcdic
import com.google.cloud.imf.util.Logging

import java.nio.ByteBuffer
import scala.collection.mutable.ListBuffer
import scala.util.{Failure, Success, Try}

class LocalFileExporter extends FileExporter with Logging {
  protected var export: FileExport = _

  override def isOpen: Boolean = export != null

  override def currentExport: FileExport = export

  override def newExport(e: FileExport): Unit = export = e

  override def endIfOpen(): Unit = if (isOpen) export.close()

  override def toString: String = `export`.toString

  override def exportBQSelectResult(rows: java.lang.Iterable[FieldValueList],
                                    bqSchema: FieldList,
                                    mvsEncoders: Array[BinaryEncoder]): Result = {

    val nCols = bqSchema.size()
    val bqFields = (0 until nCols).map { i => bqSchema.get(i) }
    var rowsCounter = 0

    val buf = ByteBuffer.allocate(export.lRecl)
    rows.forEach { row =>
      buf.clear()
      MVSBinaryRowEncoder.toBinary(row, mvsEncoders, buf) match {
        case result if result.exitCode == 0 =>
          rowsCounter += 1
          export.appendBytes(buf.array())
        case err =>
          // Print helpful error message containing schema, row, encoder
          val sb = new StringBuilder
          sb.append("Export failed to encode row:\n")
          sb.append("Field Name\tBQ Type\tEncoder\tValue\n")
          (0 until math.max(bqFields.length, row.size())).foreach { i =>
            val field = bqFields.lift(i)
            val name = field.map(_.getName).getOrElse("None")
            val bqType = field.map(_.getType.getStandardType.toString).getOrElse("None")
            val encoder = mvsEncoders.lift(i).map(_.toString).getOrElse("None")
            val value = scala.Option(row.get(i).getValue).getOrElse("null")
            sb.append(s"$name\t$bqType\t$encoder\t$value\n")
          }
          val msg = sb.result()
          logger.error(msg)
          logger.error(s"\n${err.message}")
          return err
      }
    }
    Result.Success.copy(activityCount = rowsCounter)
  }

  override def validateExport(bqSchema: FieldList, mvsEncoders: Array[BinaryEncoder]): Unit = {

    val queryLRECL = mvsEncoders.map(_.size).sum
    logger.info(
      s"""BINARY EXPORT
         |OUTPUT FILE LRECL = ${export.lRecl}
         |OUTPUT FILE RECFM = ${export.recfm}
         |QUERY SCHEMA LRECL = $queryLRECL
         |""".stripMargin)

    if (export.recfm != "FB")
      throw new UnsupportedOperationException(s"Unsupported file RECFM: ${export.recfm}")

    if (queryLRECL > export.lRecl)
      throw new RuntimeException(s"Output file LRECL is shorter than in provided schema. " +
        s"Output file LRECL = ${export.lRecl}, schema LRECL = $queryLRECL.")

    if (!isOpen) {
      // export is closed, just not export
      return Result.Success
    }

    val nCols = bqSchema.size()
    val nEnc = mvsEncoders.length
    val bqFields = (0 until nCols).map{i => bqSchema.get(i)}

    val tbl = (0 until math.max(nCols, nEnc)).map{i =>
      val f = bqFields.lift(i).map{x =>
        s"${x.getName}\t${x.getType.getStandardType}"
      }.getOrElse("\t")
      val e = mvsEncoders.lift(i).map{x =>s"${x.bqSupportedType}\t$x"}.getOrElse("\t")
      s"$i\t$f\t$e"
    }.mkString("\n")
    logger.info(s"LocalFileExporter Starting BigQuery Export:\n" +
      s"Field Name\tBQ Type\tEnc Type\tEncoder\n$tbl")

    val bqTypes: Array[StandardSQLTypeName] =
      (0 until nCols).map(i => bqSchema.get(i).getType.getStandardType).toArray
    val encTypes: Array[StandardSQLTypeName] =
      mvsEncoders.map(_.bqSupportedType)

    // validate field count
    if (nCols != nEnc) {
      val msg = s"InterpreterContext ERROR Export schema mismatch:\nBigQuery field count $nCols " +
        s"!= $nEnc encoders"
      logger.error(msg)
      throw new RuntimeException(s"Export validation failure: $msg")
    }

    // validate field types
    // fail if target type is not string and source type does not match target type
    (0 until nCols)
      .filter{i => encTypes(i) != StandardSQLTypeName.STRING && bqTypes(i) != encTypes(i)} match {
      case x if x.nonEmpty =>
        val fields =
          x.map(i => s"$i\t${bqFields(i).getName}\t${bqTypes(i)}\t${encTypes(i)}").mkString("\n")
        val msg = s"LocalFileExporter ERROR Export field type mismatch:\n$fields"
        logger.error(msg)
        throw new RuntimeException(s"Export validation failure:  $msg")
      case _ =>
    }
  }

  override def exportPipeDelimitedRows(rows: java.lang.Iterable[FieldValueList], rowsCount: Long): Result = {
    logger.info("Exporting row(s) as pipe-delimited string(s)...")
    def run(): Int = {
      var processedRows = 0
      val halfOfMili = 500 * 1000
      rows.forEach{
        row =>
          val lineBuf = ListBuffer.empty[String]
          (0 until row.size()).foreach{
            i => lineBuf.append(java.util.Objects.toString(row.get(i).getValue,""))
          }
          val line = lineBuf.toSeq.mkString("|")
          val lineToExport = if (line.length < export.lRecl) {
            val rpad = export.lRecl - line.length
            line + (" " * rpad)
          } else line

          val bytes = StringToBinaryEncoder(Ebcdic, export.lRecl)
            .encode(lineToExport.substring(0, export.lRecl-1))

          export.appendBytes(bytes)
          processedRows += 1

          if (rowsCount > halfOfMili  && processedRows % halfOfMili == 0) {
            logger.info(s"$processedRows Rows exported...")
          }
      }
      processedRows
    }

    Try(run()) match {
      case Success(r) => Result(activityCount = r)
      case Failure(t) => throw t
    }
  }
}
