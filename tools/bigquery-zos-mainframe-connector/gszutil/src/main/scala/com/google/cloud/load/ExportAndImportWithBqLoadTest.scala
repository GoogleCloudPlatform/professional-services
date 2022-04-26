package com.google.cloud.load

import com.google.cloud.bigquery.{FormatOptions, JobInfo, LoadJobConfiguration, TableId}
import com.google.cloud.bqsh.BQ
import com.google.cloud.bqsh.cmd.Result
import com.google.cloud.imf.util.Services

import scala.concurrent.Future

class ExportAndImportWithBqLoadTest(cfg: GRecvLoadTestConfig) extends GrecvLoadTestService(cfg) {

  val exportAndImportTest = new ExportAndImportLoadTest(cfg)

  val bq = Services.bigQuery(cfg.projectId, cfg.location, Services.bigqueryCredentials())

  lazy val bqSchema = {
    logger.info(s"$loadTestId Reading bq schema from DSN: ${cfg.bqSchemaPath}")
    val schema = readByPath(cfg.bqSchemaPath)
    logger.info(s"$loadTestId Schema readccompleted: $schema")
    val s = BQ.parseSchema(readByPath(cfg.bqSchemaPath))
    logger.info(s"$loadTestId  parsing done: $s")
    s
  }

  override def executeRequest(jobMetadata: JobMetadata): Future[JobResponse] =
    for {
      _ <- exportAndImportTest.executeRequest(jobMetadata)
      l <- loadRequest(jobMetadata)
      _ = handleResponse(l, "load")
    } yield l

  def loadRequest(jobMetadata: JobMetadata): Future[JobResponse] = {
    Future {
      import scala.jdk.CollectionConverters.SeqHasAsJava
      val destinationTable: TableId = BQ.resolveTableSpec(jobMetadata.jobId, cfg.projectId, "load_test")

      val source = sourcePath(jobMetadata)
      val jobConfig = LoadJobConfiguration.newBuilder(destinationTable, source.asJava).setSchema(bqSchema).setFormatOptions(FormatOptions.orc()).build()
      val jobId = BQ.genJobId(cfg.projectId, cfg.location, GrecvLoadTestClient.jobInfo(jobMetadata), "load")

      bq.create(JobInfo.of(jobId, jobConfig))
      logger.info(s"Sending load request ${jobMetadata.jobId} source=${source.head} destination=$destinationTable")
      val completed = BQ.waitForJob(bq, jobId, timeoutMillis = cfg.timeoutMinutes * 60L * 1000L)

      val res = BQ.getStatus(completed) match {
        case Some(status) =>
          logger.info(s"job ${BQ.toStr(jobId)} has status ${status.state}")
          if (status.hasError) {
            val msg = s"Error:\n${status.error}\nExecutionErrors: ${status.executionErrors.mkString("\n")}"
            logger.error(msg)
            Result.Failure(msg)
          } else Result.Success
        case _ =>
          Result.Failure("missing status")
      }
      (jobMetadata, res)
    }
  }

  def sourcePath(jobMetadata: JobMetadata): Seq[String] =
    Seq(s"${exportAndImportTest.importUri}/orc/${jobMetadata.jobId}/*")
}
