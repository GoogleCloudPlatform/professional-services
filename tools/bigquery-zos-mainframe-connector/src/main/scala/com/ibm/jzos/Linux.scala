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

import java.nio.channels.FileChannel
import java.nio.file.{Files, Paths, StandardOpenOption}

import com.google.cloud.gszutil.Util.{CredentialProvider, DefaultCredentialProvider, Logging}
import com.google.cloud.gszutil.io.{ChannelRecordReader, ZRecordReaderT}
import com.google.cloud.gszutil.{CopyBook, Util}
import com.google.common.base.Charsets
import com.google.common.io.ByteStreams

object Linux extends ZFileProvider with Logging {
  override def init(): Unit = {
    System.setProperty("java.net.preferIPv4Stack" , "true")
    System.out.println("Build Info:\n" + Util.readS("build.txt"))
  }
  override def readDDWithCopyBook(dd: String, copyBook: CopyBook): ZRecordReaderT = {
    val rr = readDD(dd)
    require(rr.lRecl == copyBook.LRECL, s"Copybook LRECL ${copyBook.LRECL} doesn't match LRECL ${rr.lRecl}")
    rr
  }

  override def ddExists(dd: String): Boolean = {
    sys.env.contains(dd) && sys.env.contains(dd+"_LRECL") && sys.env.contains(dd+"_BLKSIZE")
  }

  override def readDD(dd: String): ZRecordReaderT = ddFile(dd)

  override def readStdin(): String = {
    val in = ByteStreams.toByteArray(System.in)
    new String(in, Charsets.UTF_8)
  }

  override def readDDString(dd: String, recordSeparator: String): String = {
    val in = readDD(dd)
    val bytes = Util.readAllBytes(in)
    Util.records2string(bytes, in.lRecl, Charsets.UTF_8, recordSeparator)
  }

  override def getCredentialProvider(): CredentialProvider = {
    new DefaultCredentialProvider
  }

  override def loadCopyBook(dd: String): CopyBook = {
    val ddValue = System.getenv(dd)
    require(ddValue != null, s"$dd environment variable not defined")
    val ddPath = Paths.get(ddValue)
    require(ddPath.toFile.exists(), s"$ddPath doesn't exist")
    CopyBook(new String(Files.readAllBytes(ddPath), Charsets.UTF_8))
  }

  /** On Linux DD is an environment variable pointing to a file
    */
  protected def ddFile(dd: String): ZRecordReaderT = {
    val ddPath = Paths.get(System.getenv(dd))
    logger.info(s"Opening $dd $ddPath")
    val lReclKey = dd + "_LRECL"
    val blkSizeKey = dd + "_BLKSIZE"
    val env = System.getenv()
    require(env.containsKey(lReclKey), s"$lReclKey environment variable not set")
    require(env.containsKey(blkSizeKey), s"$blkSizeKey environment variable not set")
    val lRecl: Int = env.get(dd + "_LRECL").toInt
    val blkSize: Int = env.get(dd + "_BLKSIZE").toInt
    val ddFile = ddPath.toFile
    require(ddFile.exists, s"$dd $ddPath does not exist")
    require(ddFile.isFile, s"$dd $ddPath is not a file")
    new ChannelRecordReader(FileChannel.open(ddPath, StandardOpenOption.READ), lRecl, blkSize)
  }
}
