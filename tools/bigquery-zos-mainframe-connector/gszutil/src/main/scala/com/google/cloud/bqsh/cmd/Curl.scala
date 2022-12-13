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
import org.apache.http.client.config.RequestConfig
import org.apache.http.client.methods.RequestBuilder
import org.apache.http.entity.{ContentType, StringEntity}

import java.nio.charset.StandardCharsets
import scala.collection.mutable

/** curl command
  * sends http requests
  */
object Curl extends Command[CurlConfig] with Logging {
  override val name: String = "curl"
  override val parser: ArgParser[CurlConfig] = CurlOptionParser

  override def run(cfg: CurlConfig, zos: MVS, env: Map[String, String]): Result = {
    val creds = zos.getCredentialProvider().getCredentials
    val httpClient = CCATransportFactory.newDefaultHttpClient
    val request =
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
        case _ =>
          RequestBuilder.post()
      }

    request
      .setUri(cfg.url)
      .setCharset(StandardCharsets.UTF_8)

    if (cfg.compressed)
      request.setHeader("Accept-Encoding","gzip,deflate")
    if (cfg.basicAuth) {
      val cred = BaseEncoding.base64().encode(cfg.user.getBytes(StandardCharsets.UTF_8))
      request.setHeader("Authorization", s"Basic $cred")
    } else if (cfg.oauth2BearerToken.nonEmpty)
      request.setHeader("Authorization", s"Bearer ${cfg.oauth2BearerToken}")

    if (cfg.data.nonEmpty)
      request.setEntity(new StringEntity(cfg.data, ContentType.APPLICATION_JSON))

    for (h <- cfg.header) {
      h.split(": ").toSeq match {
        case Seq(k,v) => request.setHeader(k,v)
        case _ =>
      }
    }

    if (cfg.referer.nonEmpty)
      request.setHeader("Referer", cfg.referer)

    if (cfg.userAgent.nonEmpty)
      request.setHeader("User-Agent", cfg.userAgent)

    if (cfg.range.nonEmpty) {
      val ranges = cfg.range.map { r => s"${r._1}-${r._2}" }.mkString(", ")
      request.setHeader("Range", s"bytes=${ranges}")
    }

    if (cfg.connectTimeout > 0)
      request.setConfig(RequestConfig.copy(request.getConfig).setConnectTimeout(cfg.connectTimeout).build())

    if (cfg.cookie.nonEmpty)
      request.setHeader("Cookie", cfg.cookie)

    val response = {
      val r = request.build()
      if (cfg.verbose) {
        logger.debug(s"${r.getMethod} ${r.getURI}")
      }
      httpClient.execute(r)
    }

    val statusCode = response.getStatusLine.getStatusCode
    if (statusCode >= 200 && statusCode < 300) {
      if (cfg.verbose || !cfg.silent){
        response.getEntity.getContentLength match {
          case x if cfg.verbose || x <= 8000 =>
            val a = new Array[Byte](x.toInt)
            response.getEntity.getContent.read(a)
            val sb = new StringBuilder()
            sb.append(s"response: status code $statusCode\n")
            sb.append(new String(a, StandardCharsets.UTF_8))
            logger.info(sb.result())
          case x =>
            val a = new Array[Byte](8000)
            response.getEntity.getContent.read(a)
            val sb = new StringBuilder()
            sb.append(s"response: status code $statusCode\n")
            sb.append(new String(a, StandardCharsets.UTF_8))
            sb.append(s"\n... (response truncated, total length = $x)")
            logger.info(sb.result())
        }
      }
      Result.Success
    } else
      Result.Failure(s"server returned status code $statusCode")
  }
}
