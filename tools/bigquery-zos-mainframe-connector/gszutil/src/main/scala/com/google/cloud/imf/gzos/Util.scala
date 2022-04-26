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

import java.io.{ByteArrayInputStream, ByteArrayOutputStream}
import java.nio.ByteBuffer
import java.nio.channels.{Channels, ReadableByteChannel, WritableByteChannel}
import java.nio.charset.Charset
import com.google.auth.oauth2.{GoogleCredentials, ServiceAccountCredentials}
import com.google.cloud.gszutil.io.{ZDataSet, ZRecordReaderT}
import com.google.cloud.imf.gzos.pb.GRecvProto.ZOSJobInfo
import com.google.cloud.imf.util.Logging
import com.google.cloud.storage.BlobInfo
import com.google.common.base.Charsets
import com.google.common.collect.ImmutableSet
import com.google.common.io.{BaseEncoding, Resources}

import java.util.concurrent.TimeoutException
import scala.concurrent.{Await, Future}
import scala.concurrent.duration.{Duration, TimeUnit}
import scala.util.{Failure, Random, Success, Try}

object Util extends Logging {
  final val isIbm = System.getProperty("java.vm.vendor").contains("IBM")
  def zProvider: MVS = if (isIbm) IBM else Linux
  def sleepOrYield(ms: Long): Unit = {
    if (isIbm) {
      logger.info(s"Yielding for $ms ms...")
      val t1 = System.currentTimeMillis + ms
      while (System.currentTimeMillis < t1){
        Thread.`yield`()
      }
    } else {
      logger.info(s"Waiting for $ms ms...")
      Thread.sleep(ms)
    }
  }

  def toMap(zInfo: ZOSJobInfo): java.util.HashMap[String,Any] = {
    val m = new java.util.HashMap[String,Any]()
    if (zInfo != null){
      m.put("jobid",zInfo.getJobid)
      m.put("jobdate", zInfo.getJobdate)
      m.put("jobtime", zInfo.getJobtime)
      m.put("jobname", zInfo.getJobname)
      m.put("stepname",zInfo.getStepName)
      m.put("procstepname",zInfo.getProcStepName)
      m.put("user",zInfo.getUser)
    }
    m
  }

  private val r = Runtime.getRuntime

  def logMem(): String = {
    val free = r.freeMemory() / (1024L * 1024L)
    val total = r.totalMemory() / (1024L * 1024L)
    val used = total - free
    s"Memory: ${used}M used\t${free}M free\t${total}M total"
  }

  val StorageScope = "https://www.googleapis.com/auth/devstorage.read_write"
  val BigQueryScope = "https://www.googleapis.com/auth/bigquery"
  val BigQueryReadScope = "https://www.googleapis.com/auth/bigquery.readonly"
  val ComputeScope = "https://www.googleapis.com/auth/compute"
  val LoggingScope = "https://www.googleapis.com/auth/logging.write"
  final val Scopes = ImmutableSet.of(StorageScope, BigQueryScope, LoggingScope)

  class DefaultCredentialProvider extends CredentialProvider {
    private val credentials =
      GoogleCredentials
        .getApplicationDefault
        .createScoped(Scopes)
    override def getCredentials: GoogleCredentials = {
      credentials.refreshIfExpired()
      credentials
    }
  }

  class GoogleCredentialsProvider(bytes: Array[Byte]) extends CredentialProvider {
    private val credentials: GoogleCredentials =
      GoogleCredentials
        .fromStream(new ByteArrayInputStream(bytes))
        .createScoped(Scopes)

    def getClientEmail: Option[String] =
      credentials match {
        case x: ServiceAccountCredentials => Option(x.getClientEmail)
        case _ => None
      }

    override def getCredentials: GoogleCredentials = {
      credentials.refreshIfExpired()
      credentials
    }
  }

  def transfer(rc: ReadableByteChannel, wc: WritableByteChannel, chunkSize: Int = 4096): Unit = {
    val buf = ByteBuffer.allocate(chunkSize)
    while (rc.read(buf) > -1) {
      buf.flip()
      wc.write(buf)
      buf.clear()
    }
    rc.close()
    wc.close()
  }

  def toUri(blobInfo: BlobInfo): String =
    s"gs://${blobInfo.getBlobId.getBucket}/${blobInfo.getBlobId.getName}"

  def fmbps(bytes: Long, milliseconds: Long): String = f"${mbps(bytes,milliseconds)}%1.2f"

  def mbps(bytes: Long, milliseconds: Long): Double = ((8.0d * bytes) / (milliseconds / 1000.0d)) / 1000000.0d

  def readS(x: String): String = {
    new String(Resources.toByteArray(Resources.getResource(x).toURI.toURL), Charsets.UTF_8)
  }

  def readB(x: String): Array[Byte] = {
    Resources.toByteArray(Resources.getResource(x).toURI.toURL)
  }

  def readAllBytes(in: ReadableByteChannel): Array[Byte] = {
    val chunkSize = in match {
      case x: ZRecordReaderT =>
        x.blkSize
      case _ =>
        4096
    }
    val os = new ByteArrayOutputStream()
    val out = Channels.newChannel(os)
    transfer(in, out, chunkSize)
    os.toByteArray
  }

  def randBytes(len: Int): Array[Byte] = {
    val bytes = new Array[Byte](len)
    Random.nextBytes(bytes)
    bytes
  }

  def random(len: Int, lrecl: Int, blksz: Int): ZDataSet = {
    new ZDataSet(randBytes(len), lrecl, blksz)
  }

  def randString(len: Int): String =
    BaseEncoding.base64Url().encode(randBytes(len)).substring(0,len)

  def trimRight(s: String, c: Char): String = {
    var i = s.length
    while (i > 0 && s.charAt(i-1) == c) {
      i -= 1
    }
    if (i < s.length)
      s.substring(0,i)
    else s
  }

  def records2string(bytes: Array[Byte], lRecl: Int, charset: Charset, recordSeparator: String): String = {
    bytes.grouped(lRecl)
      .map{b => trimRight(new String(b, charset),' ')}
      .mkString(recordSeparator)
  }

  /** Exit with ascii art */
  def exit: Unit = {
    Try(Console.out.println(readS("logo.txt")))
    System.exit(0)
  }

  def await[T](f: Future[T], timeout: Int, unit: TimeUnit): T = {
    Try(Await.result(f, Duration.create(timeout, unit))) match {
      case Success(value) => value
      case Failure(e) if e.isInstanceOf[TimeoutException] => throw new Error(s"Timeout reached after $timeout $unit.", e)
      case Failure(e) => throw e
    }
  }

  def generateHashString: String = Random.alphanumeric.take(8).mkString.toUpperCase

  def quote(s1: String): String = {
    if(s1.startsWith("\"") && s1.endsWith("\"")) {
      s1
    }else{
      s""""$s1""""
    }
  }
}
