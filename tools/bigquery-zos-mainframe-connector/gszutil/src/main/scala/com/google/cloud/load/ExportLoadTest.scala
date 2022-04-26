package com.google.cloud.load

import scala.concurrent.Future

class ExportLoadTest(cfg: GRecvLoadTestConfig) extends GrecvLoadTestService(cfg) {

  val exportUri = s"$getOutputUri/EXPORT"

  override def executeRequest(jobMetadata: JobMetadata): Future[JobResponse] = {
    Future {
      (jobMetadata, GrecvLoadTestClient.`export`(jobMetadata, exportUri, cfg))
    }
  }
}
