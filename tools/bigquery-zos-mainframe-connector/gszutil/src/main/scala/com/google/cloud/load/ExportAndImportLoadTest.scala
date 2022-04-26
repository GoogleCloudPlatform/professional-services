package com.google.cloud.load

import com.google.cloud.gszutil.io.exports.StorageFileCompose
import com.google.cloud.imf.util.Services

import scala.concurrent.Future

class ExportAndImportLoadTest(cfg: GRecvLoadTestConfig) extends GrecvLoadTestService(cfg) {

  val exportUri = s"$getOutputUri/EXPORT"
  val importUri = s"$getOutputUri/IMPORT"
  val gcs = Services.storage()

  override def executeRequest(jobMetadata: JobMetadata): Future[JobResponse] = {
    Future {
      val export = (jobMetadata, GrecvLoadTestClient.`export`(jobMetadata, exportUri, cfg))
      handleResponse(export, "export")
      new StorageFileCompose(gcs).composeAll(s"$importUri/${jobMetadata.jobId}", s"$exportUri/${jobMetadata.jobId}/")
      (jobMetadata, GrecvLoadTestClient.importRequest(jobMetadata, s"$importUri/${jobMetadata.jobId}", s"$importUri/orc/${jobMetadata.jobId}", compress = false, cfg))
    }
  }
}
