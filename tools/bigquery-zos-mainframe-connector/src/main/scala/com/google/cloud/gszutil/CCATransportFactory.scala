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

package com.google.cloud.gszutil

import java.util.concurrent.TimeUnit

import com.google.api.client.http.HttpTransport
import com.google.api.client.http.apache.v2.ApacheHttpTransport
import com.google.auth.http.HttpTransportFactory
import com.google.cloud.gszutil.Util.Logging
import org.apache.http.HttpHost
import org.apache.http.client.HttpClient
import org.apache.http.config.SocketConfig
import org.apache.http.conn.ssl.SSLConnectionSocketFactory
import org.apache.http.impl.client.HttpClientBuilder
import org.apache.http.impl.conn.DefaultProxyRoutePlanner


object CCATransportFactory extends Logging {
  private val Instance = new ApacheHttpTransport(newDefaultHttpClient)

  def newDefaultHttpClient: HttpClient = {
    val socketConfig = SocketConfig.custom
      .setRcvBufSize(256*1024)
      .setSndBufSize(256*1024)
      .build

    val builder = HttpClientBuilder.create
      .useSystemProperties
      .setSSLSocketFactory(new SSLConnectionSocketFactory(new CCASSLSocketFactory(), CCASSLSocketFactory.Protocols, CCASSLSocketFactory.Ciphers, Option[javax.net.ssl.HostnameVerifier](null).orNull))
      .setDefaultSocketConfig(socketConfig)
      .setMaxConnTotal(40)
      .setMaxConnPerRoute(20)
      .setConnectionTimeToLive(-1, TimeUnit.MILLISECONDS)
      .disableRedirectHandling
      .disableAutomaticRetries

    sys.env.get("https_proxy") match {
      case Some(httpProxy) =>
        logger.info(s"Configuring https_proxy=$httpProxy")
        val proxy = HttpHost.create(httpProxy)
        builder.setRoutePlanner(new DefaultProxyRoutePlanner(proxy))
      case _ =>
    }

    builder.build
  }
}

class CCATransportFactory extends HttpTransportFactory {
  override def create(): HttpTransport = CCATransportFactory.Instance
}
