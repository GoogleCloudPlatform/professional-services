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

package com.google.cloud.gszutil.io.exports

import com.google.api.gax.rpc.{ServerStream, ServerStreamingCallable}
import com.google.cloud.bigquery.storage.v1.{ReadRowsRequest, ReadRowsResponse}
import com.google.cloud.imf.util.Logging

import scala.annotation.tailrec
import scala.util.{Failure, Random, Success, Try}

class AvroRowsRetryableIterator(callable: ServerStreamingCallable[ReadRowsRequest, ReadRowsResponse],
                                request: ReadRowsRequest,
                                retryCount: Int = 5,
                                minRetryTimeoutSec: Int = 1,
                                maxRetryTimeoutSec: Int = 5) extends Iterator[ReadRowsResponse] with Logging {
  require(retryCount >= 0, s"retryCount='$retryCount' should be non negative number!")
  require(minRetryTimeoutSec <= maxRetryTimeoutSec && minRetryTimeoutSec > 0, s"minTimeout=$minRetryTimeoutSec, maxTimeout=$maxRetryTimeoutSec. Min or max timeout is less than 1 sec or min timeout is larger than max!")
  private var internalStream: ServerStream[ReadRowsResponse] = callable.call(request)
  private var internalIterator: java.util.Iterator[ReadRowsResponse] = internalStream.iterator()
  private var offset: Long = request.getOffset
  private var counter = retryCount - 1

  @tailrec
  override final def hasNext: Boolean = Try(internalIterator.hasNext) match {
    case Success(value) => value
    case Failure(ex) if counter < 0 => throw ex
    case Failure(ex) =>
      logger.info(s"Retrying hasNext(), offset=${request.getOffset}, retry_from_offset=$offset, exception=$ex")
      resetIteratorWithDelay()
      hasNext
  }

  @tailrec
  override final def next: ReadRowsResponse = Try(internalIterator.next()) match {
    case Success(value) => value
    case Failure(ex) if counter < 0 => throw ex
    case Failure(ex) =>
      logger.info(s"Retrying next(), offset=${request.getOffset}, retry_from_offset=$offset, exception=$ex")
      resetIteratorWithDelay()
      next
  }

  def consumed(rowsCount: Long): Unit = {
    offset += rowsCount
  }

  private def resetIteratorWithDelay(): Unit = {
    Try(Thread.sleep(Random.between(minRetryTimeoutSec, maxRetryTimeoutSec) * 1000))
    Try(internalStream.cancel()) match {
      case Failure(exception) => logger.error(s"Could not close read stream ${request.getReadStream}, error $exception")
      case _ => //do nothing
    }
    counter = counter - 1
    internalStream = callable.call(request.toBuilder.setOffset(offset).build())
    internalIterator = internalStream.iterator()
  }
}