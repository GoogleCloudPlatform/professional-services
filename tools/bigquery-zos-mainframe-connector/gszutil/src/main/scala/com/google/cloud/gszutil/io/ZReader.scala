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

package com.google.cloud.gszutil.io

import java.nio.ByteBuffer
import java.nio.charset.Charset

import com.google.cloud.gszutil.{Decoder, SchemaProvider, VartextDecoder}
import com.google.cloud.imf.util.Logging
import org.apache.hadoop.hive.ql.exec.vector.{ColumnVector, VectorizedRowBatch}
import org.apache.orc.Writer

/** Decodes MVS data set records into ORC row batch
  * @param schemaProvider SchemaProvider provides field decoders
  * @param batchSize size of ORC VectorizedRowBatch
  */
class ZReader(private val schemaProvider: SchemaProvider,
              private val batchSize: Int,
              private val lrecl: Int) extends Logging {
  private final val rBuf: ByteBuffer = ByteBuffer.allocate(lrecl)
  private final val decoders: Array[Decoder] = schemaProvider.decoders

  // we keep all columns including fillers to simplify decoding
  // fillers columns are there to accept data but are not added to the row batch
  private final val cols: Array[ColumnVector] = decoders.map(_.columnVector(batchSize))

  // only non-filler columns are added to the row batch
  // by excluding filler columns here, they will not be written
  private final val rowBatch: VectorizedRowBatch = {
    val batch = new VectorizedRowBatch(decoders.count(!_.filler), batchSize)
    var j = 0
    for (i <- decoders.indices) {
      if (!decoders(i).filler) {
        batch.cols(j) = cols(i)
        j += 1
      }
    }
    batch
  }

  /** Reads COBOL and writes ORC
    *
    * @param buf ByteBuffer containing data
    * @param writer ORC Writer
    * @param err ByteBuffer to receive rows with decoding errors
    * @return number of errors
    */
  def readOrc(buf: ByteBuffer, writer: Writer, err: ByteBuffer): (Long,Long) = {
    var errors: Long = 0
    var rows: Long = 0
    while (buf.remaining >= lrecl) {
      rowBatch.reset()
      val (rowId,errCt) =
        if (schemaProvider.vartext)
          ZReader.readVartextBatch(buf, schemaProvider.vartextDecoders, cols,
            schemaProvider.delimiter, schemaProvider.srcCharset, batchSize, lrecl, err)
        else
          ZReader.readBatch(buf,decoders,cols,batchSize,lrecl,rBuf,err)
      if (rowId == 0)
        rowBatch.endOfFile = true
      rowBatch.size = rowId
      rows += rowId
      errors += errCt
      writer.addRowBatch(rowBatch)
    }
    (rows,errors)
  }
}

object ZReader extends Logging {
  /** Read
    * @param rBuf input ByteBuffer with position set to start of record
    * @param decoders Array[Decoder] to read from input
    * @param cols Array[ColumnVector] to receive Decoder output
    * @param rowId index within the batch
    * @return 0 if successful, -1 if failed
    */
  private def readRecord(rBuf: ByteBuffer,
                         decoders: Array[Decoder],
                         cols: Array[ColumnVector],
                         rowId: Int,
                         errors: Int): Int = {
    var i = 0
    try {
      while (i < decoders.length){
          decoders(i).get(rBuf, cols(i), rowId)  // where actual reading happens ...
        i += 1
      }
      0
    } catch {
      case t: Throwable =>
        val cls = decoders.lift(i).map(_.getClass.getSimpleName.stripSuffix("$")).getOrElse("?")
        if (errors < 3)
          logger.error(s"Error reading column $i $cls", t)
        1
    }
  }

  /**
    *
    * @param buf ByteBuffer containing data
    * @param decoders Decoder instances
    * @param cols VectorizedRowBatch
    * @param batchSize rows per batch
    * @param lRecl size of each row in bytes
    * @param err ByteBuffer to receive failed rows
    * @return rowId, number of errors encountered
    */
  final def readBatch(buf: ByteBuffer,
                      decoders: Array[Decoder],
                      cols: Array[ColumnVector],
                      batchSize: Int,
                      lRecl: Int,
                      rBuf: ByteBuffer, // what is this ?
                      err: ByteBuffer): (Int,Int) = {
    rBuf.clear
    err.clear
    var errors: Int = 0
    var rowId = 0
    while (rowId < batchSize && buf.remaining >= rBuf.capacity()) {
      System.arraycopy(buf.array, buf.position(), rBuf.array, 0, rBuf.capacity()) // put a record into a rBuf
      val newPos = buf.position() + lRecl
      buf.position(newPos)
      rBuf.clear // prepare record for reading
      if (readRecord(rBuf, decoders, cols, rowId, errors) != 0) {
        errors += 1
        if (err.remaining() >= lRecl)
          err.put(rBuf.array)
      }
      rowId += 1
    }
    (rowId, errors)
  }

  /** Write delimiter locations into index buffer
    *
    * @param record delimited record
    * @param delimiters Array containing indices of delimiters
    */
  def locateDelimiters(record: Array[Byte], delimiter: Array[Byte], delimiters: Array[Int]): Unit
  = {
    var k = 0 // delimiters
    delimiters.update(k, 0 - delimiter.length)
    k += 1
    while (k < delimiters.length){
      var i = 0 // record
      while (i < record.length && k < delimiters.length){
        var equal = true
        var i1 = i
        var j = 0 // delimiter
        while (equal && j < delimiter.length && i1 < record.length){
          if (record(i1) != delimiter(j))
            equal = false
          i1 += 1
          j += 1
        }

        if (equal) {
          delimiters.update(k, i) // capture position of delimiter
          k += 1 // next delimiter
        }

        i += 1
      }
      if (k < delimiters.length)
        delimiters.update(k, record.length) // delimiter at end of record
      k += 1
    }
  }

  /**
    *
    * @param buf ByteBuffer containing data
    * @param decoders Decoder instances
    * @param cols VectorizedRowBatch
    * @param batchSize rows per batch
    * @param lRecl size of each row in bytes
    * @param err ByteBuffer to receive failed rows
    * @return number of errors encountered
    */
  final def readVartextBatch(buf: ByteBuffer,
                             decoders: Array[VartextDecoder],
                             cols: Array[ColumnVector],
                             delimiter: Array[Byte],
                             srcCharset: Charset,
                             batchSize: Int,
                             lRecl: Int,
                             err: ByteBuffer): (Int,Int) = {
    err.clear
    var errors: Int = 0
    var rowId = 0
    var print = 0
    val record = new Array[Byte](lRecl)
    val delimiters = new Array[Int](cols.length+1)
    while (rowId < batchSize && buf.remaining >= lRecl){
      System.arraycopy(buf.array, buf.position(), record, 0, lRecl)
      val newPos = buf.position() + lRecl
      buf.position(newPos)
      locateDelimiters(record, delimiter, delimiters)
      try {
        readVartextRecord(record, delimiters, delimiter.length, srcCharset, decoders, cols, rowId)
      } catch {
        case e: Exception =>
          if (print < 10){
            logger.error(s"failed on row $rowId", e)
            print += 1
          }
          errors += 1
          err.put(record)
      }
      rowId += 1
    }
    (rowId,errors)
  }

  final def readVartextRecord(record: Array[Byte],
                              delimiters: Array[Int],
                              delimiterLen: Int,
                              srcCharset: Charset,
                              decoders: Array[VartextDecoder],
                              cols: Array[ColumnVector],
                              rowId: Int): Unit = {
    var i = 0
    try {
      while (i < decoders.length) {
        val decoder = decoders(i)
        val col = cols(i)
        val offset = delimiters(i)+delimiterLen
        val len = math.min(decoder.size, delimiters(i+1) - offset)
        val s = new String(record, offset, len, srcCharset)
        decoder.get(s, col, rowId)
        i += 1
      }
    } catch {
      case e: Exception =>
        val s = new String(record, srcCharset)
        val msg = s"ZReader.readVartextRecord failed on column $i\nmessage=${e.getMessage}\n" +
          s"Record:\n$s"
        logger.error(msg, e)
        throw e
    }
  }
}
