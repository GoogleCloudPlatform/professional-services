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

import java.net.URI
import java.util.concurrent.TimeUnit
import com.google.api.services.storage.StorageScopes
import com.google.auth.oauth2.{GoogleCredentials, OAuth2Credentials}
import com.google.cloud.bqsh.{ExportConfig, GsUtilConfig}
import com.google.cloud.bqsh.cmd.Result
import com.google.cloud.gszutil.SchemaProvider
import com.google.cloud.gszutil.io.{CloudRecordReader, ZRecordReaderT}
import com.google.cloud.imf.grecv.{GRecvProtocol, Uploader}
import com.google.cloud.imf.gzos.MVS
import com.google.cloud.imf.gzos.pb.GRecvGrpc
import com.google.cloud.imf.gzos.pb.GRecvProto.{GRecvExportRequest, GRecvRequest}
import com.google.cloud.imf.util.{GzipCodec, Logging, Services}
import com.google.protobuf.ByteString
import com.google.protobuf.util.JsonFormat
import io.grpc.{Grpc, ManagedChannelBuilder, TlsChannelCredentials}
import io.grpc.okhttp.OkHttpChannelBuilder

import java.io.File
import scala.util.{Failure, Success, Try}

object GRecvClient extends Uploader with Logging {
  def write(cfg: GsUtilConfig,
            zos: MVS,
            in: ZRecordReaderT,
            schemaProvider: SchemaProvider,
            receiver: Uploader,
            compress: Boolean = true): Result = {
    logger.info(s"GRecvClient (Write) Starting Dataset Upload to ${cfg.gcsUri}")

    try {
      val req = GRecvRequest.newBuilder
        .setSchema(schemaProvider.toRecordBuilder.build)
        .setBasepath(cfg.gcsUri) // where to write output
        .setLrecl(in.lRecl)
        .setBlksz(in.blkSize)
        .setMaxErrPct(cfg.maxErrorPct)
        .setJobinfo(zos.getInfo)
        .setPrincipal(zos.getPrincipal())
        .setKeyfile(ByteString.copyFrom(zos.readKeyfile()))
        .setCompress(compress)
        .setTimestamp(System.currentTimeMillis())

      receiver.upload(req.build, cfg.remoteHost, cfg.remotePort, cfg.trustCertCollectionFilePath, cfg.nConnections, zos, in, cfg.timeOutMinutes, cfg.keepAliveTimeInSeconds)
    } catch {
      case e: Throwable =>
        logger.error("Dataset Upload Failed", e)
        Result.Failure(e.getMessage)
    }
  }

  def export(sql: String,
             copybook: String,
             outputUri: String,
             cfg: ExportConfig,
             zos: MVS): Result = {
    logger.debug(s"GRecvClient (Export) Starting exporting data to $outputUri")
    import scala.jdk.CollectionConverters._
    val request = GRecvExportRequest.newBuilder()
      .setSql(sql)
      .setCopybook(copybook)
      .setOutputUri(outputUri)
      .putAllExportConfigs(cfg.toMap.asJava)
      .setJobinfo(zos.getInfo)
      .setKeyfile(ByteString.copyFrom(zos.readKeyfile()))
      .build()

    val client =
      channelBuilder(cfg.remoteHost, cfg.remotePort, cfg.trustCertCollectionFilePath, cfg.keepAliveTimeInSeconds).build()

    try {
      val response =  GRecvGrpc.newBlockingStub(client)
        .withDeadlineAfter(cfg.timeoutMinutes.toLong, TimeUnit.MINUTES).`export`(request)

      if (response.getStatus != GRecvProtocol.OK)
        Result.Failure("Export server error!")
      else {
        logger.info(s"Export request successfully completed, rowCount=${response.getRowCount}")
        Result(activityCount = response.getRowCount, errorCount = response.getErrCount)
      }
    } catch {
      case t: Throwable =>
        Result.Failure(s"GRecv Export failure: ${t.getMessage}")
    } finally {
      client.shutdownNow()
    }
  }

  override def upload(req: GRecvRequest,
                      host: String,
                      port: Int,
                      trustCertCollectionFilePath: String,
                      nConnections: Int,
                      zos: MVS,
                      in: ZRecordReaderT,
                      timeOutMinutes: Option[Int],
                      keepAliveTimeInSeconds: Option[Int]): Result = {
    logger.debug(s"Timeouts used for upload: keepAliveTimeInSeconds=$keepAliveTimeInSeconds, timeOutMinutes=$timeOutMinutes")
    val cb = channelBuilder(host, port, trustCertCollectionFilePath, keepAliveTimeInSeconds.getOrElse(480))

    val creds: GoogleCredentials = zos.getCredentialProvider().getCredentials
      .createScoped(StorageScopes.DEVSTORAGE_READ_WRITE)
    creds.refreshIfExpired()

    Try{
      in match {
        case x: CloudRecordReader =>
          gcsSend(req, x, cb, creds, timeOutMinutes)
        case _ =>
          send(req, in, nConnections, cb, creds, timeOutMinutes)
      }
    } match {
      case Failure(e) =>
        logger.error(e.getMessage, e)
        Result.Failure(e.getMessage)
      case Success(result) => result
    }
  }

  private val PartLimit: Int = 64*1024*1024

  def send(request: GRecvRequest,
           in: ZRecordReaderT,
           connections: Int = 1,
           cb: ManagedChannelBuilder[_],
           creds: OAuth2Credentials,
           timeOutMinutes: Option[Int]): Result = {
    logger.debug(s"Sending ${in.getDsn}")

    val blksz = in.lRecl * 1024
    var bytesRead = 0L
    var streamId = 0
    val baseUri = new URI(request.getBasepath.stripSuffix("/"))

    val gcs = Services.storage(creds)
    val streams: Array[GRecvClientListener] = (0 until connections).toArray
      .map(_ => new GRecvClientListener(gcs, cb, request, baseUri, blksz, PartLimit))

    var n = 0
    while (n > -1){
      val buf = streams(streamId).buf
      buf.clear()
      while (n > -1 && buf.hasRemaining){
        n = in.read(buf)
        bytesRead += n
      }
      if (buf.position() > 0) {
        streams(streamId).flush()
        if (bytesRead >= 1024*1024) {
          streamId += 1
          if (streamId >= connections) streamId = 0
        }
      }
    }
    if (n < 0) bytesRead -= n

    streams.foreach(_.close())
    if (bytesRead < 1){
      logger.info(s"Read $bytesRead bytes from ${in.getDsn} - requesting empty file be written")
      val ch = cb.build()
      try {
        val stub = GRecvGrpc.newBlockingStub(ch).withDeadlineAfter(timeOutMinutes.getOrElse(50).toLong, TimeUnit.MINUTES)
        val res = stub.write(request.toBuilder.setNoData(true).build())
        if (res.getStatus != GRecvProtocol.OK)
          Result.Failure("non-success status code")
        else {
          val resStr = JsonFormat.printer()
            .includingDefaultValueFields()
            .omittingInsignificantWhitespace()
            .print(res)
          Result(activityCount = res.getRowCount, message = s"Request completed. DSN=${in.getDsn} " +
            s" rowCount=${res.getRowCount} errorCount=${res.getErrCount} $resStr", errorCount = res.getErrCount)
        }
      } finally {
        ch.shutdownNow()
      }
    } else {
      // Each TmpObj instance sends its own request in close() method
      val msg = s"Read $bytesRead bytes from DSN:${in.getDsn}"
      logger.info(msg)
      Result(activityCount = bytesRead / in.lRecl, message = msg)
    }
  }

  /** Request transcoding of a dataset already uploaded
    * to Cloud Storage
    *
    * @param request GRecvRequest template
    * @param in CloudRecordReader with reference to DSN
    * @param cb OkHttpChannelBuilder used to create a gRPC client
    * @param creds OAuth2Credentials used to generate OAuth2 AccessToken
   *  @param timeOutMinutes timeout in minutes for GRecvGrpc call
    * @return
    */
  def gcsSend(request: GRecvRequest,
              in: CloudRecordReader,
              cb: ManagedChannelBuilder[_],
              creds: OAuth2Credentials,
              timeOutMinutes: Option[Int]): Result = {

    def gcsSendImpl: String => Result = (uri: String) => {
      var rowCount: Long = 0
      var errCount: Long = 0
      val ch = cb.build()
      try {
        val stub = GRecvGrpc.newBlockingStub(ch)
          .withDeadlineAfter(timeOutMinutes.getOrElse(90).toLong, TimeUnit.MINUTES)
        val req = request.toBuilder.setSrcUri(uri).build()
        logger.info(
          s"""Sending GRecvRequest request
             |in:${req.getSrcUri}
             |out:${req.getBasepath}""".stripMargin)
        val res = stub.write(req)
        if (res.getRowCount > 0)
          rowCount += res.getRowCount
        if (res.getErrCount > 0)
          errCount += res.getErrCount
        if (res.getStatus != GRecvProtocol.OK)
          Result.Failure("non-success status code")
        else {
          val resStr = JsonFormat.printer()
            .includingDefaultValueFields()
            .omittingInsignificantWhitespace()
            .print(res)
          logger.info(s"Request complete. DSN=${in.dsn}, uri=$uri rowCount=${res.getRowCount} " +
            s"errorCount=${res.getErrCount} $resStr")
          Result(activityCount = rowCount, message = s"Completed with $errCount errors", errorCount = errCount)
        }
      } catch {
        case t: Throwable =>
          Result.Failure(s"GRecv failure: ${t.getMessage}")
      } finally {
        ch.shutdownNow()
      }
    }

    if(in.gdg) {
      logger.debug(s"Sending GRecvRequest request for GDG ${in.versions.size} versions")
      val results = in.versions.map {v =>
        val uri = in.gdgUri(v.getName)
        val result = gcsSendImpl(uri)
        logger.info(s"GRecvRequest for $uri completed with exit code ${result.exitCode}")
        result
      }
      results.find(r => r.exitCode != 0) match {
        case Some(failed) => failed
        case None => results.head
      }
    } else {
      gcsSendImpl(in.uri)
    }
  }

  private def channelBuilder(host: String, port: Int, trustCertCollectionFilePath: String, keepAlive: Int) =
    Grpc.newChannelBuilderForAddress(
      host, port,
      TlsChannelCredentials.newBuilder.trustManager(new File(trustCertCollectionFilePath)).build()
    ).overrideAuthority(sys.env("dns_alt_name")).asInstanceOf[ManagedChannelBuilder[_]]
}
