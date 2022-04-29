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

package com.google.cloud.imf.grecv.client

import java.io.OutputStream
import java.nio.ByteBuffer
import java.nio.channels.Channels
import java.util.concurrent.TimeUnit
import java.util.zip.GZIPOutputStream
import com.google.cloud.imf.grecv.GRecvProtocol
import com.google.cloud.imf.gzos.pb.GRecvGrpc
import com.google.cloud.imf.gzos.pb.GRecvProto.GRecvRequest
import com.google.cloud.imf.util.Logging
import com.google.cloud.storage.Storage.BlobWriteOption
import com.google.cloud.storage.{BlobInfo, Storage}
import com.google.common.hash.{Hasher, Hashing}
import com.google.common.io.CountingOutputStream
import io.grpc.ManagedChannelBuilder
import io.grpc.okhttp.OkHttpChannelBuilder

import scala.util.Random

case class TmpObj(bucket: String,
             tmpPath: String,
             gcs: Storage,
             cb: ManagedChannelBuilder[_],
             request: GRecvRequest,
             limit: Long,
             compress: Boolean) extends Logging {
  // GCS Object name without bucket name
  private val name = s"${tmpPath}${request.getJobinfo.getJobid}_" +
    s"${System.currentTimeMillis()}_" +
    s"${Random.alphanumeric.take(8).mkString("")}.tmp"

  // Full GCS Object URI
  private val srcUri = s"gs://$bucket/$name"
  logger.debug(s"Opening $srcUri for writing")

  private val hasher: Hasher = Hashing.murmur3_128().newHasher()

  // Use a CountingOutputStream to count compressed bytes
  private val os: CountingOutputStream = new CountingOutputStream(
    Channels.newOutputStream(gcs.writer(
      BlobInfo.newBuilder(bucket,name).build(),
      BlobWriteOption.doesNotExist())))

  private val writer: OutputStream =
    if (compress) new GZIPOutputStream(os, 32*1024, true)
    else os
  private var closed: Boolean = false

  def isClosed: Boolean = closed

  def write(buf: ByteBuffer): Unit = {
    val n = buf.limit()
    val a = buf.array()
    hasher.putBytes(a, 0, n)
    writer.write(a, 0, n)
    buf.position(n)
    if (os.getCount > limit){
      logger.debug(s"part limit $limit reached ${os.getCount}")
      close()
    }
  }

  def close(): Unit = {
    closed = true
    logger.info(s"closing $srcUri")
    writer.close()
    val n = os.getCount
    if (n > 0){
      logger.info(s"Finished writing $n bytes to $srcUri")
      val hash = hasher.hash().toString
      logger.debug(s"Requesting write to ORC for $srcUri")
      val ch = cb.build()
      try {
        val stub = GRecvGrpc.newBlockingStub(ch)
          .withCompression("gzip")
          .withDeadlineAfter(3000, TimeUnit.SECONDS)
        // send the request to the gRPC server, causing it to transcode to ORC
        val res = stub.write(request.toBuilder.setSrcUri(srcUri).build())
        logger.info(s"Request complete. uri=$srcUri rowCount=${res.getRowCount} " +
          s"errors=${res.getErrCount}")
        require(res.getHash == hash, "hash mismatch")
        require(res.getStatus == GRecvProtocol.OK, "non-success status code")
      } finally {
        ch.shutdownNow()
      }
    } else {
      logger.info(s"Requesting write empty ORC file at $srcUri")
      val ch = cb.build()
      try {
        val stub = GRecvGrpc.newBlockingStub(ch)
          .withDeadlineAfter(3000, TimeUnit.SECONDS)
        // send the request to the gRPC server, causing it to write an empty file
        val res = stub.write(request.toBuilder.setNoData(true).build())
        logger.info(s"Request complete. uri=$srcUri rowCount=${res.getRowCount} " +
          s"errors=${res.getErrCount}")
        require(res.getStatus == GRecvProtocol.OK, "non-success status code")
      } finally {
        ch.shutdownNow()
      }
    }
  }
}
