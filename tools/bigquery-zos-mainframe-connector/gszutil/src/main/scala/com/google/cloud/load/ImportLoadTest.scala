package com.google.cloud.load

import scala.concurrent.Future

class ImportLoadTest(cfg: GRecvLoadTestConfig) extends GrecvLoadTestService(cfg) {

  val inImportUri = cfg.importFilePath
  val outImportUri = s"$getOutputUri/IMPORT"
  logger.info(s"$loadTestId Import file path $inImportUri")

  override def executeRequest(jobMetadata: JobMetadata): Future[JobResponse] = {
    Future {
      (jobMetadata, GrecvLoadTestClient.importRequest(jobMetadata, inImportUri, s"$outImportUri/orc/${jobMetadata.jobId}", compress = true, cfg))
    }
  }

  override def readSql(): String = ""
}
