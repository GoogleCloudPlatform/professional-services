package com.google.cloud.imf.util

import java.net.{InetAddress, ServerSocket}
import java.security.cert.X509Certificate
import java.security.spec.RSAKeyGenParameterSpec
import java.security.{KeyPair, KeyPairGenerator, SecureRandom}

import javax.net.ssl.{KeyManager, SSLContext, SSLServerSocket, SSLSocketFactory, TrustManager, X509KeyManager}

object TLSUtil extends Logging {
  def printChain(chain: Array[X509Certificate]): Unit = {
    val msgs = chain.map{c =>
        s"""${c.getSigAlgName} X.509 Certificate ${c.getVersion} ${c.getSerialNumber}
         | Subject ${c.getSubjectDN.getName}
         | Issuer ${c.getIssuerDN.getName}
         | Valid ${c.getNotBefore} to ${c.getNotAfter}""".stripMargin
    }
    logger.info(msgs.mkString("Certificate Chain\n","\n","\n"))
  }

  def tlsSocket(crt: String, pem: String, host: String, port: Int, backlog: Int): ServerSocket =
    tlsSocket(SecurityUtils.getKeyManager(crt, pem), host, port, backlog)

  def tlsSocket(keyManager: X509KeyManager, host: String, port: Int, backlog: Int): ServerSocket = {
    val ctx = SSLContext.getInstance("TLSv1.2")
    ctx.init(Array[KeyManager](keyManager), Array[TrustManager](new TrustAllX509TrustManager), new SecureRandom())
    val s = ctx.getServerSocketFactory.createServerSocket(port, backlog, InetAddress.getByName(host))
    s.asInstanceOf[SSLServerSocket].setEnabledCipherSuites(CCASSLSocketFactory.Ciphers)
    s
  }

  def genKey: KeyPair = {
    val g = KeyPairGenerator.getInstance("RSA")
    g.initialize(new RSAKeyGenParameterSpec(2048, RSAKeyGenParameterSpec.F4))
    g.generateKeyPair
  }

  private var sslSocketFactory: SSLSocketFactory = _

  def getDefaultSSLSocketFactory: SSLSocketFactory = {
    if (sslSocketFactory == null) {
      sslSocketFactory = getSocketFactory
      logger.debug(s"initialized socket factory ${sslSocketFactory.getClass.getCanonicalName}")
    }
    sslSocketFactory
  }

  private def getSocketFactory: SSLSocketFactory = {
    val ctx = SSLContext.getInstance("TLSv1.2")
    ctx.init(null, Array[TrustManager](new TrustAllX509TrustManager), new SecureRandom)
    ctx.getSocketFactory
  }
}
