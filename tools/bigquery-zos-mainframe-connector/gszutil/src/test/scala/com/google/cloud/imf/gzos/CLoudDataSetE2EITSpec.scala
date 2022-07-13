/*
 * Copyright 2022 Google LLC All Rights Reserved
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

package com.google.cloud.imf.gzos

import com.google.cloud.imf.util.Services
import com.google.cloud.storage.{BlobId, BlobInfo, Storage}
import org.scalatest.BeforeAndAfter
import org.scalatest.flatspec.AnyFlatSpec

import java.net.URI
import scala.util.Try

class CLoudDataSetE2EITSpec extends AnyFlatSpec with BeforeAndAfter {

  val gcs = Services.storage(Services.storageCredentials())

  /*
    This test requires following environment variables:
    - GCSDSNURI=gs://gszutil-test-gdg-standart
    - GCSGDGURI=gs://gszutil-test-gdg
    - GOOGLE_CLOUD_PROJECT=projectId
   */
  val standardBucketUri = sys.env.get("GCSDSNURI").map(new URI(_)).get
  val gdgBucketUri = sys.env.get("GCSGDGURI").map(new URI(_)).get

  //input DSN
  val gdgDsn1 = "N01.R6.US.MDS.TD345.POS.SANARY.G0002V00(-0)"
  val gdgDsn2 = "N01.R6.US.MDS.TD345.POS.SANARY.G0001V00(-1)"
  val gdgBaseDsn = "N01.R6.US.MDS.TD345.POS.SANARY.G0001V00"
  val standardDsn = "N01.R6.US.MDS.TD345.STANDARD"
  val standardPdsDsn = "N01.R6.US.MDS.TD345.STANDARD(TEV001V)"

  //expected GCS objectNames
  val standardBlobName = "N01.R6.US.MDS.TD345.STANDARD"
  val standardBlobPDSName = "N01.R6.US.MDS.TD345.STANDARD/TEV001V"
  val gdgBlobName = "N01.R6.US.MDS.TD345.POS.SANARY"
  val gdgBlobV1 = "N01.R6.US.MDS.TD345.POS.SANARY.G0001V00"
  val gdgBlobV2 = "N01.R6.US.MDS.TD345.POS.SANARY.G0002V00"
  val defaultText = "Hello World!"

  val standardBlobId = BlobId.of(standardBucketUri.getAuthority, standardBlobName)
  val standardPdsBlobId = BlobId.of(standardBucketUri.getAuthority, standardBlobPDSName)
  val gdgBlobId = BlobId.of(gdgBucketUri.getAuthority, gdgBlobName)
  val gdgBlobIdV1 = BlobId.of(gdgBucketUri.getAuthority, gdgBlobV1)
  val gdgBlobIdV2 = BlobId.of(gdgBucketUri.getAuthority, gdgBlobV2)
  val gdgBlobIdInStandardBucket = BlobId.of(standardBucketUri.getAuthority, gdgBlobName)

  before {
    List(standardBlobId, standardPdsBlobId, gdgBlobId, gdgBlobId, gdgBlobIdV1, gdgBlobIdV2)
      .map(b => createBlob(b))
  }

  after {
    removeTestData()
  }

  it should "Standard bucket: throw an error when lrecl is not set in metadata" in {
    createBlob(gdgBlobIdInStandardBucket, lrecl = None)
    val dataSetInfo = DataSetInfo(gdgBaseDsn)
    val result = Try(CloudDataSet.readCloudDD(gcs, "INFILE", dataSetInfo)).toEither
    assert(result.isLeft)
    assert(result.left.get.isInstanceOf[RuntimeException])
  }

  it should "Standard bucket: return cloudReader for object from standard bucket when pds is false" in {
    val dataSetInfo = DataSetInfo(standardDsn)
    val result = CloudDataSet.readCloudDD(gcs, "INFILE", dataSetInfo)

    assert(result.isDefined)
    assert(result.get.name == standardBlobName)
    assert(!result.get.gdg)
    assert(result.get.versions.isEmpty)
    assert(result.get.lRecl == 77)
    assert(result.get.bucket == standardBucketUri.getAuthority)
  }

  it should "Standard bucket: return cloudReader for object when pds is true" in {
    val dataSetInfo = DataSetInfo(standardPdsDsn)
    val result = CloudDataSet.readCloudDD(gcs, "INFILE", dataSetInfo)

    assert(result.isDefined)
    assert(result.get.name == standardBlobPDSName)
    assert(!result.get.gdg)
    assert(result.get.versions.isEmpty)
    assert(result.get.lRecl == 77)
    assert(result.get.bucket == standardBucketUri.getAuthority)
  }

  it should "throw exception when object is in both buckets: standard and GDG" in {
    createBlob(gdgBlobIdInStandardBucket, defaultText)

    val dataSetInfo = DataSetInfo(gdgBaseDsn)
    val result = Try(CloudDataSet.readCloudDD(gcs, "ambiguousDD", dataSetInfo)).toEither
    assert(result.isLeft)
    assert(result.left.get.isInstanceOf[RuntimeException])
  }

  it should "GDG bucket: return cloudReader for object from gdg bucket when version isn't specified (base gdg)" in {
    val dataSetInfo = DataSetInfo(gdgBaseDsn)

    val result = CloudDataSet.readCloudDD(gcs, "INFILE", dataSetInfo)

    assert(result.isDefined)
    assert(result.get.name == gdgBlobName)
    assert(result.get.gdg)
    assert(result.get.versions.size == 3)
    assert(result.get.lRecl == 77)
    assert(result.get.bucket == gdgBucketUri.getAuthority)
  }

  it should "GDG bucket: return cloudReader for object from gdg bucket when version specified (individual gdg)" in {
    val dataSetInfo = DataSetInfo(gdgDsn1)

    val result = CloudDataSet.readCloudDD(gcs, "INFILE", dataSetInfo)

    assert(result.isDefined)
    assert(result.get.name == gdgBlobV2)
    assert(result.get.gdg)
    assert(result.get.versions.size == 1)
    assert(result.get.versions.head.getName == gdgBlobV2)
    assert(result.get.lRecl == 77)
    assert(result.get.bucket == gdgBucketUri.getAuthority)
  }

  it should "GDG bucket: return cloudReader from GDG bucket when object not in GDG format" in {
    val inputDsn = "N01.R6.US.MDS.TD345.STANDARD.INGDG"
    val blobId =  BlobId.of(gdgBucketUri.getAuthority, inputDsn)
    createBlob(blobId, lrecl = Some("33"))
    val dataSetInfo = DataSetInfo(inputDsn)

    val result = CloudDataSet.readCloudDD(gcs, "INFILE", dataSetInfo)
    removeTestData(standardBlobIds = List(), gdgBlobIds = List(blobId))

    assert(result.isDefined)
    assert(result.get.name == inputDsn)
    assert(result.get.gdg)
    assert(result.get.versions.size == 1)
    assert(result.get.lRecl == 33)
    assert(result.get.bucket == gdgBucketUri.getAuthority)
  }

  private def createBlob(blobId: BlobId, content: String = defaultText, lrecl: Option[String] = Some("77")) = {
    import scala.jdk.CollectionConverters._
    val metadata = Map("x-goog-meta-lrecl" -> lrecl)
      .collect {case (k, Some(v)) => k -> v}
    val blobInfo = BlobInfo.newBuilder(blobId)
      .setMetadata(metadata.asJava)
      .setContentType("text/plain").build()
    gcs.create(blobInfo, content.getBytes("UTF-8"))
  }

  private def removeTestData(standardBlobIds: List[BlobId] = List(standardBlobId, standardPdsBlobId, gdgBlobIdInStandardBucket),
                             gdgBlobIds: List[BlobId] = List(gdgBlobId, gdgBlobIdV1, gdgBlobIdV2)): Unit = {
    //clean-up GCS
    import scala.jdk.CollectionConverters.IterableHasAsScala
    // gdg delete,in order to delete all versions we need to pass generationId in delete request
    gdgBlobIds.flatMap{b =>
      gcs.list(gdgBucketUri.getAuthority,
        Storage.BlobListOption.prefix(b.getName),
        Storage.BlobListOption.versions(true))
        .iterateAll.asScala
    }.map(v => gcs.delete(v.getBlobId))

    //standard file delete
    if(standardBlobIds.nonEmpty) gcs.delete(standardBlobIds :_*)
  }
}
