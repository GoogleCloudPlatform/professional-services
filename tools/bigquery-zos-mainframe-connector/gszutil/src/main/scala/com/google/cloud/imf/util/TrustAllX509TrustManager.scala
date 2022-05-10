package com.google.cloud.imf.util

import java.security.cert.X509Certificate

import javax.net.ssl.X509TrustManager

class TrustAllX509TrustManager extends X509TrustManager {
  override def checkClientTrusted(x509Certificates: Array[X509Certificate], s: String): Unit = {}
  override def checkServerTrusted(x509Certificates: Array[X509Certificate], s: String): Unit = {}
  override def getAcceptedIssuers: Array[X509Certificate] = Array.empty
}
