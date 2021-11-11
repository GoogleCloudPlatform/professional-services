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

import java.net.{InetAddress, Socket}
import java.security.SecureRandom

import com.google.api.client.googleapis.GoogleUtils
import com.google.api.client.util.SslUtils
import com.google.cloud.gszutil.Util.Logging
import javax.net.ssl.{SSLContext, SSLSocket, SSLSocketFactory}

object CCASSLSocketFactory {
  final val TLS_1_2 = "TLSv1.2"
  final val Protocols = Array(TLS_1_2)
  final val Ciphers = Array("TLS_RSA_WITH_AES_128_CBC_SHA")
  final val Cipher2 = Array("TLS_RSA_WITH_AES_256_CBC_SHA")
  final val Cipher3 = Array("TLS_RSA_WITH_AES_128_GCM_SHA256")
  final val Cipher4 = Array("TLS_RSA_WITH_AES_256_GCM_SHA384")
}

/** This SSLSocketFactory implementation is necessary to
  * disable ECDHE ciphers which are not supported by
  * IBM Crypto Cards.
  */
class CCASSLSocketFactory extends SSLSocketFactory with Logging {
  import CCASSLSocketFactory._

  private val factory: SSLSocketFactory = {
    val ciphers: String = Ciphers.mkString(",")
    System.setProperty("jdk.tls.client.cipherSuites", ciphers)
    System.setProperty("https.cipherSuites", ciphers)
    System.setProperty("jdk.tls.client.protocols" , TLS_1_2)
    System.setProperty("https.protocols" , TLS_1_2)
    val ctx = SSLContext.getInstance(TLS_1_2)
    val tmf = SslUtils.getPkixTrustManagerFactory
    tmf.init(GoogleUtils.getCertificateTrustStore)
    val secureRandom = new SecureRandom()
    logger.debug(s"Initialized SSLSocketFactory with SecureRandom algorithm ${secureRandom.getAlgorithm} from provider ${secureRandom.getProvider.getName}")
    ctx.init(null, tmf.getTrustManagers, secureRandom)
    ctx.getSocketFactory
  }

  override def getDefaultCipherSuites: Array[String] = throw new UnsupportedOperationException

  override def getSupportedCipherSuites: Array[String] = throw new UnsupportedOperationException

  override def createSocket(socket: Socket, host: String, port: Int, autoClose: Boolean): Socket = {
    val s = factory.createSocket(socket, host, port, autoClose)
    s match {
      case x: SSLSocket =>
        x.setTcpNoDelay(true)
        x.setKeepAlive(true)
        x.setReceiveBufferSize(2 * 1024 * 1024)
        x.setSendBufferSize(2 * 1024 * 1024)
        x.setEnabledCipherSuites(Ciphers)
        x.setEnabledProtocols(Protocols)
        logger.debug("created " + x.getClass.getCanonicalName + " with Protocols: " + x.getEnabledProtocols.mkString(",") + " Cipher Suites: "+x.getEnabledCipherSuites.mkString(",") + " Send Buffer: " + x.getSendBufferSize + " Receive Buffer: " + x.getReceiveBufferSize + " local address: " + x.getLocalAddress + ":" + x.getLocalPort)
      case x =>
        logger.warn(s"${x.getClass.getCanonicalName} is not an instance of SSLSocket ")
    }
    s
  }

  override def createSocket(host: String, port: Int): Socket = throw new UnsupportedOperationException

  override def createSocket(host: String, port: Int, localAddress: InetAddress, localPort: Int): Socket = throw new UnsupportedOperationException

  override def createSocket(address: InetAddress, port: Int): Socket = throw new UnsupportedOperationException

  override def createSocket(inetAddress: InetAddress, port: Int, localAddress: InetAddress, localPort: Int): Socket = throw new UnsupportedOperationException
}
