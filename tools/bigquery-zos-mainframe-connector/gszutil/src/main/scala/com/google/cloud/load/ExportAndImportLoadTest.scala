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
