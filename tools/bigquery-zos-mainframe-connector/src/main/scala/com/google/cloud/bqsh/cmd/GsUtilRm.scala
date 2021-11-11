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

import com.google.cloud.bqsh._
import com.google.cloud.gszutil.Util.Logging
import com.google.cloud.storage.{BlobId, Storage}
import com.ibm.jzos.ZFileProvider

object GsUtilRm extends Command[GsUtilConfig] with Logging {
  override val name: String = "gsutil rm"
  override val parser: ArgParser[GsUtilConfig] = GsUtilOptionParser
  override def run(c: GsUtilConfig, zos: ZFileProvider): Result = {
    val creds = zos.getCredentialProvider()
      .getCredentials
    logger.info(s"gsutil rm ${c.destinationUri}")
    val gcs = GCS.defaultClient(creds)
    val uri = new URI(c.destinationUri)
    val bucket = uri.getAuthority
    if (c.recursive) {
      logger.debug(s"deleting recursively from ${c.destinationUri}")
      val withTrailingSlash = uri.getPath.stripPrefix("/") + (if (uri.getPath.last == '/') "" else "/")
      var ls = gcs.list(bucket,
        Storage.BlobListOption.prefix(withTrailingSlash),
        Storage.BlobListOption.currentDirectory())
      import scala.collection.JavaConverters.iterableAsScalaIterableConverter
      var deleted: Long = 0
      var notDeleted: Long = 0
      while (ls != null) {
        val blobIds = ls.getValues.asScala.toArray.map(_.getBlobId)
        logger.debug(s"deleting ${blobIds.map(_.getName).mkString(",")}")
        if (blobIds.nonEmpty){
          val deleteResults = gcs.delete(blobIds: _*)
          deleted += deleteResults.asScala.count(_ == true)
          notDeleted += deleteResults.asScala.count(_ == false)
        }
        ls = ls.getNextPage
      }
      logger.info(s"$deleted deleted $notDeleted notDeleted")
      Result.withExportLong("ACTIVITYCOUNT", deleted)
    } else {
      val deleted = gcs.delete(BlobId.of(bucket, uri.getPath.stripPrefix("/")))
      if (deleted) {
        logger.info(s"deleted $uri")
        Result.withExportLong("ACTIVITYCOUNT", 1)
      } else {
        logger.info(s"$uri was not found. Use --recursive=true to delete all objects with a given prefix")
        Result.withExportLong("ACTIVITYCOUNT", 0, 1)
      }
    }
  }
}
