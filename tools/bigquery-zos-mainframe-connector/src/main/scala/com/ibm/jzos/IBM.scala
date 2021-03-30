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

package com.ibm.jzos

import com.google.cloud.gszutil.Util.{CredentialProvider, GoogleCredentialsProvider, Logging}
import com.google.cloud.gszutil.io.ZRecordReaderT
import com.google.cloud.gszutil.{CopyBook, Decoding, Util}
import com.google.common.base.Charsets
import com.google.common.io.ByteStreams

object IBM extends ZFileProvider with Logging {
  override def init(): Unit = {
    ZOS.addCCAProvider()
    System.setProperty("java.net.preferIPv4Stack" , "true")
    System.out.println("Build Info:\n" + Util.readS("build.txt"))
  }

  override def readDDWithCopyBook(dd: String, copyBook: CopyBook): ZRecordReaderT = {
    val rr = ZOS.readDD(dd)

    require(rr.lRecl == copyBook.LRECL, s"Copybook LRECL ${copyBook.LRECL} doesn't match DSN LRECL ${rr.lRecl}")
    rr
  }

  override def ddExists(dd: String): Boolean = ZOS.ddExists(dd)

  override def readDD(dd: String): ZRecordReaderT = ZOS.readDD(dd)

  override def readStdin(): String = {
    val in = ByteStreams.toByteArray(System.in)
    new String(in, Decoding.CP1047)
  }

  override def readDDString(dd: String, recordSeparator: String): String = {
    val in = readDD(dd)
    val bytes = Util.readAllBytes(in)
    val decoded = Decoding.ebcdic2ASCIIBytes(bytes)
    Util.records2string(decoded, in.lRecl, Charsets.UTF_8, recordSeparator)
  }

  private var cp: CredentialProvider = _

  override def getCredentialProvider(): CredentialProvider = {
    if (cp != null) cp
    else {
      val bytes = Util.readAllBytes(readDD("KEYFILE"))
      cp = new GoogleCredentialsProvider(bytes)
      cp
    }
  }

  override def loadCopyBook(dd: String): CopyBook = {
    val raw = readDDString(dd, "\n")
    logger.debug(s"Parsing copy book:\n$raw")
    try {
      val copyBook = CopyBook(raw)
      logger.info(s"Loaded copy book:\n$copyBook")
      copyBook
    } catch {
      case e: Exception =>
        throw new RuntimeException("Failed to parse copybook", e)
    }
  }
}
