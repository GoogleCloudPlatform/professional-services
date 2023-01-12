package com.google.cloud.imf.util

import com.google.api.client.util.{PemReader, SslUtils}
import org.apache.http.conn.ssl.{DefaultHostnameVerifier, SSLConnectionSocketFactory}

import java.io.{ByteArrayInputStream, StringReader}
import java.nio.charset.StandardCharsets
import java.nio.file.{Files, Path, Paths}
import java.security.cert.{CertificateFactory, X509Certificate}
import java.security.{KeyStore, SecureRandom}
import javax.net.ssl.{SSLContext, SSLSocketFactory, TrustManagerFactory}
import scala.collection.mutable.ArrayBuffer


/** Disables ciphers not supported by IBM Crypto Cards
 *  trust store is loaded from google.p12 in google-api-client
 */
object CCASSLSocketFactory {

  /** Creates an SSLConnectionSocketFactory with optional cacerts file
   *  Google trust store is loaded automatically.
   *  User CA certs are read from the filesystem at the specified path.
   *
   * @param optionalCaCertsPath optional path to PEM file containing CA certs
   * @return SSLConnectionSocketFactory
   */
  def create(optionalCaCertsPath: Option[String] = None): SSLConnectionSocketFactory =
    new SSLConnectionSocketFactory(factory(optionalCaCertsPath, Protocols, Ciphers), Protocols, Ciphers, new DefaultHostnameVerifier)

  final val TLS_1_2 = "TLSv1.2"
  final val Protocols = Array(TLS_1_2)
  final val Ciphers = Array(
    "TLS_RSA_WITH_AES_128_CBC_SHA", // No Forward Secrecy, but implemented in hardware
    "TLS_ECDHE_ECDSA_WITH_AES_128_GCM_SHA256" // Forward Secrecy, preferred TLSv1.2 cipher
  )

  /** Loads trust store containing Google and user CA certs
   * Google trust store is loaded from pkcs12 file included in
   * google-api-client jar while user CA certs are loaded from
   * PEM file from the filesystem.
   *
   * @param optionalCaCertsPath optional path to cacerts file
   * @return initialized KeyStore
   */
  def getCertificateTrustStore(optionalCaCertsPath: Option[String] = None): KeyStore = {
    val certTrustStore: KeyStore = com.google.api.client.googleapis.GoogleUtils.getCertificateTrustStore()
    optionalCaCertsPath.map(Paths.get(_))
      .filter(Files.exists(_))
      .filter(Files.isRegularFile(_))
      .foreach { caCertsPath =>
        for ((cert, id) <- readCertificates(caCertsPath).zipWithIndex)
          certTrustStore.setCertificateEntry(s"cacert_$id", cert)
      }
    certTrustStore
  }

  /** Reads base64 encoded X509 certificates from a file
   *
   * @param path path to pem file
   * @return Array[X509Certificate]
   */
  def readCertificates(path: Path): Array[X509Certificate] =
    readCertificates(new String(Files.readAllBytes(path), StandardCharsets.UTF_8))

  /** Reads base64 encoded X509 certificates from a PEM-formatted string
   *
   * @param pem PEM formatted string
   * @return Array[X509Certificate]
   */
  def readCertificates(pem: String): Array[X509Certificate] = {
    val BeginCertificate = "-----BEGIN CERTIFICATE-----"
    val buf = ArrayBuffer.empty[X509Certificate]
    var i = pem.indexOf(BeginCertificate)
    while (i >= 0) {
      val bytes = PemReader.readFirstSectionAndClose(new StringReader(pem.substring(i)),
        "CERTIFICATE").getBase64DecodedBytes
      val cert = CertificateFactory.getInstance("X.509")
        .generateCertificate(new ByteArrayInputStream(bytes))
        .asInstanceOf[X509Certificate]
      buf.append(cert)
      i = pem.indexOf(BeginCertificate, i + 1)
    }
    buf.toArray
  }

  /** Creates a SSLSocketFactory with optional cacerts, protocols and ciphers
   *
   * @param optionalCaCertsPath optional path to PEM formatted cacerts file
   * @param protocols Array[String]
   * @param ciphers Array[String]
   * @return SSLSocketFactory
   */
  def factory(optionalCaCertsPath: Option[String] = None,
              protocols: Array[String] = Protocols,
              ciphers: Array[String] = Ciphers): SSLSocketFactory = {
    val cipher: String = ciphers.mkString(",")
    val protocol: String = protocols.mkString(",")
    System.setProperty("jdk.tls.client.cipherSuites", cipher)
    System.setProperty("https.cipherSuites", cipher)
    System.setProperty("jdk.tls.client.protocols" , protocol)
    System.setProperty("https.protocols" , protocol)
    val ctx: SSLContext = SSLContext.getInstance(protocol)
    val tmf: TrustManagerFactory = SslUtils.getPkixTrustManagerFactory()
    tmf.init(getCertificateTrustStore(optionalCaCertsPath))
    ctx.init(null, tmf.getTrustManagers, new SecureRandom())
    ctx.getSocketFactory()
  }
}