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

package com.google.cloud.imf.gzos

import com.google.cloud.gszutil
import com.google.cloud.gszutil.{CopyBook, Transcoder}
import com.google.cloud.gszutil.io.{ZRecordReaderT, ZRecordWriterT}
import com.google.cloud.imf.gzos.MVSStorage.DSN
import com.google.cloud.imf.gzos.Util.GoogleCredentialsProvider
import com.google.cloud.imf.gzos.ZOS.{PDSIterator, RecordIterator}
import com.google.cloud.imf.gzos.pb.GRecvProto.ZOSJobInfo
import com.google.cloud.imf.util.{Logging, Services}
import com.google.common.base.Charsets
import com.google.common.io.ByteStreams

import java.nio.file.{Files, Paths}


object IBM extends MVS with Logging {
  override def isIBM: Boolean = true

  override def init(): Unit = {
    ZOS.addCCAProvider()
    System.setProperty("java.net.preferIPv4Stack", "true")
    logger.info("Mainframe Connector Build Info: " + Util.readS("build.txt"))

    ZOS.listDDs
  }

  override def exists(dsn: DSN): Boolean = ZOS.exists(dsn)
  override def ddExists(dd: String): Boolean = ZOS.ddExists(dd)
  override def getDSN(dd: String): String = ZOS.getDSN(dd)
  override def listPDS(dsn: DSN): Iterator[PDSMemberInfo] = new PDSIterator(dsn)
  override def readDSN(dsn: DSN): ZRecordReaderT = ZOS.readDSN(dsn)
  override def writeDSN(dsn: DSN): ZRecordWriterT = ZOS.writeDSN(dsn)
  override def writeDD(dd: String): ZRecordWriterT = ZOS.writeDD(dd)
  override def dsInfo(dd: String): Option[DataSetInfo] = ZOS.getDatasetInfo(dd)
  override def readDD(dd: String): ZRecordReaderT = ZOS.readDD(dd)
  override def readCloudDD(dd: String): ZRecordReaderT = {
    // Check for Cloud Dataset
    dsInfo(dd) match {
      case Some(ds) =>
        logger.info(s"Found DD:$dd $ds")

        // Obtain Cloud Storage client
        val gcs = Services.storage(getCredentialProvider().getCredentials)

        // check if DD exists in Cloud Storage
        CloudDataSet.readCloudDD(gcs, dd, ds) match {
          case Some(r) =>
            // Prefer Cloud Data Set if DSN exists in GCS
            return r
          case _ =>
        }
      case _ =>
    }

    // Check for Local Data Set (standard z/OS DD)
    ZOS.readDD(dd)
  }

  override def readDSNLines(dsn: DSN): Iterator[String] =
    new RecordIterator(readDSN(dsn)).takeWhile(_ != null)

  override def readStdin(): String = {
    val in = ByteStreams.toByteArray(System.in)
    new String(in, Ebcdic.charset)
  }

  override def readDDString(dd: String, recordSeparator: String): String = {
    val in = ZOS.readDD(dd)
    val bytes = Util.readAllBytes(in)
    val decoded = Ebcdic.decodeBytes(bytes)
    Util.records2string(decoded, in.lRecl, Charsets.UTF_8, recordSeparator)
  }

  private var cp: CredentialProvider = _
  private var principal: String = _

  override def getPrincipal(): String = {
    if (principal == null) getCredentialProvider()
    principal
  }

  def readKeyfile(): Array[Byte] = {
    sys.env.get("GOOGLE_APPLICATION_CREDENTIALS")
      .orElse(sys.env.get("GKEYFILE")) match {
      case Some(unixPath) if unixPath.nonEmpty =>
        logger.info(s"reading credentials from $unixPath")
        Files.readAllBytes(Paths.get(unixPath))
      case None =>
        logger.info(s"reading credentials from DD:KEYFILE")
        Util.readAllBytes(ZOS.readDD("KEYFILE"))
    }
  }

  override def getCredentialProvider(): CredentialProvider = {
    if (this.cp != null) this.cp
    else {
      val cp = new GoogleCredentialsProvider(readKeyfile())
      cp.getClientEmail.foreach{x =>
        logger.info(s"loaded keyfile for $x")
        principal = x
      }
      this.cp = cp
      cp
    }
  }

  override def loadCopyBook(dd: String, picTCharset: Option[String] = None) : CopyBook = {
    val raw = readDDString(dd, "\n")
    logger.info(s"Parsing copy book:\n$raw")
    try {
      val copyBook = CopyBook(raw, Ebcdic, picTCharset = picTCharset)
      logger.info(s"Loaded copy book with LRECL=${copyBook.LRECL}")
      copyBook
    } catch {
      case e: Exception =>
        throw new RuntimeException("Failed to parse copybook", e)
    }
  }

  override def jobId: String = ZOS.getJobId
  override def jobName: String = ZOS.getJobName
  override def jobDate: String = sys.env.getOrElse("JOBDATE","UNKNOWN")
  override def jobTime: String = sys.env.getOrElse("JOBTIME","UNKNOWN")
  override def getInfo: ZOSJobInfo = ZOS.getInfo
  override def getSymbol(s: String): Option[String] = ZOS.getSymbol(s)
  override def substituteSystemSymbols(s: String): String = ZOS.substituteSystemSymbols(s)
  override def submitJCL(jcl: Seq[String]): Option[ZMVSJob] = ZOS.submitJCL(jcl)
  override def transcoder: gszutil.Transcoder = Ebcdic
}
