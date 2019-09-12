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

import java.net.URI
import java.nio.channels.ReadableByteChannel
import java.util.concurrent.TimeoutException

import akka.actor.{ActorRef, ActorSystem, Inbox, PoisonPill, Props, Terminated}
import com.google.cloud.bqsh.cmd.Result
import com.google.cloud.gszutil.CopyBook
import com.google.cloud.gszutil.Util.Logging
import com.google.cloud.gszutil.orc.Protocol.{PartFailed, UploadComplete}
import com.google.cloud.storage.Storage
import com.google.common.collect.ImmutableMap
import com.typesafe.config.ConfigFactory

import scala.concurrent.{Await, ExecutionContext}
import scala.concurrent.duration.{FiniteDuration, MINUTES}
import scala.util.{Failure, Success}

object WriteORCFile extends Logging {

  def cleanup(sys: ActorSystem): Unit = {
    logger.info("Cleaning up ActorSystem")
    sys.terminate()
    try {
      Await.result(sys.whenTerminated, atMost = FiniteDuration(1, MINUTES))
    } catch {
      case e: InterruptedException =>
        logger.warn("Interrupted waiting for ActorSystem cleanup")
      case e: TimeoutException =>
        logger.warn("Timed out waiting for ActorSystem cleanup")
    }
  }

  def run(gcsUri: String,
          in: ReadableByteChannel,
          copyBook: CopyBook,
          gcs: Storage,
          maxWriters: Int,
          batchSize: Int,
          partSizeMb: Long,
          timeoutMinutes: Int,
          compress: Boolean,
          compressBuffer: Int,
          maxErrorPct: Double): Result = {
    import scala.concurrent.duration._
    val conf = ConfigFactory.parseMap(ImmutableMap.of(
      "akka.actor.guardian-supervisor-strategy","akka.actor.EscalatingSupervisorStrategy"))
    val sys = ActorSystem("gsz", conf)
    val bufSize = copyBook.LRECL * batchSize
    //val pool = ByteBufferPool.allocate(bufSize, maxWriters)
    val inbox = Inbox.create(sys)

    val pool = new NoOpHeapBufferPool(bufSize, maxWriters)
    val args: DatasetReaderArgs = DatasetReaderArgs(
      in = in,
      batchSize = batchSize,
      uri = new URI(gcsUri),
      maxBytes = partSizeMb*1024*1024,
      nWorkers = maxWriters,
      copyBook = copyBook,
      gcs = gcs,
      compress = compress,
      compressBuffer = compressBuffer,
      pool = pool,
      maxErrorPct = maxErrorPct,
      notifyActor = inbox.getRef())
    val reader = sys.actorOf(Props(classOf[DatasetReader], args), "DatasetReader")
    inbox.watch(reader)

    sys.whenTerminated.onComplete{
        case Success(_) =>
          logger.info(s"Actor System terminated with Success")
        case Failure(e) =>
          logger.info(s"ActorSystem terminated with Failure\n${e.getMessage}\n${e.getCause}")
    }(ExecutionContext.global)

    try {
      inbox.receive(FiniteDuration(timeoutMinutes, MINUTES)) match {
        case UploadComplete(read, written) =>
          logger.info(s"Upload complete:\n$read bytes read\n$written bytes written")
          Result.Success
        case PartFailed(msg) =>
          logger.error(s"Upload failed: $msg")
          Result.Failure(msg, 2)
        case x: Terminated =>
          val msg = s"${x.actor} terminated"
          logger.error(msg)
          Result.Failure(msg, 3)
        case msg =>
          val errMsg = s"Unrecognized message type ${msg.getClass.getSimpleName}: $msg"
          logger.error(errMsg)
          Result.Failure(errMsg)
      }
    } catch {
      case _: TimeoutException =>
        logger.error(s"Timed out after $timeoutMinutes minutes waiting for upload to complete")
        Result.Failure(s"Upload timed out after $timeoutMinutes minutes")
    } finally {
      sys.stop(reader)
      sys.stop(inbox.getRef)
      cleanup(sys)
    }
  }
}
