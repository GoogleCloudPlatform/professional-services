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

package com.google.cloud.gszutil.io.exports

import com.google.cloud.bigquery.{JobId, QueryJobConfiguration}
import com.google.cloud.bqsh.{BQ, ExportConfig}
import com.google.cloud.gszutil.{CopyBook, SchemaProvider}
import com.google.cloud.imf.gzos.Linux
import com.google.cloud.imf.util.Services
import com.google.cloud.storage.Storage.ComposeRequest
import com.google.cloud.storage.{BlobId, BlobInfo, Storage}
import org.scalatest.flatspec.AnyFlatSpec

import java.io.{BufferedOutputStream, File, FileOutputStream}
import java.nio.file.{Files, Paths}
import scala.jdk.CollectionConverters.IterableHasAsJava

class BqSelectResultParallelExporterRealBQSpec extends AnyFlatSpec {
  // test was done for debugging of real BQ api with BqSelectResultParallelExporter
  // for performance reasons it is ignored
  ignore should "read in parallel data from BigQuery local export" in {
    //some env variables is required
    assert(sys.env.contains("GCP_PROJECT_ID")) // = boxwood-sector-246122
    assert(sys.env.contains("OUTFILE")) // = OUTFILE
    assert(sys.env.contains("OUTFILE_LRECL")) // = 80
    assert(sys.env.contains("OUTFILE_BLKSIZE")) // = 512

    val zos = Linux
    val projectId = System.getenv().get("GCP_PROJECT_ID")
    val location = "US"
    val defaultRecordLength = 80

    val bigQuery = Services.bigQuery(projectId, location, Services.bigqueryCredentials())

    val jobId = JobId.newBuilder()
      .setProject(projectId)
      .setLocation(location)
      .setRandomJob()
      .build()

    //~160k records
    val jobCfg = QueryJobConfiguration.newBuilder("SELECT word FROM `bigquery-public-data.samples.shakespeare`")
      .setMaxResults(1)
      .setUseLegacySql(false)
      .build()
    val cfg = ExportConfig(
      vartext = false,
      exporterThreadCount = 8
    )

    /*    //~9m records, partitionSize to large value for this
        val jobCfg = QueryJobConfiguration.newBuilder("SELECT image_id FROM `bigquery-public-data.open_images.images`")
          .setMaxResults(1)
          .setUseLegacySql(false)
          .build()

        val cfg = ExportConfig(
          exporterThreadCount = 8
        )*/

    val completedJob = BQ.runJob(
      bigQuery, jobCfg, jobId,
      timeoutSeconds = 10 * 60,
      sync = true)

    val schema: SchemaProvider = CopyBook(
      """ 01  TEST-LAYOUT-FIVE.
        |   02  COL-D   PIC X(50).
        |""".stripMargin)

    def exporterFactory(batchId: String, cfg: ExportConfig): SimpleFileExporter = {
      val result = new LocalFileExporter
      result.newExport(new SimpleFileExport("mt_outfile_" + batchId, defaultRecordLength))
      new SimpleFileExporterAdapter(result, cfg)
    }

    //cleanup
    cleanUpLocalTmpFiles("mt_outfile", "st_outfile", "OUTFILE")

    // local parallel export
    val multiThreadExporter = new BqSelectResultParallelExporter(cfg, bigQuery,
      zos.getInfo, schema, exporterFactory)
    multiThreadExporter.exportData(completedJob)
    multiThreadExporter.close()

    // local single threded export
    val singleThreadExporter = new BqSelectResultExporter(cfg, bigQuery, zos.getInfo, schema,
      new SimpleFileExport("st_outfile_all", defaultRecordLength))
    singleThreadExporter.exportData(completedJob)
    singleThreadExporter.close()


    val chunkNumber = Files.list(Paths.get("./"))
      .map(_.toFile)
      .filter(_.getName.startsWith("mt_outfile_"))
      .count()

    //merge files
    val outFile = new FileOutputStream(new File("mt_outfile_all"))
    for (i <- 0L until chunkNumber) {
      val bytes = Files.readAllBytes(Paths.get("mt_outfile_" + i))
      outFile.write(bytes)
    }
    outFile.close()

    assert(com.google.common.io.Files.equal(new File("mt_outfile_all"), new File("st_outfile_all")))

    cleanUpLocalTmpFiles("mt_outfile", "st_outfile", "OUTFILE")
  }

  // test was done for debugging of real BQ api with BqSelectResultParallelExporter
  // for performance reasons it is ignored
  ignore should "read in parallel data from BigQuery to GCS bucket" in {
    //some env variables should be set
    assert(sys.env.contains("GCP_PROJECT_ID")) // = boxwood-sector-246122
    assert(sys.env.contains("OUTFILE")) // = OUTFILE
    assert(sys.env.contains("OUTFILE_LRECL")) // = 80
    assert(sys.env.contains("OUTFILE_BLKSIZE")) // = 512

    val zos = Linux
    val projectId = System.getenv().get("GCP_PROJECT_ID")
    val location = "US"
    val defaultRecordLength = 80

    val bigQuery = Services.bigQuery(projectId, location, Services.bigqueryCredentials())

    val jobId = JobId.newBuilder()
      .setProject(projectId)
      .setLocation(location)
      .setRandomJob()
      .build()

    //~160k records
    val jobCfg = QueryJobConfiguration.newBuilder("SELECT word FROM `bigquery-public-data.samples.shakespeare`")
      .setMaxResults(1)
      .setUseLegacySql(false)
      .build()
    val cfg = ExportConfig(
      vartext = false,
      exporterThreadCount = 4
    )

    val completedJob = BQ.runJob(
      bigQuery, jobCfg, jobId,
      timeoutSeconds = 10 * 60,
      sync = true)

    val schema: SchemaProvider = CopyBook(
      """ 01  TEST-LAYOUT-FIVE.
        |   02  COL-D   PIC X(50).
        |""".stripMargin)

    var filesToCompose = Seq.empty[String]
    val gcs = Services.storage(Services.storageCredentials())
    val targetFile = BlobId.of("boxwood-sector-246122-test-storage", "EXPORT/r1.on.o1")

    //cleanup
    cleanUpLocalTmpFiles("mt_outfile", "st_outfile", "OUTFILE")
    cleanUpRemoteTmpFiles(gcs, targetFile.getBucket, targetFile.getName)

    def gcsExporterFactory(fileName: String, cfg: ExportConfig): SimpleFileExporter = {
      val result = new LocalFileExporter
      val tmpId = BlobId.of(targetFile.getBucket, targetFile.getName + "_tmp/" + fileName)
      filesToCompose = filesToCompose :+ tmpId.getName
      result.newExport(GcsFileExport(gcs, toStringUrl(tmpId), defaultRecordLength))
      new SimpleFileExporterAdapter(result, cfg)
    }

    // GCS parallel export
    val gcsMultiThreadExporter = new BqSelectResultParallelExporter(cfg, bigQuery,
      zos.getInfo, schema, gcsExporterFactory)
    gcsMultiThreadExporter.exportData(completedJob)
    gcsMultiThreadExporter.close()

    //merge parallel files
    val composeRequest = ComposeRequest.newBuilder()
      .addSource(filesToCompose.asJava)
      .setTarget(BlobInfo.newBuilder(targetFile).build()).build()
    gcs.compose(composeRequest)
    writeBytes(gcs.readAllBytes(targetFile), new File("mt_outfile_all"))


    // local single threaded export
    val singleThreadExporter = new BqSelectResultExporter(cfg, bigQuery, zos.getInfo, schema,
      new SimpleFileExport("st_outfile_all", defaultRecordLength))
    singleThreadExporter.exportData(completedJob)
    singleThreadExporter.close()

    assert(com.google.common.io.Files.equal(new File("mt_outfile_all"), new File("st_outfile_all")))

    //cleanup
    cleanUpLocalTmpFiles("mt_outfile", "st_outfile", "OUTFILE")
    cleanUpRemoteTmpFiles(gcs, targetFile.getBucket, targetFile.getName)
  }

  private def writeBytes(data: Array[Byte], file: File): Unit = {
    val target = new BufferedOutputStream(new FileOutputStream(file));
    try target.write(data) finally target.close()
  }

  private def cleanUpLocalTmpFiles(prefix: String*): Unit = {
    require(prefix.nonEmpty)
    Files.list(Paths.get("./"))
      .map(_.toFile)
      .filter(s => prefix.exists(s.getName.startsWith(_)))
      .forEach(s => s.delete())
  }

  private def cleanUpRemoteTmpFiles(gcs: Storage, bucket: String, prefix: String): Unit = {
    val files = gcs.list(bucket, Storage.BlobListOption.prefix(prefix))
    files.iterateAll().forEach(file => gcs.delete(file.getBlobId))
  }

  private def toStringUrl(blob: BlobId): String = {
    s"gs://${blob.getBucket}/${blob.getName.replaceAll("^\\+", "")}"
  }

  class TestLocalFileExporter(lRecl: Int) extends LocalFileExporter {
    override def newExport(e: FileExport): Unit = {
      e.close()
      super.newExport(new SimpleFileExport("st_outfile_all", lRecl))
    }
  }

}
