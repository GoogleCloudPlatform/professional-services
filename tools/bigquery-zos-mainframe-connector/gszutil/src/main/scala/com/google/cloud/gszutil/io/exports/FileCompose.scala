package com.google.cloud.gszutil.io.exports

import com.google.cloud.imf.util.Logging
import com.google.cloud.storage.Storage.ComposeRequest
import com.google.cloud.storage.{Blob, BlobInfo, Storage}

import java.net.URI

trait FileCompose[T, R] {
  def compose(target: T, source: Seq[T]): R

  def composeAll(target: T, sourceDir: T): R
}

class StorageFileCompose(gcs: Storage) extends FileCompose[String, Blob] with Logging {

  import scala.jdk.CollectionConverters._
  val MaxPerRequest = 32
  val PartitionedFolder = "partition"

  override def compose(target: String, source: Seq[String]): Blob = {
    val request = ComposeRequest.newBuilder()
      .addSource(source.asJava)
      .setTarget(blobInfo(new URI(target))).build()
    val res = gcs.compose(request)
    logger.info(s"Files [$source] have been composed into $target.")
    res
  }

  override def composeAll(target: String, sourceDir: String): Blob = {
    val sourceUri = new URI(sourceDir)
    val sourceFiles = gcs.list(sourceUri.getAuthority, Storage.BlobListOption.prefix(sourceUri.getPath.stripPrefix("/")))
      .iterateAll.asScala.toSeq
    val partitioned = sourceFiles.grouped(MaxPerRequest).zipWithIndex.toList

    if(partitioned.isEmpty) {
      logger.warn(s"Folder $sourceDir doesn't contain files, empty file is created $target.")
      createBlob(target)
    } else if(partitioned.size == 1) {
      partitioned.map(p => compose(target, p._1.map(_.getName))).head
    } else {
      val newTargetDir = s"${sourceDir.stripSuffix("/")}/$PartitionedFolder/"
      logger.info(s"Composing of ${partitioned.size} partitions will be performed, total files to be composed ${sourceFiles.size}, targetDir $newTargetDir.")
      partitioned.map(p => compose(s"$newTargetDir${p._2}", p._1.map(_.getName)))
      composeAll(target, newTargetDir)
    }
  }

  private def createBlob(target: String): Blob =
    gcs.create(blobInfo(new URI(target)))

  private def blobInfo(uri: URI): BlobInfo =
    BlobInfo.newBuilder(uri.getAuthority, uri.getPath.stripPrefix("/")).build()
}