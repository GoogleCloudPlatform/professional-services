package com.google.cloud.imf.util

import java.io.OutputStream
import java.net.{HttpURLConnection, URL, URLEncoder}
import java.nio.charset.StandardCharsets

import com.google.auth.oauth2.AccessToken
import javax.net.ssl.HttpsURLConnection

class StorageObjectOutputStream(accessToken: AccessToken,
                                bucket: String,
                                name: String,
                                mimeType: String = "application/octet-stream",
                                print: Boolean = false) extends OutputStream {
  val url = new URL("https://storage.googleapis.com/upload/storage/v1/" +
    s"b/$bucket/o?uploadType=media&name=${URLEncoder.encode(name, "UTF-8")}")
  private val conn = {
    val c: HttpURLConnection =
      url.openConnection().asInstanceOf[HttpURLConnection]
    c.setRequestMethod("POST")
    c.setRequestProperty("Authorization", s"Bearer ${accessToken.getTokenValue}")
    c.setRequestProperty("content-type", mimeType)
    c.setUseCaches(false)
    c.setDoOutput(true)

    c match {
      case x: HttpsURLConnection =>
        x.setSSLSocketFactory(CCASSLSocketFactory)
      case _ =>
    }
    c
  }
  private val os = conn.getOutputStream
  private var count: Long = 0
  def getCount: Long = count

  override def write(b: Int): Unit = {
    os.write(b)
    count += 1
  }

  override def write(b: Array[Byte]): Unit = {
    os.write(b)
    count += b.length
  }

  override def write(b: Array[Byte], off: Int, len: Int): Unit = {
    os.write(b, off, len)
    count += len
  }

  override def flush(): Unit = os.flush()

  override def close(): Unit = {
    val is = conn.getInputStream
    val s = new InputStreamByteSource(is).asCharSource(StandardCharsets.UTF_8).read()
    is.close()
    val rc = conn.getResponseCode
    os.close()
    conn.disconnect()
    if (print){
      System.out.println(s"storage.googleapis.com returned $rc for $url\n$s")
    }
    if (rc != 200){
      val msg = s"storage.googleapis.com returned $rc\n$s"
      throw new RuntimeException(msg)
    }
  }
}
