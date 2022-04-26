package com.google.cloud.bqsh

import com.google.cloud.gszutil.io.exports.StorageFileCompose
import com.google.cloud.imf.util.Services
import com.google.cloud.storage.{BlobId, BlobInfo, Storage}
import org.scalatest.BeforeAndAfterEach
import org.scalatest.flatspec.AnyFlatSpec

import java.net.URI

class StorageFileCombinerITSpec extends AnyFlatSpec with BeforeAndAfterEach {

  val TestBucket = sys.env("BUCKET")

  val TargetUrl = s"gs://$TestBucket/TEST"
  val SourceUrl = s"$TargetUrl/tmp"

  val targetUri = new URI(TargetUrl)
  val sourceUri = new URI(SourceUrl)

  val gcs = Services.storage()
  val service = new StorageFileCompose(gcs)

  override protected def beforeEach(): Unit = {
    import scala.jdk.CollectionConverters._
    gcs.list(sourceUri.getAuthority, Storage.BlobListOption.prefix(sourceUri.getPath.stripPrefix("/")))
      .iterateAll.asScala.map(s => s.delete())
    gcs.delete(BlobId.of(targetUri.getAuthority, targetUri.getPath.stripPrefix("/")))
  }

  "GCS file combiner" should "should create empty file if source folder is empty" in {
    val combined = service.composeAll(TargetUrl, SourceUrl)
    assert(combined != null)
    val targetBlob = gcs.get(BlobId.of(targetUri.getAuthority, targetUri.getPath.stripPrefix("/")))
    assert(targetBlob != null)
  }

  "GCS file combiner" should "merge all files in folder" in {
    val sources = Seq(createBlob(blobId(1), "Hello "), createBlob(blobId(2), "World"))
    val combined = service.composeAll(TargetUrl, SourceUrl)

    assert(new String(combined.getContent()) == "Hello World")
    sources.map(s => assert(s.exists()))
  }

  "GCS file combiner" should "merge all files in one partition" in {
    val sources = (0 until 32).map(i => createBlob(blobId(i), s"$i"))
    val combined = service.composeAll(TargetUrl, SourceUrl)

    val expected = (0 until 32).mkString
    val content = new String(combined.getContent())
    assert(content.toSeq.sorted == expected.toSeq.sorted)
    sources.map(s => assert(s.exists()))
  }

  "GCS file combiner" should "merge all files in two partitions" in {
    val sources = (0 until 33).map(i => createBlob(blobId(i), s"$i"))
    val combined = service.composeAll(TargetUrl, SourceUrl)

    val expected = (0 until 33).mkString
    val content = new String(combined.getContent())
    assert(content.toSeq.sorted == expected.toSeq.sorted)
    sources.map(s => assert(s.exists()))
  }

  //slow test, needs to make sure that combiner works if partitions more then 32
  "GCS file combiner" should "merge all files in 33 partitions" in {
    val files = 32 * 32 + 1
    (0 until files).map(i => createBlob(blobId(i), s"$i"))
    val combined = service.composeAll(TargetUrl, SourceUrl)

    val expected = (0 until files).mkString
    val content = new String(combined.getContent())
    assert(content.toSeq.sorted == expected.toSeq.sorted)
  }

  private def blobId(i: Int): BlobId =
    BlobId.of(sourceUri.getAuthority, sourceUri.getPath.stripPrefix("/").concat(s"/$i"))

  private def createBlob(blobId: BlobId, content: String) = {
    val blobInfo = BlobInfo.newBuilder(blobId).setContentType("text/plain").build()
    gcs.create(blobInfo, content.getBytes("UTF-8"))
  }
}
