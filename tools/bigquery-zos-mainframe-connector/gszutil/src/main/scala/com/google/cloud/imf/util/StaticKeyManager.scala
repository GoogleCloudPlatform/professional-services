package com.google.cloud.imf.util

import java.net.Socket
import java.security.cert.X509Certificate
import java.security.{Principal, PrivateKey}

import javax.net.ssl.X509KeyManager

class StaticKeyManager(private val keyCertChain: Array[X509Certificate],
                       private val key: PrivateKey) extends X509KeyManager{
  val Client = "client"
  val Server = "server"
  override def getClientAliases(var1: String, var2: Array[Principal]): Array[String] = Array(Client)
  override def chooseClientAlias(var1: Array[String], var2: Array[Principal], var3: Socket): String = Client
  override def getServerAliases(var1: String, var2: Array[Principal]): Array[String] = Array(Server)
  override def chooseServerAlias(var1: String, var2: Array[Principal], var3: Socket): String = Server
  override def getCertificateChain(var1: String): Array[X509Certificate] = keyCertChain
  override def getPrivateKey(s: String): PrivateKey = key
}
