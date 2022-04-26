package com.google.cloud.imf

import java.io.ByteArrayInputStream
import java.nio.file.{Files, Path, Paths}

import com.google.api.services.storage.StorageScopes
import com.google.auth.oauth2.GoogleCredentials
import com.google.cloud.imf.util.{PageIterator, Services}
import com.google.cloud.storage.Storage.BlobListOption
import com.google.cloud.storage.{Blob, BlobId}

import scala.collection.mutable.ListBuffer

object Update {
  def main(args: Array[String]): Unit = {
    requireEnv("BUCKET","APPDIR")

    val bucket = sys.env("BUCKET")
    val appDir = sys.env("APPDIR")

    val baseDir = Paths.get(appDir)
    require(Files.isDirectory(baseDir), "APPDIR must be a directory")

    val creds = if (sys.env.contains("GOOGLE_APPLICATION_CREDENTIALS") ||
      sys.env.contains("KEYFILE")) {
      val keyfile = sys.env.getOrElse("GOOGLE_APPLICATION_CREDENTIALS", sys.env("KEYFILE"))
      val keyfileBytes = Files.readAllBytes(Paths.get(keyfile))
      GoogleCredentials.fromStream(new ByteArrayInputStream(keyfileBytes))
        .createScoped(StorageScopes.DEVSTORAGE_READ_ONLY)
    } else {
      GoogleCredentials.getApplicationDefault().createScoped(StorageScopes.DEVSTORAGE_READ_ONLY)
    }

    val gcs = Services.storage(creds)

    val prefixes = sys.env.get("PREFIX").map(_.split(',').toSeq).getOrElse(Seq(
      "mainframe-connector",
      "mainframe-interpreter",
      "mainframe-util",
      "sql-parser"
    ))

    for (prefix <- prefixes) {
      val jars = new PageIterator[Blob](gcs.list(bucket, BlobListOption.prefix(prefix)))
        .filter(_.getName.toLowerCase.endsWith(".jar")).map(_.getName).toArray
      if (jars.nonEmpty) {
        scala.util.Sorting.quickSort(jars)
        val jar = jars.last
        System.out.println(s"latest: $jar")
        val blob = gcs.get(BlobId.of(bucket, jar))
        if (blob != null) {
          val jarName = jar.lastIndexOf('/') match {
            case x if x == -1 => jar
            case x => jar.substring(x)
          }
          val jarPath = Paths.get(appDir, jarName)

          val localJars = ls(baseDir, prefix)
          val localJarSet = localJars.map(_.getFileName.toString).toSet
          if (localJarSet.contains(jarName)){
            System.out.println(s"no need to update")
          } else {
            System.out.println(s"downloading $jar -> $jarPath")
            blob.downloadTo(jarPath)
            System.out.println(s"done.")
            localJars.foreach{path =>
              System.out.println(s"deleting $path")
              Files.delete(path)
            }
          }
        }
      }
    }
  }

  def ls(baseDir: Path, prefix: String): Seq[Path] = {
    val buf = ListBuffer.empty[Path]
    Files.walk(baseDir).forEach{path =>
      if (Files.isRegularFile(path) && path.getFileName.toString.startsWith(prefix)) {
        buf.append(path)
      }
    }
    buf.toList
  }

  def requireEnv(varNames: String*): Unit = {
    val notSet = varNames.filterNot(sys.env.contains)
    for (varName <- notSet){
      System.err.println(s"$varName environment variable must be set")
    }
    if (notSet.nonEmpty)
      System.exit(1)
  }
}
