/*
 * Copyright 2022 Google LLC All Rights Reserved.
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


import com.google.cloud.bigquery.storage.v1.AvroRows
import com.google.cloud.gszutil.Transcoder
import com.google.cloud.gszutil.io.exports.FileExport
import com.google.cloud.imf.util.Logging
import org.apache.avro.Schema
import org.apache.avro.generic.{GenericDatumReader, GenericRecord}
import org.apache.avro.io.{BinaryDecoder, DecoderFactory}

import java.nio.{ByteBuffer, CharBuffer}
import scala.jdk.CollectionConverters.ListHasAsScala

class BQExporter(schema: Schema, id: Int, writer: FileExport, transcoder: Transcoder)
  extends Logging with Exporter {
  private val fields: IndexedSeq[AvroField] =
    schema.getFields.asScala.toArray.toIndexedSeq.map(AvroField)
  private val reader: GenericDatumReader[GenericRecord] =
    new GenericDatumReader[GenericRecord](schema)
  private var decoder: BinaryDecoder = _
  private var row: GenericRecord = _

  // rows written across partitions
  private var rowCount: Long = 0
  private var logFrequency: Long = 1000000
  private var nextLog: Long = logFrequency

  private val cb = CharBuffer.allocate(writer.lRecl)
  private val buf = ByteBuffer.allocate(writer.lRecl)
  private val enc = transcoder.charset.newEncoder()


  override def rowsWritten: Long = writer.rowsWritten()

  def close(): Unit = {
    writer.close()
    logger.info(s"Stream $id closed after writing $rowCount rows")
  }

  /** Write rows to RecordWriter
    * A ReadStream returns many batches and each call to this method processes one batch
    *
    * @param rows AvroRows
    * @return count of rows processed
    */
  def processRows(rows: AvroRows): Long = {
    decoder = DecoderFactory.get.binaryDecoder(rows.getSerializedBinaryRows.toByteArray, decoder)
    if (rowCount >= nextLog) {
      logger.info(s"Wrote $rowCount records from stream $id")
      if (rowCount > logFrequency * 100) {
        logFrequency *= 10
        logger.info(s"decreased log frequency to $logFrequency")
      }
      nextLog += logFrequency
    }

    // rows written to current batch
    var batchRowCount: Long = 0
    while (!decoder.isEnd) {
      row = reader.read(row, decoder)
      cb.clear()
      var i = 0
      while (i < fields.length){
        if (i > 0)
          cb.put('|')
        val field = fields(i)
        field.read(row, cb)
        i += 1
      }
      buf.clear()
      cb.flip()
      enc.encode(cb, buf, true)
      while (buf.hasRemaining)
        buf.put(transcoder.SP)

      buf.flip()
      writer.appendBytes(buf.array())
      rowCount += 1
      batchRowCount += 1
    }
    batchRowCount
  }
}
