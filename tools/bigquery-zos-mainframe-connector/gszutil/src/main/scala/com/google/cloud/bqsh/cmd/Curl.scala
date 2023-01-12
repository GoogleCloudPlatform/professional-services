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

import com.google.cloud.bqsh.{ArgParser, Command, CurlConfig, CurlOptionParser}
import com.google.cloud.imf.gzos.MVS
import com.google.cloud.imf.util.{CCATransportFactory, Logging}
import com.google.common.io.BaseEncoding
import org.apache.commons.lang3.StringEscapeUtils
import org.apache.http.HttpResponse
import org.apache.http.client.HttpClient
import org.apache.http.client.config.RequestConfig
import org.apache.http.client.methods.{HttpUriRequest, RequestBuilder}
import org.apache.http.entity.{ContentType, StringEntity}

import java.io.InputStreamReader
import java.nio.CharBuffer
import java.nio.charset.StandardCharsets
import java.nio.file.{Files, Paths}

/** curl command
  * sends http requests
  */
object Curl extends Command[CurlConfig] with Logging {
  override val name: String = "curl"
  override val parser: ArgParser[CurlConfig] = CurlOptionParser

  object NetRc {
    protected val loginRegex = """login\s([a-zA-Z0-9._@]*)""".r
    protected val passwordQuotedRegex = """password\s(".*")""".r
    protected val passwordRegex = """password\s([^ ]*)""".r
    protected val defaultQuotedRegex = """default\slogin\s([a-zA-Z0-9._@]*)\spassword\s(".*")""".r
    protected val defaultRegex = """default\slogin\s([a-zA-Z0-9._@]*)\spassword\s([^ ]*)""".r

    /** Reads credentials for host from netrc contents
      *
      * @param netRc contents of .netrc including newlines
      * @param host hostname to find credentials for
      * @return Option containing tuple of user, pass if credentials were found
      */
    def getCredentials(netRc: String, host: String): Option[(String,String)] = {
      val netRcContents = netRc.linesIterator.map(_.trim).filterNot(_.isEmpty).toIndexedSeq
      val machineRegex0 = ("""machine\s""" + host).r
      val machineRegex1 = ("""machine\s""" + host + """\slogin\s([a-zA-Z0-9._@]*)\spassword\s(".*")""").r
      val machineRegex2 = ("""machine\s""" + host + """\slogin\s([a-zA-Z0-9._@]*)\spassword\s([^ ]*)""").r
      (0 until netRcContents.length).flatMap[(String,String)]{ i =>
        (netRcContents.lift(i), netRcContents.lift(i + 1), netRcContents.lift(i + 2)) match {
          case (Some(machineRegex1(u,p)), None, None) => Option((u,p))
          case (Some(machineRegex2(u,p)), None, None) => Option((u,p))
          case (Some(machineRegex0), Some(loginRegex(u)), Some(passwordQuotedRegex(p))) => Option((u,StringEscapeUtils.UNESCAPE_CSV.translate(p)))
          case (Some(machineRegex0), Some(loginRegex(u)), Some(passwordRegex(p))) => Option((u,p))
          case (Some(defaultQuotedRegex(u,p)), None, None) => Option((u,StringEscapeUtils.UNESCAPE_CSV.translate(p)))
          case (Some(defaultRegex(u,p)), None, None) => Option((u,p))
          case _ => None
        }
      }.headOption
    }
  }

  override def run(cfg: CurlConfig, zos: MVS, env: Map[String, String]): Result = {
    val creds = zos.getCredentialProvider().getCredentials
    val requestBuilder: RequestBuilder =
      cfg.requestMethod.toUpperCase match {
        case "POST" =>
          RequestBuilder.post()
        case "GET" =>
          RequestBuilder.get()
        case "DELETE" =>
          RequestBuilder.delete()
        case "HEAD" =>
          RequestBuilder.head()
        case "PUT" =>
          RequestBuilder.put()
        case "PATCH" =>
          RequestBuilder.patch()
        case "TRACE" =>
          RequestBuilder.trace()
        case "OPTIONS" =>
          RequestBuilder.options()
      }

    requestBuilder
      .setUri(cfg.uri)
      .setCharset(StandardCharsets.UTF_8)

    if (cfg.compressed)
      requestBuilder.setHeader("Accept-Encoding","gzip")
    if (cfg.basicAuth) {
      val cred: Either[String,Result] =
        if (cfg.netRc || cfg.netRcFile.nonEmpty) {
          val host = requestBuilder.getUri.getHost
          if (cfg.verbose)
            logger.info(s"getting credentials for $host from ${cfg.netRcFile}")
          val netRcPath = Paths.get(cfg.netRcFile)

          if (!Files.exists(netRcPath))
            return Result.Failure(s".netrc not found at ${cfg.netRcFile}")
          else if (!Files.isRegularFile(netRcPath))
            return Result.Failure(s".netrc at ${cfg.netRcFile} is not a file")

          val netRcContents = new String(Files.readAllBytes(netRcPath), StandardCharsets.UTF_8)
          NetRc.getCredentials(netRcContents, host) match {
            case Some((u,p)) =>
              if (cfg.verbose)
                logger.info(s"loaded credentials from .netrc")
              Left(BaseEncoding.base64().encode(s"$u:$p".getBytes(StandardCharsets.UTF_8)))
            case None =>
              val msg = s"credentials not found in .netrc file"
              logger.error(s"$msg\n$netRcContents")
              Right(Result.Failure(msg))
          }
        } else
          Left(BaseEncoding.base64().encode(cfg.user.getBytes(StandardCharsets.UTF_8)))
      cred match {
        case Left(value) =>
          requestBuilder.setHeader("Authorization", s"Basic $cred")
        case Right(result) =>
          logger.error(result.message)
          return result
      }
    } else if (cfg.oauth2BearerToken.nonEmpty)
      requestBuilder.setHeader("Authorization", s"Bearer ${cfg.oauth2BearerToken}")

    if (cfg.data.nonEmpty)
      requestBuilder.setEntity(new StringEntity(cfg.data, ContentType.APPLICATION_JSON))

    for (h <- cfg.header) {
      h.split(": ").toSeq match {
        case Seq(k,v) => requestBuilder.setHeader(k,v)
        case _ =>
      }
    }

    if (cfg.contentType.nonEmpty)
      requestBuilder.setHeader("Content-Type", cfg.contentType)

    if (cfg.referer.nonEmpty)
      requestBuilder.setHeader("Referer", cfg.referer)

    if (cfg.userAgent.nonEmpty)
      requestBuilder.setHeader("User-Agent", cfg.userAgent)

    if (cfg.range.nonEmpty) {
      val ranges = cfg.range.map { r => s"${r._1}-${r._2}" }.mkString(", ")
      requestBuilder.setHeader("Range", s"bytes=${ranges}")
    }

    if (cfg.connectTimeout > 0)
      requestBuilder.setConfig(RequestConfig.copy(requestBuilder.getConfig).setConnectTimeout(cfg.connectTimeout).build())

    if (cfg.cookie.nonEmpty)
      requestBuilder.setHeader("Cookie", cfg.cookie)

    val httpClient: HttpClient = CCATransportFactory.newDefaultHttpClient(Option(cfg.caCert).filter(_.nonEmpty))

    val httpUriRequest: HttpUriRequest = requestBuilder.build()
    if (cfg.verbose)
      logger.info(s"${httpUriRequest.getMethod} ${httpUriRequest.getURI}")

    val response: HttpResponse = httpClient.execute(httpUriRequest)

    val statusCode = response.getStatusLine.getStatusCode
    if (statusCode >= 200 && statusCode < 300) {
      if (!cfg.silent){
        val sb = new StringBuilder()
        sb.append(s"response: \nstatus code $statusCode\nlength = ${response.getEntity.getContentLength}\n")
        if (cfg.verbose) {
          val buf = CharBuffer.allocate(8000)
          new InputStreamReader(response.getEntity.getContent, StandardCharsets.UTF_8).read(buf)
          buf.flip()
          sb.append(buf.toString)
          if (response.getEntity.getContentLength > 8000)
            sb.append(s"\n... (response truncated)")
        }
        logger.info(sb.result())
      }
      Result.Success
    } else {
      val msg = s"server returned status code $statusCode"
      if (!cfg.fail) {
        logger.error(msg)
        if (cfg.verbose) {
          val buf = CharBuffer.allocate(8000)
          new InputStreamReader(response.getEntity.getContent, StandardCharsets.UTF_8).read(buf)
          buf.flip()
          val sb = new StringBuilder()
          sb.append(buf.toString)
          if (response.getEntity.getContentLength > 8000)
            sb.append(s"\n... (response truncated)")
          logger.info(sb.result())
        }
      }
      Result.Failure(msg)
    }
  }
}
