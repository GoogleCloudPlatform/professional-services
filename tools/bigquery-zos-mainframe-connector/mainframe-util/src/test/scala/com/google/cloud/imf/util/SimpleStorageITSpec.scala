package com.google.cloud.imf.util

import java.util.zip.GZIPOutputStream

import com.google.auth.oauth2.AccessToken
import org.scalatest.flatspec.AnyFlatSpec

import scala.util.Random

class SimpleStorageITSpec extends AnyFlatSpec {
  lazy val token: AccessToken = Services.storageCredentials().refreshAccessToken()
  def bucket: String = sys.env("BUCKET")
  def obj: String = sys.env("OBJ")

  "gcs" should "post" in {
    val os = new StorageObjectOutputStream(token, bucket, obj, print = true)
    val gzos = new GZIPOutputStream(os,32*1024, true)

    val n = 256*1024
    val buf = new Array[Byte](n)

    var m: Long = 0
    val rng = new Random()
    val limit = n*2
    while (m <= limit){
      rng.nextBytes(buf)
      gzos.write(buf, 0, n)
      m += n
    }
    gzos.close()
  }

  it should "get" in {
    val is = new StorageObjectInputStream(token, bucket, obj, print = true)
    val bytes = new InputStreamByteSource(is).read()
    System.out.println(s"${bytes.length}")
  }
}
