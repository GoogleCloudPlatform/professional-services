package com.google.cloud.imf.grecv.server

import com.google.api.services.storage.{Storage => LowLevelStorageApi}
import com.google.cloud.bigquery.BigQuery
import com.google.cloud.bigquery.storage.v1.BigQueryReadClient
import com.google.cloud.bqsh.ExportConfig
import com.google.cloud.imf.gzos.pb.GRecvGrpc.GRecvImplBase
import com.google.cloud.imf.gzos.pb.GRecvProto
import com.google.cloud.imf.gzos.pb.GRecvProto.{GRecvRequest, GRecvResponse, HealthCheckRequest, HealthCheckResponse}
import com.google.cloud.imf.util.Logging
import com.google.cloud.storage.Storage
import com.google.protobuf.ByteString
import com.google.protobuf.util.JsonFormat
import io.grpc.stub.StreamObserver
import org.apache.logging.log4j.ThreadContext

import java.time.ZoneId
import java.time.format.DateTimeFormatter
import scala.util.Random

class GRecvService(storageFunc: ByteString => Storage,
                   bqStorageFunc: ByteString => BigQueryReadClient,
                   storageApiFunc: ByteString => LowLevelStorageApi,
                   bqFunc: (String, String, ByteString) => BigQuery) extends GRecvImplBase with Logging {
  private val fmt = DateTimeFormatter.ofPattern("yyyyMMddhhMMss")
  private val rng = new Random()

  val LogTag = "job.tag"

  override def write(request: GRecvRequest, responseObserver: StreamObserver[GRecvResponse]): Unit = {
    val partId = fmt.format(java.time.LocalDateTime.now(ZoneId.of("UTC"))) + "-" +
      rng.alphanumeric.take(6).mkString("")
    val keyfile = request.getKeyfile
    //for security purpose we don't want to log keyfile
    val requestJson = JsonFormat.printer()
      .omittingInsignificantWhitespace()
      .print(request.toBuilder.setKeyfile(ByteString.copyFromUtf8("")).build())
    ThreadContext.put(LogTag, s"ImportJob[${request.getJobinfo.getJobname}:${request.getJobinfo.getJobid}:${request.getJobinfo.getStepName}]")
    logger.debug(s"Received GRecvRequest\n```\n$requestJson\n```")
    try {
      val gcs = storageFunc(keyfile)
      val lowLevelStorageApi = storageApiFunc(keyfile)
      GRecvServerListener.write(request, gcs, lowLevelStorageApi, partId, responseObserver, request.getCompress)
    } catch {
      case t: Throwable =>
        logger.error(t.getMessage, t)
        val t1 = io.grpc.Status.INTERNAL
          .withDescription(t.getMessage)
          .withCause(t)
          .asRuntimeException()
        responseObserver.onError(t1)
    } finally {
      ThreadContext.clearAll()
    }
  }

  override def `export`(request: GRecvProto.GRecvExportRequest, responseObserver: StreamObserver[GRecvResponse]): Unit = {
    import scala.jdk.CollectionConverters._
    val cfg = ExportConfig.apply(request.getExportConfigsMap.asScala.toMap)
    ThreadContext.put(LogTag, s"ExportJob[${request.getJobinfo.getJobname}:${request.getJobinfo.getJobid}:${request.getJobinfo.getStepName}]")
    logger.debug(
      s"""
         |Received export request with:
         |-sql=${request.getSql}
         |-copybook=${request.getCopybook}
         |-outputUri=${request.getOutputUri}
         |-configs=$cfg
         |""".stripMargin)
    try {
      val gcs = storageFunc(request.getKeyfile)
      val bq: BigQuery = bqFunc(cfg.projectId, cfg.location, request.getKeyfile)
      val storageApi: BigQueryReadClient = bqStorageFunc(request.getKeyfile)
      try {
        GRecvServerListener.`export`(request, bq, storageApi, gcs, cfg, responseObserver)
      } finally {
        storageApi.close()
      }

    } catch {
      case t: Throwable =>
        logger.error(t.getMessage, t)
        val t1 = io.grpc.Status.INTERNAL
          .withDescription(t.getMessage)
          .withCause(t)
          .asRuntimeException()
        responseObserver.onError(t1)
    } finally {
      ThreadContext.clearAll()
    }
  }

  private val OK: HealthCheckResponse =
    HealthCheckResponse.newBuilder
      .setStatus(HealthCheckResponse.ServingStatus.SERVING)
      .build

  override def check(req: HealthCheckRequest,
                     res: StreamObserver[HealthCheckResponse]): Unit = {
    res.onNext(OK)
    res.onCompleted()
  }
}
