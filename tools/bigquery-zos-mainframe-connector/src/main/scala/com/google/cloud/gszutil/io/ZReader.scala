/*
 * Copyright 2019 Google LLC All Rights Reserved.
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

import com.google.cloud.gszutil.CopyBook
import com.google.cloud.gszutil.Decoding.Decoder
import com.google.cloud.gszutil.Util.Logging
import org.apache.hadoop.hive.ql.exec.vector.{ColumnVector, VectorizedRowBatch}
import org.apache.orc.Writer

/** Uses a Copy Book to convert MVS data set records into an ORC row batch
  *
  * @param copyBook
  * @param batchSize
  */
class ZReader(private val copyBook: CopyBook, private val batchSize: Int) extends Logging {
  private final val decoders: Array[Decoder] = copyBook.decoders
  private final val rowBatch: VectorizedRowBatch = {
    val batch = new VectorizedRowBatch(copyBook.decoders.length, batchSize)
    for (i <- decoders.indices) {
      batch.cols(i) = decoders(i).columnVector(batchSize)
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
  def readOrc(buf: ByteBuffer, writer: Writer, err: ByteBuffer): Long = {
    var errors: Long = 0
    while (buf.remaining >= copyBook.LRECL) {
      errors += ZReader.readBatch(decoders, buf, rowBatch, batchSize, copyBook.LRECL, err)
      writer.addRowBatch(rowBatch)
    }
    errors
  }
}

object ZReader {
  /**
    *
    * @param decoder Decoder instance
    * @param buf ByteBuffer with position at column to be decoded
    * @param col ColumnVector to receive decoded value
    * @param rowId index within ColumnVector to store decoded value
    */
  private final def readColumn(decoder: Decoder, buf: ByteBuffer, col: ColumnVector, rowId: Int): Unit = {
    decoder.get(buf, col, rowId)
  }

  /** Read
    *
    * @param buf byte array with multiple records
    * @param rowId index within the batch
    */
  private final def readRecord(decoders: Array[Decoder], buf: ByteBuffer, rowBatch: VectorizedRowBatch, rowId: Int): Unit = {
    var i = 0
    while (i < decoders.length){
      readColumn(decoders(i), buf, rowBatch.cols(i), rowId)
      i += 1
    }
  }

  /**
    *
    * @param decoders Decoder instances
    * @param buf ByteBuffer containing data
    * @param rowBatch VectorizedRowBatch
    * @param batchSize rows per batch
    * @param lRecl size of each row in bytes
    * @param err ByteBuffer to receive failed rows
    * @return number of errors encountered
    */
  private final def readBatch(decoders: Array[Decoder], buf: ByteBuffer, rowBatch: VectorizedRowBatch, batchSize: Int, lRecl: Int, err: ByteBuffer): Int = {
    rowBatch.reset()
    err.clear()
    var errors: Int = 0
    var rowId = 0
    var rowStart = 0
    val errRecord = new Array[Byte](lRecl)
    while (rowId < batchSize && buf.remaining >= lRecl){
      rowStart = buf.position()
      try {
        readRecord(decoders, buf, rowBatch, rowId)
        rowId += 1
      } catch {
        case _: IllegalArgumentException =>
          errors += 1
          buf.position(rowStart)
          buf.get(errRecord)
          err.put(errRecord)
      }
    }
    rowBatch.size = rowId
    if (rowBatch.size == 0)
      rowBatch.endOfFile = true
    errors
  }
}
