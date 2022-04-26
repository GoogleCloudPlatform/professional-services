package com.google.cloud.imf.util

import java.io.{ByteArrayInputStream, StringReader}
import java.nio.charset.StandardCharsets
import java.nio.file.{Files, Path, Paths}
import java.security.cert.{CertificateFactory, X509Certificate}
import java.security.interfaces.RSAPrivateCrtKey
import java.security.spec.{PKCS8EncodedKeySpec, RSAPublicKeySpec, X509EncodedKeySpec}
import java.security.{KeyFactory, KeyPair, PrivateKey, Provider, PublicKey, Security, Signature, SignatureException}

import com.google.api.client.json.jackson2.JacksonFactory
import com.google.api.client.json.{GenericJson, JsonObjectParser}
import com.google.api.client.util.PemReader
import com.google.cloud.imf.gzos.Util
import com.google.common.hash.Hashing
import sun.security.jca.GetInstance

import scala.collection.mutable.ArrayBuffer

object SecurityUtils {
  def printProvider(x: Provider.Service): String =
    x.getProvider.getName + "\t" + x.getType + "\t" + x.getAlgorithm + "\t" + x.getClassName

  def printProviders(): Unit = {
    val sb = new StringBuilder
    sb.append("JCE Provider Services\n")
    import scala.jdk.CollectionConverters.ListHasAsScala
    sb.append(GetInstance.getServices("Signature", "SHA256withRSA").asScala.map(printProvider).mkString("\n"))
    sb.append("\n")
    sb.append(GetInstance.getServices("KeyFactory", "RSA").asScala.map(printProvider).mkString("\n"))
    sb.append("\n")
    sb.append(GetInstance.getServices("KeyPairGenerator", "RSA").asScala.map(printProvider).mkString("\n"))
    Console.out.println(sb.result)
  }

  def useConscrypt(): Unit = {
    if (!Util.isIbm && !(Security.getProviders.apply(0).getName == "Conscrypt"))
      try {
        Security.insertProviderAt(Security.getProvider("Conscrypt"), 1)
        System.out.println("using Conscrypt Security Provider")
      } catch {
        case e: Throwable =>
          System.err.println(s"unable to install Conscrypt Security Provider")
      }
  }

  val SHA256withRSA = Signature.getInstance("SHA256withRSA")
  val RSA: KeyFactory =
    if (Util.isIbm) KeyFactory.getInstance("RSA", "IBMJCE")
    else KeyFactory.getInstance("RSA")

  def sign(privateKey: PrivateKey, contentBytes: Array[Byte]): Array[Byte] = {
    SHA256withRSA.initSign(privateKey)
    SHA256withRSA.update(contentBytes)
    SHA256withRSA.sign
  }

  def hashKey(publicKey: PublicKey): String =
    Hashing.sha256().hashBytes(publicKey.getEncoded).toString

  def verify(publicKey: PublicKey, signatureBytes: Array[Byte], contentBytes: Array[Byte]): Boolean = {
    SHA256withRSA.initVerify(publicKey)
    SHA256withRSA.update(contentBytes)
    try SHA256withRSA.verify(signatureBytes)
    catch {case _: SignatureException => false}
  }

  def publicKey(privateKey: PrivateKey): PublicKey =
    publicKey(privateKey.asInstanceOf[RSAPrivateCrtKey])

  // does not work on IBM hardware JCE
  def publicKey(privateKey: RSAPrivateCrtKey): PublicKey =
    RSA.generatePublic(new RSAPublicKeySpec(privateKey.getModulus, privateKey.getPublicExponent))

  def publicKey(publicKeyBytes: Array[Byte]): PublicKey =
    RSA.generatePublic(new X509EncodedKeySpec(publicKeyBytes))

  def readServiceAccountKeyPair(jsonKeyfileBytes: Array[Byte]): KeyPair = {
    val jsonFactory = JacksonFactory.getDefaultInstance
    val parser = new JsonObjectParser(jsonFactory)
    val json = parser.parseAndClose(new ByteArrayInputStream(jsonKeyfileBytes),
      StandardCharsets.UTF_8, classOf[GenericJson])
    val fileType = json.get("type").asInstanceOf[String]
    require(fileType == "service_account", s"type must be service_account (actual: '$fileType')")
    val bytes = Option(PemReader.readFirstSectionAndClose(
      new StringReader(json.get("private_key").asInstanceOf[String]),
      "PRIVATE KEY"))
      .map(_.getBase64DecodedBytes)
      .getOrElse(Array.empty)
    val privateKey = RSA.generatePrivate(new PKCS8EncodedKeySpec(bytes))
    new KeyPair(publicKey(privateKey), privateKey)
  }

  def readPrivateKey(path: Path): PrivateKey =
    readPrivateKey(new String(Files.readAllBytes(path),StandardCharsets.UTF_8))

  def readPrivateKey(pem: String): PrivateKey = {
    val bytes = PemReader.readFirstSectionAndClose(new StringReader(pem),
      "PRIVATE KEY").getBase64DecodedBytes
    RSA.generatePrivate(new PKCS8EncodedKeySpec(bytes))
  }

  val BeginCertificate = "-----BEGIN CERTIFICATE-----"
  def readCertificates(path: Path): Array[X509Certificate] =
    readCertificates(new String(Files.readAllBytes(path),StandardCharsets.UTF_8))

  def readCertificates(pem: String): Array[X509Certificate] = {
    val buf = ArrayBuffer.empty[X509Certificate]
    var i = pem.indexOf(BeginCertificate)
    while (i >= 0){
      val bytes = PemReader.readFirstSectionAndClose(new StringReader(pem.substring(i)),
        "CERTIFICATE").getBase64DecodedBytes
      val cert = CertificateFactory.getInstance("X.509")
        .generateCertificate(new ByteArrayInputStream(bytes))
        .asInstanceOf[X509Certificate]
      buf.append(cert)
      i = pem.indexOf(BeginCertificate,i+1)
    }
    buf.toArray
  }

  def getKeyManager(chainPath: String, keyPath: String): StaticKeyManager = {
    val chain = SecurityUtils.readCertificates(new String(Files.readAllBytes(Paths.get(chainPath)),
      StandardCharsets.UTF_8))
    val key = SecurityUtils.readPrivateKey(new String(Files.readAllBytes(Paths.get(keyPath)),
      StandardCharsets.UTF_8))
    new StaticKeyManager(chain, key)
  }
}
