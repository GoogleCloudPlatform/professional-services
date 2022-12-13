/*
 * Copyright 2022 Google LLC All Rights Reserved.
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

import java.io.{BufferedOutputStream, OutputStream}
import java.net.URI
import java.nio.channels.Channels
import java.util.zip.GZIPOutputStream
import com.google.cloud.bqsh.{ArgParser, Command, ScpConfig, ScpOptionParser}
import com.google.cloud.gszutil.io.ZRecordReaderT
import com.google.cloud.imf.gzos.MVSStorage.MVSPDSMember
import com.google.cloud.imf.gzos.{CharsetTranscoder, CloudDataSet, DataSetInfo, MVS, MVSStorage, Util}
import com.google.cloud.imf.util.{Logging, Services}
import com.google.cloud.storage.{BlobId, BlobInfo, Storage}
import com.google.common.io.CountingOutputStream

import scala.util.{Failure, Success, Try}

/** Simple binary copy
  * Single connection - not recommended for large uploads
  * Writes gzip compressed object by default for non-PDS datasets
  * Compression is disabled by default for PDS members
  * If GCSDSNURI envvar is set, output URI is automatically set
  * by appending the DSN to the base URI, thus does not
  * need to be specified via command-line arguments.
  *
  */
object Scp extends Command[ScpConfig] with Logging {
  override val name: String = "scp"
  override val parser: ArgParser[ScpConfig] = ScpOptionParser
  override def run(config: ScpConfig, zos: MVS, env: Map[String,String]): Result = {
    logger.debug(s"Staring scp $config")
    try {
      CloudDataSet.readEnv(env)
      val gcs = Services.storage(Services.storageCredentials())

      Try(zos.listPDS(config.inDSN)) match {
        case Success(members) =>
          // inDSN is a PDS
          logger.info(s"reading PDS ${config.inDSN.fqdsn}")
          var result: Result = Result.Success
          while (members.hasNext && result.exitCode == 0) {
            val member = members.next()
            val mbr = MVSPDSMember(config.inDsn, member.name)
            logger.info(s"reading member ${mbr.fqdsn}")
            result = copyToCloudStorage(in = zos.readDSN(mbr), config, gcs, member.name)
          }
          result

        case Failure(e) =>
          // not a PDS
          val in: ZRecordReaderT =
            if (config.inDsn.nonEmpty) {
              logger.debug(s"reading from DSN=${config.inDsn}")
              zos.readDSN(MVSStorage.parseDSN(config.inDsn))
            } else if (config.inDD.nonEmpty) {
              logger.debug(s"reading from DD:${config.inDD}")
              zos.readDD(config.inDD)
            } else {
              logger.info("input not specified, reading from default input DD:INFILE")
              zos.readDD("INFILE")
            }
          copyToCloudStorage(in, config, gcs)
      }
    } catch {
      case e: Throwable =>
        val sb = new StringBuilder
        sb.append(s"exception thrown during scp")
        if (e.getMessage != null)
          sb.append(s"\n${e.getMessage}")
        val msg = sb.result
        logger.error(msg, e)
        Result.Failure(msg)
    }
  }

  /** Create output URI for a given combination
    * If prefix includes a trailing slash, DSN for a PDS will not be appended
    * For a normal dataset (not a PDS), DSN is always used as the output object name
    *
    * @param prefix uri prefix of form gs://[BUCKET]/[PREFIX]
    * @param dsn input DSN without member name
    * @param memberName optional member name or empty string
    * @return output URI as String
    */
  def mkOutUri(prefix: String, dsn: String, memberName: String = ""): String = {
    if (memberName.nonEmpty) {
      // PDS
      if (prefix.endsWith("/")) {
        // append DSN with member name to base uri
        s"$prefix$dsn/$memberName"
      } else {
        // discard DSN and use member name only
        s"$prefix/$memberName"
      }
    } else {
      // normal dataset, not a PDS
      if (prefix.endsWith("/")) {
        s"$prefix$dsn"
      } else {
        s"$prefix/$dsn"
      }
    }
  }

  /** Copy data to Cloud Storage
    * if copying a PDS member, convert EBCDIC to ASCII
    *
    * @param in ZRecordReaderT
    * @param config ScpConfig
    * @param gcs Storage client
    * @param memberName optional member name, if copying a PDS member
    * @return Result
    */
  def copyToCloudStorage(in: ZRecordReaderT, config: ScpConfig, gcs: Storage, memberName: String = ""): Result = {
    val lrecl = in.lRecl

    val outUri: String = {
      // explicitly provided output URI takes precedence
      if (config.gcsOutUri.nonEmpty) {
        logger.info(s"writing to output location: ${config.gcsOutUri}")
        mkOutUri(config.gcsOutUri, config.inDsn, memberName)
      } else {
        // otherwise, check CloudDataSet prefixes
        CloudDataSet.getUri(DataSetInfo(in.getDsn)) match {
          case Some(uri) =>
            logger.info(s"writing to CloudDataSet: $uri")
            uri
          case None =>
            val msg = "scp is unable to determine output location.\n" +
              s"either provide --gcsOutUri option or " +
              s"set ${CloudDataSet.DsnVar} and ${CloudDataSet.GdgVar}"
            logger.error(msg)
            return Result.Failure(msg)
        }
      }
    }

    val t0 = System.currentTimeMillis()
    val contentType = if (config.convert) "text/plain" else "application/octet-stream"
    val os: CountingOutputStream =
      new CountingOutputStream(openGcsUri(gcs, outUri, lrecl, config.compress, contentType))

    var nRecordsRead: Long = 0
    var n = 0
    val buf = new Array[Byte](lrecl)
    try {
      n = in.read(buf)
      if (config.convert) {
        val transcoder = CharsetTranscoder(config.encoding)
        while (n > -1 && (nRecordsRead < config.limit || config.limit < 0)) {
          if (n > 0) {
            nRecordsRead += 1
            transcoder.decodeBytes(buf)
            // write converted character record
            os.write(buf, 0, lrecl)
            // append line break
            os.write('\n')
          }
          n = in.read(buf)
        }
      } else {
        while (n > -1 && (nRecordsRead < config.limit || config.limit < 0)) {
          if (n > 0) {
            nRecordsRead += 1
            os.write(buf, 0, lrecl)
          }
          n = in.read(buf)
        }
      }
      os.close()
      in.close()
      logger.info(s"finished writing $nRecordsRead records")
    } catch {
      case t: Throwable =>
        in.close()
        val msg = s"exception during upload:\n${t.getMessage}"
        logger.error(msg, t)
        return Result.Failure(msg)
    }

    val t1 = System.currentTimeMillis()

    Option(gcs.get(blobId(outUri))) match {
      case Some(blob) =>
        val size = blob.getSize
        val readRate = Util.fmbps(os.getCount, t1 - t0)
        val writeRate = Util.fmbps(size, t1 - t0)
        val msg =
          s"""Wrote $nRecordsRead records
             |$outUri
             |${nRecordsRead * lrecl} bytes read
             |$size bytes written
             |read rate: $readRate mbps
             |write rate: $writeRate mbps
             |$blob""".stripMargin
        logger.info(msg)

        Result(activityCount = nRecordsRead)
      case None =>
        Result.Failure(s"finished writing $nRecordsRead records, ${os.getCount} bytes " +
          s"\nbut object not found at $outUri")
    }
  }

  /** object metadata with lrecl and gzip */
  def blobMetadata(lrecl: Int): java.util.Map[String,String] = {
    val m = new java.util.HashMap[String,String]()
    m.put("x-goog-meta-lrecl", s"$lrecl")
    m
  }

  def validateGcsUri(uri: URI): Unit = {
    require(uri.getAuthority != null, "missing GCS bucket name")
    require(uri.getPath != null && uri.getPath != "", "missing GCs object name")
    require(uri.getScheme == "gs", "scheme must be gs://")
  }

  /** BlobId from URI */
  def blobId(uri: String): BlobId = {
    val gcsUri = new URI(uri)
    validateGcsUri(gcsUri)
    BlobId.of(gcsUri.getAuthority, gcsUri.getPath.stripPrefix("/"))
  }
  def openGcsUri(gcs: Storage, uri: String, lrecl: Int, compress: Boolean, contentType: String = "application/octet-stream"): OutputStream = {
    val blobInfo = BlobInfo.newBuilder(blobId(uri))
      .setContentType(contentType)
      .setContentEncoding(if (compress) "gzip" else "identity")
      .setMetadata(blobMetadata(lrecl)).build
    if (compress) openGcsBlobGzip(gcs, blobInfo)
    else openGcsBlob(gcs, blobInfo)
  }

  def openGcsBlob(gcs: Storage, blobInfo: BlobInfo): OutputStream = {
    logger.info(s"opening Cloud Storage Writer:\n$blobInfo")
    new BufferedOutputStream(Channels.newOutputStream(gcs.writer(blobInfo)), 256 * 1024)
  }

  def openGcsBlobGzip(gcs: Storage, blobInfo: BlobInfo): OutputStream = {
    logger.info(s"opening Cloud Storage Writer (gzip):\n$blobInfo")
    new BufferedOutputStream(new GZIPOutputStream(Channels.newOutputStream(gcs.writer(blobInfo)), 32 * 1024, true), 256 * 1024)
  }
}
