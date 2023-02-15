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
package com.google.cloud.bqsh.cmd

import java.net.URI
import java.nio.channels.Channels
import java.nio.charset.StandardCharsets
import java.nio.file.Paths
import com.google.cloud.bqsh.{ArgParser, BQ, Command, GsUtilConfig, GsUtilOptionParser}
import com.google.cloud.gszutil.Decoding.{CopyBookField, CopyBookLine, CopyBookTitle}
import com.google.cloud.gszutil.io.ZRecordReaderT
import com.google.cloud.gszutil.orc.WriteORCFile
import com.google.cloud.gszutil.{CopyBook, Decoding, RecordSchema, SchemaProvider}
import com.google.cloud.imf.grecv.client.GRecvClient
import com.google.cloud.imf.gzos.pb.GRecvProto.Record
import com.google.cloud.imf.gzos.{CloudDataSet, LocalizedTranscoder, MVS, MVSStorage}
import com.google.cloud.imf.util.{Logging, Services, StatsUtil}
import com.google.cloud.storage.{BlobId, BucketInfo, Storage}
import com.google.protobuf.util.JsonFormat

import scala.util.Try


object Cp extends Command[GsUtilConfig] with Logging {
  override val name: String = "gsutil cp"
  override val parser: ArgParser[GsUtilConfig] = GsUtilOptionParser

  def run(c: GsUtilConfig, zos: MVS, env: Map[String, String]): Result = {
    val creds = zos
      .getCredentialProvider()
      .getCredentials
    val gcs = Services.storage(creds)

    if (c.destPath.nonEmpty) {
      return cpFs(c.gcsUri, c.destPath, gcs, zos)
    } else if (c.destDSN.nonEmpty) {
      return cpDsn(c.gcsUri, c.destDSN, gcs, zos)
    }

    val schemaProvider: SchemaProvider = parseRecord(getTransformationsAsString(c, gcs, zos)) match {
      case Some(x) => {
        logger.info("Merging copybook with provided transformations ...")

        val sch = c.schemaProvider.getOrElse(zos.loadCopyBook(c.copyBook, c.encoding, c.picTCharset))
        logger.info(s"Current Schema: ${sch.toString}")

        val newSchema = merge(sch, x)
        logger.info(s"Schema After Merging:${newSchema.toString}")
        newSchema
      }
      case None => {
        logger.info("Use original copybook")
        c.schemaProvider.getOrElse(zos.loadCopyBook(c.copyBook, c.encoding, c.picTCharset))
      }
    }
    val in: ZRecordReaderT = c.testInput.getOrElse(zos.readCloudDD(c.source))
    logger.info(s"gsutil cp ${in.getDsn} ${c.gcsUri}")
    val batchSize = (c.blocksPerBatch * in.blkSize) / in.lRecl
    if (c.replace) {
      GsUtilRm.run(c.copy(recursive = true), zos, env)
    } else {
      val uri = new URI(c.gcsUri)
      val withTrailingSlash = uri.getPath.stripPrefix("/").stripSuffix("/") + "/"
      val bucket = uri.getAuthority
      val lsResult = gcs.list(bucket,
        Storage.BlobListOption.prefix(withTrailingSlash),
        Storage.BlobListOption.currentDirectory())
      import scala.jdk.CollectionConverters.IterableHasAsScala
      if (lsResult.getValues.asScala.nonEmpty) {
        val msg = s"Data exists at $uri;" +
          "use --replace to remove existing files prior to upload."
        logger.error(msg)
        return Result.Failure(msg)
      }
    }
    val sourceDSN = in.getDsn

    val result =
      if (c.remote) {
        logger.info("Using server for transcoding to ORC")
        val c1 =
          if (c.gcsDSNPrefix.isEmpty) {
            if (!env.contains(CloudDataSet.DsnVar)) {
              logger.warn(s"${CloudDataSet.DsnVar} environment variable not set")
              c
            } else c.copy(gcsDSNPrefix = env(CloudDataSet.DsnVar))
          } else c

        // get hostname from environment
        val c2 =
          if (c.remoteHost.isEmpty)
            c1.copy(remoteHost = env.getOrElse("SRVHOSTNAME", ""),
                    remotePort = env.getOrElse("SRVPORT","52701").toInt,
                    trustCertCollectionFilePath = env.getOrElse("TRUST_CERT_COLLECTION_FILE_PATH", ""))
          else c1
        GRecvClient.write(c2, zos, in, schemaProvider, GRecvClient)
      }
      else {
        logger.warn("Not using server for transcoding to ORC - data will be read and transcoded " +
          "to ORC locally and ORC files will be written directly to Cloud Storage")
        WriteORCFile.run(
          gcsUri = c.gcsUri,
          in = in,
          schemaProvider = schemaProvider,
          gcs = gcs,
          parallelism = c.parallelism,
          batchSize = batchSize,
          zos,
          maxErrorPct = c.maxErrorPct)
      }
    in.close()

    if (c.statsTable.nonEmpty) {
      val statsTable = BQ.resolveTableSpec(c.statsTable, c.projectId, c.datasetId)
      logger.debug(s"writing stats to ${BQ.tableSpec(statsTable)}")
      val jobId = BQ.genJobId(c.projectId, c.location, zos.getInfo, "cp")
      val bqProj = if (c.projectId.nonEmpty) c.projectId else statsTable.getProject
      StatsUtil.retryableInsertJobStats(
        zos = zos,
        jobId = jobId,
        bq = Services.bigQuery(bqProj, c.location, creds),
        tableId = statsTable,
        jobType = "cp",
        source = sourceDSN,
        dest = c.gcsUri,
        recordsIn = result.activityCount + result.errorCount,
        recordsOut = result.activityCount)
    }

    // cleanup temp files
    GsUtilRm.run(c.copy(recursive = true,
      gcsUri = c.gcsUri.stripSuffix("/") + "/tmp"), zos, env)

    result
  }

  def cpFs(srcUri: String, destPath: String, gcs: Storage, zos: MVS): Result = {
    val uri = new URI(srcUri)
    Option(gcs.get(BlobId.of(uri.getAuthority, uri.getPath))) match {
      case Some(value) =>
        val dest =
          if (!srcUri.endsWith("/")) Paths.get(destPath)
          else Paths.get(destPath + srcUri.reverse.dropWhile(_ != '/').reverse)

        logger.debug(s"gsutil cp $uri $dest")
        value.downloadTo(dest)
        Result.Success
      case None =>
        Result.Failure(s"$srcUri doesn't exist")
    }
  }

  def cpDsn(srcUri: String, destDSN: String, gcs: Storage, zos: MVS): Result = {
    val uri = new URI(srcUri)
    Option(gcs.get(BlobId.of(uri.getAuthority, uri.getPath))) match {
      case Some(value) =>
        val w = zos.writeDSN(MVSStorage.parseDSN(destDSN))

        logger.debug(s"gsutil cp $uri $destDSN")
        value.downloadTo(Channels.newOutputStream(w))
        Result.Success
      case None =>
        Result.Failure(s"$srcUri doesn't exist")
    }
  }


  def parseRecord(json: Option[String]): Option[Record] = {
    json match {
      case Some(x) =>
        Try {
          val builder = Record.newBuilder
          JsonFormat.parser.ignoringUnknownFields.merge(x, builder)
          builder
        }.fold(e => {
          logger.error(s"Unable to parse provided json transformations\n $x", e)
          Option.empty
        },
          x => Option(x.build())
        )
      case _ => None
    }
  }

  def getTransformationsAsString(c: GsUtilConfig, gcs: Storage, zos: MVS): Option[String] = {
    logger.info("Getting transformations as String")
    if (c.tfGCS.nonEmpty) {
      logger.info("Fetching from GCS ... ")
      BucketInfo.of(c.tfGCS).getName
      logger.info(s"Reading transformation from GCS: ${c.tfGCS} ")
      val bucket = c.tfGCS.stripPrefix("gs://").split("/")(0)
      val objName = c.tfGCS.stripPrefix(s"gs://$bucket/")
      logger.info(s"Object name: $objName")
      logger.info(s"Bucket name: $bucket")
      Option(gcs.get(BlobId.of(bucket, objName))) match {
        case Some(value) => {
          logger.info("Encoding:" + value.getContent())
          Option(new String(value.getContent(), StandardCharsets.UTF_8))
        }
        case _ => {
          None
        }
      }
    } else if (c.tfDSN.nonEmpty) {
      logger.info("Reading from DSN ... ")
      Option(zos.readDDString(c.tfDSN, ""))
    }
    else
      None
  }

  def merge(s: SchemaProvider, r: Record): SchemaProvider = {
    import scala.jdk.CollectionConverters.IterableHasAsScala

    s match {
      case x: CopyBook =>
        logger.info("Merging CopyBook")


        val seq1: List[Record.Field] = r.getFieldList.asScala.toList
        val names = seq1.map(_.getName.trim)
        val v: Seq[CopyBookLine] = x.Fields.filterNot({
          case CopyBookField(n1, _, _) =>
            names.contains(n1)
          case CopyBookTitle(_) => false
        })

        val newFileds = x.Fields.map {
          case c: CopyBookField if names.contains(c.name) =>
            // TODO: possible issue after merge CopyBookField (_,_,type?) may be passed incorrectly
            CopyBookField(c.name, Decoding.getDecoder(seq1.find(p => p.getName.trim == c.name).get, x.transcoder), c.fieldType)
          case x =>
            x
        }
        CopyBook(x.raw, x.transcoder, Option(newFileds), x.picTCharset)

      case y: RecordSchema => {
        logger.info("Merging RecordSchema")
        val newOnes: List[Record.Field] = r.getFieldList.asScala.toList
        val fnames = newOnes.map(_.getName.trim)

        val filtered = y.r.getFieldList.asScala.filterNot(x => fnames.contains(x.getName))


        val v: List[Record.Field] = y.r.getFieldList.asScala.toList.flatMap { x =>
          newOnes.find(p => p.getName.trim == x.getName.trim)
        }

        val newRec = Record.newBuilder(y.r)
        var l = newRec.getFieldCount - 1
        while (l >= 0) {
          newRec.removeField(l)
          l = l - 1
        }
        v.foreach(u => newRec.addField(u))
        RecordSchema(newRec.build())
      }
    }
  }
}
