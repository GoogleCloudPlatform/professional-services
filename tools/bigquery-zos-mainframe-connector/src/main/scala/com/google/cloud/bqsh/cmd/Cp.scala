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
package com.google.cloud.bqsh.cmd

import java.net.URI

import com.google.cloud.bigquery.StatsUtil
import com.google.cloud.bqsh._
import com.google.cloud.gszutil.Util.Logging
import com.google.cloud.gszutil.orc.WriteORCFile
import com.google.cloud.storage.Storage
import com.ibm.jzos.ZFileProvider


object Cp extends Command[GsUtilConfig] with Logging {
  override val name: String = "gsutil cp"
  override val parser: ArgParser[GsUtilConfig] = GsUtilOptionParser
  def run(c: GsUtilConfig, zos: ZFileProvider): Result = {
    val creds = zos
      .getCredentialProvider()
      .getCredentials

    val bq = BQ.defaultClient(c.projectId, c.location, creds)
    val copyBook = zos.loadCopyBook(c.copyBook)
    val in = zos.readDDWithCopyBook(c.source, copyBook)
    logger.info(s"gsutil cp ${in.getDsn} ${c.destinationUri}")

    val batchSize = (c.blocksPerBatch * in.blkSize) / in.lRecl
    val gcs = GCS.defaultClient(creds)
    if (c.replace) {
      GsUtilRm.run(c, zos)
    } else {
      val uri = new URI(c.destinationUri)
      val withTrailingSlash = uri.getPath.stripPrefix("/") + (if (uri.getPath.last == '/') "" else "/")
      val bucket = uri.getAuthority
      val lsResult = gcs.list(bucket,
        Storage.BlobListOption.prefix(withTrailingSlash),
        Storage.BlobListOption.currentDirectory())
      import scala.collection.JavaConverters.iterableAsScalaIterableConverter
      val blobs = lsResult.getValues.asScala.toArray
      if (blobs.nonEmpty) {
        throw new RuntimeException("Data is already present at destination. Use --replace to delete existing files prior to upload.")
      }
    }
    val sourceDSN = in.getDsn

    logger.info("Starting ORC Upload")
    val result = WriteORCFile.run(gcsUri = c.destinationUri,
                     in = in,
                     copyBook = copyBook,
                     gcs = gcs,
                     maxWriters = c.parallelism,
                     batchSize = batchSize,
                     partSizeMb = c.partSizeMB,
                     timeoutMinutes = c.timeOutMinutes,
                     compress = c.compress,
                     compressBuffer = c.compressBuffer,
                     maxErrorPct = c.maxErrorPct)
    logger.info("ORC Upload Complete")
    in.close()
    val nRead = in.count()

    if (c.statsTable.nonEmpty){
      logger.debug("writing stats")
      StatsUtil.insertJobStats(
        jobName=zos.jobName,
        jobDate=zos.jobDate,
        jobTime=zos.jobTime,
        job=None,
        bq=bq,
        tableId=BQ.resolveTableSpec(c.statsTable, c.projectId, c.datasetId),
        jobType="cp",
        source=sourceDSN,
        dest=c.destinationUri,
        recordsIn=nRead)
    }

    result
  }
}
