package com.google.cloud.imf.util

import java.io.InputStream
import java.net.{HttpURLConnection, URL, URLEncoder}

import com.google.auth.oauth2.AccessToken
import javax.net.ssl.HttpsURLConnection

class StorageObjectInputStream(accessToken: AccessToken,
                               bucket: String,
                               name: String,
                               print: Boolean = false) extends InputStream {
  val url = new URL("https://storage.googleapis.com/storage/v1/" +
    s"b/$bucket/o/${URLEncoder.encode(name, "UTF-8")}?alt=media")
  private val conn = {
    val c: HttpURLConnection =
      url.openConnection().asInstanceOf[HttpURLConnection]
    c.setRequestMethod("GET")
    c.setRequestProperty("Authorization", s"Bearer ${accessToken.getTokenValue}")
    c.setUseCaches(false)

    c match {
      case x: HttpsURLConnection =>
        x.setSSLSocketFactory(CCASSLSocketFactory)
      case _ =>
    }
    c
  }
  private val is = {
    val is = conn.getInputStream
    if (print) {
      val rc = conn.getResponseCode
      System.out.println(s"storage.googleapis.com returned $rc for $url")
    }
    is
  }

  override def read(): Int = is.read()
  override def read(b: Array[Byte]): Int = is.read(b)
  override def read(b: Array[Byte], off: Int, len: Int): Int = is.read(b, off, len)
  override def skip(n: Long): Long = is.skip(n)
  override def available(): Int = is.available()
  override def close(): Unit = {
    val rc = conn.getResponseCode
    is.close()
    conn.disconnect()
    if (rc != 200){
      throw new RuntimeException(s"storage.googleapis.com returned $rc")
    }
  }
  override def mark(readlimit: Int): Unit = is.mark(readlimit)
  override def reset(): Unit = is.reset()
  override def markSupported(): Boolean = is.markSupported()
}
