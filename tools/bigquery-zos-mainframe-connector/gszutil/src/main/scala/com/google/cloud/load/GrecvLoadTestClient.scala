package com.google.cloud.load

import com.google.cloud.bqsh.ExportConfig
import com.google.cloud.bqsh.cmd.Result
import com.google.cloud.imf.grecv.GRecvProtocol
import com.google.cloud.imf.gzos.Linux
import com.google.cloud.imf.gzos.pb.GRecvGrpc
import com.google.cloud.imf.gzos.pb.GRecvProto.{GRecvExportRequest, GRecvRequest, ZOSJobInfo}
import com.google.cloud.imf.util.{GzipCodec, Logging}
import com.google.protobuf.ByteString
import io.grpc.okhttp.OkHttpChannelBuilder

import java.util.concurrent.TimeUnit

object GrecvLoadTestClient extends Logging {

  val zos = Linux

  def export(metadata: JobMetadata,
             outputUri: String,
             cfg: GRecvLoadTestConfig): Result = {
    val exportConfig = ExportConfig(
      timeoutMinutes = cfg.timeoutMinutes,
      runMode = cfg.exportRunMode,
      remoteHost = cfg.targetHost,
      remotePort = cfg.targetPort,
      keepAliveTimeInSeconds = cfg.keepAliveTimeInSeconds,
      projectId = cfg.projectId,
      location = cfg.location
    )
    import scala.jdk.CollectionConverters._
    val request = GRecvExportRequest.newBuilder()
      .setSql(metadata.sql)
      .setCopybook(metadata.cb.raw)
      .setOutputUri(outputUri)
      .putAllExportConfigs(exportConfig.toMap.asJava)
      .setJobinfo(jobInfo(metadata))
      .setKeyfile(ByteString.copyFrom(zos.readKeyfile()))
      .build()

    val client =
      httpClientBuilder(exportConfig.remoteHost, exportConfig.remotePort, exportConfig.keepAliveTimeInSeconds, cfg.useSsl).build()

    try {
      logger.info(s"${metadata.testId} Sending export request to target ${metadata.index} job=${metadata.name}.")
      val response = GRecvGrpc.newBlockingStub(client)
        .withDeadlineAfter(exportConfig.timeoutMinutes.toLong, TimeUnit.MINUTES).`export`(request)

      if (response.getStatus != GRecvProtocol.OK) {
        Result.Failure("Export server error!")
      } else {
        Result(activityCount = response.getRowCount)
      }
    } catch {
      case t: Throwable =>
        Result.Failure(s"GRecv Export failure: ${t.getMessage}")
    } finally {
      client.shutdownNow()
    }
  }

  def importRequest(metadata: JobMetadata,
                    sourceUri: String,
                    outputUri: String,
                    compress: Boolean,
                    cfg: GRecvLoadTestConfig): Result = {

    try {
      val req = GRecvRequest.newBuilder
        .setSchema(metadata.cb.toRecordBuilder.build)
        .setBasepath(outputUri)
        .setSrcUri(sourceUri)
        .setLrecl(metadata.cb.LRECL)
        .setBlksz(500) //TODO: investigate config impact
        .setJobinfo(jobInfo(metadata))
        .setPrincipal(zos.getPrincipal())
        .setKeyfile(ByteString.copyFrom(zos.readKeyfile()))
        .setTimestamp(System.currentTimeMillis())
        .setCompress(compress)
        .build()

      val client =
        httpClientBuilder(cfg.targetHost, cfg.targetPort, cfg.keepAliveTimeInSeconds, cfg.useSsl).build()

      logger.info(s"${metadata.testId} Sending import request to target ${metadata.index} job=${metadata.name}.")
      val res = GRecvGrpc.newBlockingStub(client)
        .withDeadlineAfter(cfg.timeoutMinutes, TimeUnit.MINUTES).write(req)
      if (res.getStatus != GRecvProtocol.OK)
        Result.Failure("non-success status code")
      else {
        Result(activityCount = res.getRowCount)
      }
    } catch {
      case e: Throwable =>
        logger.error("ImportFailed", e)
        Result.Failure(e.getMessage)
    }
  }

  private def httpClientBuilder(host: String, port: Int, keepAlive: Int, useSsl: Boolean) = {
    val b = OkHttpChannelBuilder.forAddress(host, port)
      .compressorRegistry(GzipCodec.compressorRegistry)
      .keepAliveTime(keepAlive.toLong, TimeUnit.SECONDS)
      .keepAliveWithoutCalls(true)
    if (!useSsl) b.usePlaintext()
    b
  }

  def jobInfo(metadata: JobMetadata): ZOSJobInfo = {
    ZOSJobInfo.newBuilder
      .setJobid(metadata.jobId)
      .setJobdate(zos.jobDate)
      .setJobtime(zos.jobTime)
      .setJobname(metadata.name)
      .setStepName("STEP01")
      .setProcStepName("STEP01")
      .setUser("LoadTestUser")
      .build
  }
}
