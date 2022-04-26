/*
 * Copyright 2020 Google LLC All Rights Reserved.
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

import com.google.cloud.bigquery.TableId
import com.google.cloud.bqsh.{ArgParser, BQ, Command, GsUtilConfig, GsZUtilConfig, GsZUtilOptionParser}
import com.google.cloud.gszutil.{CopyBook, SchemaProvider}
import com.google.cloud.imf.grecv.client.GRecvClient
import com.google.cloud.imf.gzos.{CloudDataSet, DataSetInfo, LocalizedTranscoder, MVS, MVSStorage}
import com.google.cloud.imf.util.{Logging, Services, StatsUtil}

/** Command-Line utility used to request remote transcoding of
  * mainframe datasets in Cloud Storage
  * specify --inDsn or set INFILE DD
  * output location specified by --gcsOutUri or GCSOUTURI environment variable
  */
object GsZUtil extends Command[GsZUtilConfig] with Logging {
  override val name: String = "gszutil"
  override val parser: ArgParser[GsZUtilConfig] = GsZUtilOptionParser
  override def run(c: GsZUtilConfig, zos: MVS, env: Map[String,String]): Result = {
    logger.info(
      s"""GsZUtil starts with following arguments:
         |--inDsn=${c.inDsn},
         |--gcsOutUri=${c.gcsOutUri},
         |--cobDsn=${c.cobDsn},
         |--transformDsn=${c.transformDsn},
         |--remoteHost=${c.remoteHost},
         |--remotePort=${c.remotePort},
         |--picTCharset=${c.picTCharset},
         |--timeOutMinutes=${c.timeOutMinutes},
         |--statsTable=${c.statsTable},
         |--project_id=${c.projectId},
         |--location=${c.location},
         |--dataset_id=${c.datasetId},
         |--keepAliveTimeInSeconds=${c.keepAliveTimeInSeconds}
         |""".stripMargin)


    val sp: SchemaProvider =
      if (c.cobDsn.nonEmpty) {
        logger.info(s"reading copybook from DSN=${c.cobDsn}")
        CopyBook(zos.readDSNLines(MVSStorage.parseDSN(c.cobDsn)).mkString("\n"), picTCharset = c.picTCharset)
      } else {
        logger.info(s"reading copybook from DD:COPYBOOK")
        zos.loadCopyBook("COPYBOOK", c.picTCharset)
      }
    //TODO read FLDINFO DD and merge field info

    val creds = zos.getCredentialProvider().getCredentials
    val gcs = Services.storage(creds)

    val cpConfig = GsUtilConfig(
      schemaProvider = Option(sp),
      picTCharset = c.picTCharset,
      remote = true,
      replace = true,
      remoteHost = c.remoteHost,
      remotePort = c.remotePort,
      gcsUri = c.gcsOutUri,
      statsTable = c.statsTable,
      projectId = c.projectId,
      datasetId = c.datasetId,
      location = c.location,
      timeOutMinutes = c.timeOutMinutes,
      keepAliveTimeInSeconds = c.keepAliveTimeInSeconds
    )

    val dsInfo: DataSetInfo = {
      if (c.inDsn.nonEmpty) {
        logger.info(s"using DSN=${c.inDsn} from --inDsn command-line option")
        DataSetInfo(dsn = c.inDsn)
      } else {
        zos.dsInfo("INFILE") match {
          case Some(ds) =>
            logger.info(s"using DSN=${ds.dsn} from DD:INFILE")
            ds
          case None =>
            val msg = "input DSN not set. provide --inDsn command-line option or" +
              " INFILE DD"
            logger.error(msg)
            throw new RuntimeException(msg)
        }
      }
    }

    logger.info(s"Reading CloudDataSet with datasetInfo=$dsInfo")
    CloudDataSet.readCloudDD(gcs, "INFILE", dsInfo) match {
      case Some(in) =>
        logger.info(s"CloudDataSet found for DSN=${dsInfo.dsn}")
        val result: Result = GRecvClient.write(cpConfig, zos, in, sp, GRecvClient)
        insertStatsIfNeeded(cpConfig, zos, in.uri, result)
        result
      case None =>
        logger.error(s"CloudDataSet not found for DSN=${dsInfo.dsn}")
        Result.Failure(s"DSN ${dsInfo.dsn} not found")
    }
  }

  private def insertStatsIfNeeded(c: GsUtilConfig, zos: MVS, source: String, result: Result): Unit = {
    if (c.statsTable.nonEmpty) {
      val creds = zos
        .getCredentialProvider()
        .getCredentials
      val statsTable: TableId = BQ.resolveTableSpec(c.statsTable, c.projectId, c.datasetId)
      logger.info(s"writing stats to ${BQ.tableSpec(statsTable)}")
      val bqProj = if (c.projectId.nonEmpty) c.projectId else statsTable.getProject
      val jobId = BQ.genJobId(bqProj, c.location, zos, "gszutil")
      StatsUtil.retryableInsertJobStats(
        zos = zos,
        jobId = jobId,
        bq = Services.bigQuery(bqProj, c.location, creds),
        tableId = statsTable,
        jobType = "gszutil",
        source = source,
        dest = c.gcsUri,
        recordsIn = result.errorCount + result.activityCount,
        recordsOut = result.activityCount)
    }
  }
}
