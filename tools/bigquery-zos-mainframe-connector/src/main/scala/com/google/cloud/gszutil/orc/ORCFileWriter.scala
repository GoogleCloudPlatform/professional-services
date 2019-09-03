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

package com.google.cloud.gszutil.orc

import java.nio.ByteBuffer

import akka.actor.Actor
import com.google.cloud.gszutil.{PackedDecimal, Util}
import com.google.cloud.gszutil.Util.Logging
import com.google.cloud.gszutil.io.ZReader
import com.google.cloud.gszutil.orc.Protocol.{Close, PartComplete, PartFailed}
import org.apache.hadoop.conf.Configuration
import org.apache.hadoop.fs.{FileSystem, SimpleGCSFileSystem}
import org.apache.orc._
import org.apache.orc.impl.WriterImpl

/** Responsible for writing a single output partition
  */
class ORCFileWriter(args: ORCFileWriterArgs) extends Actor with Logging {
  import args._
  private final val BytesBetweenFlush: Long = 32*1024*1024
  private final val stats = new FileSystem.Statistics(SimpleGCSFileSystem.Scheme)
  private final val reader = new ZReader(copyBook, batchSize)
  private final val errBuf = ByteBuffer.allocate(copyBook.LRECL * batchSize)

  private var errorCount: Long = 0
  private var bytesIn: Long = 0
  private var bytesSinceLastFlush: Long = 0
  private var elapsedTime: Long = 0
  private var startTime: Long = -1
  private var endTime: Long = -1
  private var writer: Writer = _

  private final val orcConfig = {
    val c = new Configuration(false)
    if (compress){
      OrcConf.COMPRESS.setString(c, "ZLIB")
      OrcConf.COMPRESSION_STRATEGY.setString(c, "SPEED")
    } else {
      OrcConf.COMPRESS.setString(c, "NONE")
    }
    OrcConf.ENABLE_INDEXES.setBoolean(c, false)
    OrcConf.OVERWRITE_OUTPUT_FILE.setBoolean(c, true)
    OrcConf.MEMORY_POOL.setDouble(c, 0.5d)
    OrcConf.BUFFER_SIZE.setLong(c, args.compressBuffer)
    OrcConf.DIRECT_ENCODING_COLUMNS.setString(c, copyBook.FieldNames.mkString(","))
    c
  }

  override def preStart(): Unit = {
    val writerOptions = OrcFile
      .writerOptions(orcConfig)
      .setSchema(copyBook.ORCSchema)
      .memory(NoOpMemoryManager)
      .compress(if (compress) CompressionKind.ZLIB else CompressionKind.NONE)
      .bufferSize(compressBuffer)
      .enforceBufferSize()
      .fileSystem(new SimpleGCSFileSystem(gcs, stats))
    writer = OrcFile.createWriter(path, writerOptions)
    context.parent ! pool.acquire()
    startTime = System.currentTimeMillis()
    logger.info(s"Starting writer for ${args.path}\n${Util.logMem()}")
  }

  override def receive: Receive = {
    case x: ByteBuffer =>
      bytesIn += x.limit
      bytesSinceLastFlush += x.limit
      val t0 = System.currentTimeMillis
      errorCount += reader.readOrc(x, writer, errBuf)
      if (errBuf.position > 0){
        errBuf.flip()
        val a = new Array[Byte](copyBook.LRECL)
        errBuf.get(a)
        System.err.println(s"Failed to read row:\n${PackedDecimal.hexValue(a)}")
      }
      if (x.remaining > 0) {
        logger.warn(s"discarding ${x.remaining} bytes remaining in buffer")
      }
      if (bytesSinceLastFlush > BytesBetweenFlush) {
        writer match {
          case w: WriterImpl =>
            w.checkMemory(1.0d)
            bytesSinceLastFlush = 0
          case _ =>
        }
      }
      val t1 = System.currentTimeMillis
      elapsedTime += (t1 - t0)
      val partBytesRemaining = maxBytes - stats.getBytesWritten
      if (partBytesRemaining > 0) {
        sender ! x
      } else {
        pool.release(x)
        context.parent ! PartComplete(path.toString, stats.getBytesWritten)
        context.stop(self)
      }

    case Close =>
      context.parent ! PartComplete(path.toString, stats.getBytesWritten)
      context.stop(self)

    case _ =>
  }

  override def postStop(): Unit = {
    val t0 = System.currentTimeMillis
    writer.close()
    val t1 = System.currentTimeMillis
    elapsedTime += (t1 - t0)
    endTime = System.currentTimeMillis
    val dt = endTime - startTime
    val idle = dt - elapsedTime
    val bytesOut = stats.getBytesWritten
    val ratio = (bytesOut * 1.0d) / bytesIn
    val mbps = Util.fmbps(bytesOut, elapsedTime)
    logger.info(s"Stopping writer for ${args.path} after writing $bytesOut bytes in $elapsedTime ms ($mbps mbps) $dt ms total $idle ms idle $bytesIn bytes read ${f"$ratio%1.2f"} compression ratio ${Util.logMem()}")
    val recordsIn = bytesIn / copyBook.LRECL
    val errorPct = errorCount*1.0d / recordsIn
    if (errorPct > maxErrorPct) {
      val msg = s"error percent $errorPct exceeds threshold of $maxErrorPct"
      logger.error(msg)
      context.parent ! PartFailed(msg)
    }
  }
}
