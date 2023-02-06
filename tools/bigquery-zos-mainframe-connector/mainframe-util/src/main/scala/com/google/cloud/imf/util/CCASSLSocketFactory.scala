package com.google.cloud.imf.util

import java.net.{InetAddress, Socket}
import java.security.SecureRandom
import com.google.api.client.googleapis.GoogleUtils
import com.google.api.client.util.SslUtils

import javax.net.ssl.{SSLContext, SSLSocket, SSLSocketFactory}
import org.apache.http.conn.ssl.{DefaultHostnameVerifier, SSLConnectionSocketFactory}

/** Disables ciphers not supported by IBM Crypto Cards
 *  trust store is loaded from google.p12 in google-api-client
 */
object CCASSLSocketFactory extends SSLSocketFactory {

  def create: SSLConnectionSocketFactory = {
     new SSLConnectionSocketFactory(this,
      Protocols, Ciphers, new DefaultHostnameVerifier)
  }

  final val TLS_1_2 = "TLSv1.2"
  final val Protocols = Array(TLS_1_2)
  final val Ciphers = Array(
    "TLS_RSA_WITH_AES_128_CBC_SHA", // No Forward Secrecy, but implemented in hardware
    "TLS_ECDHE_ECDSA_WITH_AES_128_GCM_SHA256" // Forward Secrecy, preferred TLSv1.2 cipher
  )

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
    ctx.init(null, tmf.getTrustManagers, secureRandom)
    ctx.getSocketFactory
  }

  override def getDefaultCipherSuites: Array[String] = throw new NotImplementedError

  override def getSupportedCipherSuites: Array[String] = throw new NotImplementedError

  override def createSocket(socket: Socket,
                            host: String,
                            port: Int,
                            autoClose: Boolean): Socket = {
    val s = factory.createSocket(socket, host, port, autoClose)
    s match {
      case x: SSLSocket =>
        x.setTcpNoDelay(true)
        x.setKeepAlive(true)
        x.setReceiveBufferSize(2 * 1024 * 1024)
        x.setSendBufferSize(2 * 1024 * 1024)
        x.setEnabledCipherSuites(Ciphers)
        x.setEnabledProtocols(Protocols)
      case x =>
        System.err.println(s"CCASSLSocketFactory: ${x.getClass.getCanonicalName} is not an " +
          s"instance of SSLSocket ")
    }
    s
  }

  override def createSocket(host: String,
                            port: Int): Socket = throw new NotImplementedError

  override def createSocket(host: String,
                            port: Int,
                            localAddress: InetAddress,
                            localPort: Int): Socket = throw new NotImplementedError

  override def createSocket(address: InetAddress,
                            port: Int): Socket = throw new NotImplementedError

  override def createSocket(inetAddress: InetAddress,
                            port: Int,
                            localAddress: InetAddress,
                            localPort: Int): Socket = throw new NotImplementedError
}
