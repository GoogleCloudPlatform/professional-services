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

import com.google.cloud.bigquery.{BigQuery, BigQueryException}
import com.google.cloud.bqsh._
import com.google.cloud.gszutil.io.exports.{BqSelectResultExporter, MVSFileExport, StorageFileCompose}
import com.google.cloud.gszutil.{CopyBook, SchemaProvider}
import com.google.cloud.imf.grecv.client.GRecvClient
import com.google.cloud.imf.gzos.{LocalizedTranscoder, MVS, MVSStorage}
import com.google.cloud.imf.util.{Logging, Services, StatsUtil}
import com.google.cloud.storage.Storage

import java.net.URI

object Export extends Command[ExportConfig] with Logging {
  override val name: String = "bq export"
  override val parser: ArgParser[ExportConfig] = ExportOptionParser

  override def run(cfg: ExportConfig, zos: MVS, env: Map[String, String]): Result = {
    val startTime = System.currentTimeMillis()
    val creds = zos.getCredentialProvider().getCredentials
    logger.info(s"Starting bq export\n$cfg")
    val bq: BigQuery = Services.bigQuery(cfg.projectId, cfg.location, creds)

    val query =
      if (cfg.sql.nonEmpty) cfg.sql
      else {
        cfg.dsn match {
          case Some(dsn) =>
            logger.info(s"Reading query from DSN: $dsn")
            zos.readDSNLines(dsn).mkString("\n")
          case None =>
            logger.info("Reading query from DD: QUERY")
            zos.readDDString("QUERY", "\n")
        }
      }
    logger.info(s"SQL Query:\n$query")
    if (query.isEmpty) {
      val msg = "Empty export query"
      logger.error(msg)
      return Result.Failure(msg)
    }

    //copybook is required
    val sp: CopyBook =
      if (cfg.cobDsn.nonEmpty) {
        logger.info(s"reading copybook from DSN=${cfg.cobDsn}")
        CopyBook(zos.readDSNLines(MVSStorage.parseDSN(cfg.cobDsn)).mkString("\n"), picTCharset = cfg.picTCharset)
      } else {
        logger.info(s"reading copybook from DD:COPYBOOK")
        zos.loadCopyBook("COPYBOOK",  cfg.picTCharset)
      }

    try {
      val result = if (cfg.bucket.isEmpty) {
        localExport(query, bq, cfg, zos, sp)
      } else {
        remoteExport(query, sp.raw, Services.storage(creds), cfg, zos, env)
      }

      // Publish results
      if (cfg.statsTable.nonEmpty) {
        val statsTable = BQ.resolveTableSpec(cfg.statsTable, cfg.projectId, cfg.datasetId)
        val jobId = BQ.genJobId(cfg.projectId, cfg.location, zos, "query")
        val tblspec = s"${statsTable.getProject}:${statsTable.getDataset}.${statsTable.getTable}"
        logger.debug(s"Writing stats to $tblspec, with jobId ${jobId}")
        StatsUtil.retryableInsertJobStats(zos, jobId, bq, statsTable, jobType = "export", recordsOut = result.activityCount)
      }

      logger.info(s"Export completed, exported=${result.activityCount} rows, " +
        s"time took: ${(System.currentTimeMillis() - startTime) / 1000} seconds.")
      result
    } catch {
      case e: BigQueryException =>
        val msg = "export query failed with BigQueryException: " + e.getMessage + "\n"
        logger.error(msg, e)
        Result.Failure(msg)
    }
  }

  private def remoteExport(sql: String, copybook: String, gcs: Storage, cfg: ExportConfig, zos: MVS, env: Map[String, String]): Result = {
    logger.debug(s"Using remote export, bucket=${cfg.bucket}")
    val (host, port, trustCertCollectionFilePath) = if (cfg.remoteHost.isEmpty) {
      (env.getOrElse("SRVHOSTNAME", ""), env.getOrElse("SRVPORT", "51770").toInt, env.getOrElse("TRUST_CERT_COLLECTION_FILE_PATH", ""))
    } else (cfg.remoteHost, cfg.remotePort, cfg.trustCertCollectionFilePath)
    val cfg1 = cfg.copy(remoteHost = host, remotePort = port, trustCertCollectionFilePath = trustCertCollectionFilePath)

    val dsn = zos.getDSN(cfg.outDD)
    val gcsUri = s"gs://${cfg.bucket}/EXPORT/$dsn"
    val r = GRecvClient.export(sql, copybook, gcsUri, cfg1, zos)
    r match {
      case Result(_, 1, _, msg, _) => throw new IllegalStateException(s"Remote export failed due to : $msg")
      case _ =>
    }
    if (cfg.runMode.toLowerCase != "single") {
      val startTime = System.currentTimeMillis()
      new StorageFileCompose(gcs).composeAll(gcsUri, s"$gcsUri/${zos.getInfo.getJobid}/")
      deleteGcsFolder(gcs, gcsUri + "/")
      logger.info(s"File compose completed, took=${System.currentTimeMillis() - startTime} millis.")
    }
    r
  }

  private def localExport(sql: String, bq: BigQuery, cfg: ExportConfig, zos: MVS, sp: SchemaProvider): Result = {
    logger.debug(s"Using local export")
    new BqSelectResultExporter(cfg, bq, zos.getInfo, sp, MVSFileExport(cfg.outDD, zos)).doExport(sql)
  }

  private def deleteGcsFolder(gcs: Storage, dirToRemove: String): Unit = {
    import scala.jdk.CollectionConverters._
    val sourceUri = new URI(dirToRemove)
    val sourceFiles = gcs.list(sourceUri.getAuthority, Storage.BlobListOption.prefix(sourceUri.getPath.stripPrefix("/")))
      .iterateAll.asScala.toSeq
    if(sourceFiles.nonEmpty) {
      val batch = gcs.batch()
      sourceFiles.foreach(file => batch.delete(file.getBlobId))
      batch.submit()
      logger.info(s"GCS $dirToRemove folder with ${sourceFiles.size} files have been removed.")
    }
  }
}
