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

import com.google.cloud.gszutil.{CopyBook, Transcoder}
import com.google.cloud.gszutil.io.{ZRecordReaderT, ZRecordWriterT}
import com.google.cloud.imf.gzos.MVSStorage.DSN
import com.google.cloud.imf.gzos.pb.GRecvProto.ZOSJobInfo

trait MVS {
  def isIBM: Boolean
  def init(): Unit
  def ddExists(dd: String): Boolean
  def getDSN(dd: String): String
  def exists(dsn: DSN): Boolean
  def readDSN(dsn: DSN): ZRecordReaderT
  def readDSNLines(dsn: DSN): Iterator[String]
  def writeDSN(dsn: DSN): ZRecordWriterT
  def writeDD(ddName: String): ZRecordWriterT
  def dsInfo(dd: String): Option[DataSetInfo]
  def readCloudDD(dd: String): ZRecordReaderT
  def readDD(dd: String): ZRecordReaderT
  def readStdin(): String
  def readDDString(dd: String, recordSeparator: String): String
  def getPrincipal(): String
  def getCredentialProvider(): CredentialProvider
  def readKeyfile(): Array[Byte]
  def listPDS(dsn: DSN): Iterator[PDSMemberInfo]
  def loadCopyBook(dd: String, picTCharset: Option[String] = None): CopyBook
  def jobName: String
  def jobDate: String
  def jobTime: String
  def jobId: String = jobName+jobDate+jobTime
  def getInfo: ZOSJobInfo
  def getSymbol(s: String): Option[String]
  def substituteSystemSymbols(s: String): String
  def submitJCL(jcl: Seq[String]): Option[ZMVSJob]
  def transcoder: com.google.cloud.gszutil.Transcoder
}

