package com.google.cloud.load

import com.google.cloud.bqsh.cmd.Result
import com.google.cloud.gszutil.CopyBook
import com.google.cloud.imf.gzos.Util.generateHashString
import com.google.cloud.imf.util.Logging

import java.util.concurrent.{Executors, TimeUnit}
import scala.concurrent.duration.Duration
import scala.concurrent.{Await, ExecutionContext, ExecutionContextExecutor, Future}
import scala.io.Source
import scala.util.{Failure, Success}

abstract class GrecvLoadTestService(cfg: GRecvLoadTestConfig) extends Logging {

  type JobResponse = (JobMetadata, Result)

  implicit val ec: ExecutionContextExecutor =
    ExecutionContext.fromExecutor(Executors.newWorkStealingPool(cfg.numberThreads))

  val loadTestId = s"$generateHashString"

  def run: Unit = {
    logger.info(s"Preparing testCase=${cfg.testCase} $loadTestId load test with ${cfg.numberOfRequests} request.")

    val cb = readCopybook()
    val sql = readSql()

    logger.info(s"$loadTestId Read metadata completed requests=[${cfg.numberOfRequests}], sql=$sql, copybook=${cb.raw}, outUri=$getOutputUri")
    val futures = (0 until cfg.numberOfRequests)
      .map(i => JobMetadata(loadTestId, i, generateHashString, sql, cb))
      .map(m => executeRequest(m))

    futures.foreach { f =>
      f onComplete {
        case Success(res) => handleResponse(res)
        case Failure(exception) => logger.error(s"Fatal error in test!!!", exception)
      }
    }

    logger.info(s"$loadTestId Waiting for all ${cfg.numberOfRequests} jobs.")
    futures.foreach(Await.ready(_, Duration.create(cfg.timeoutMinutes, TimeUnit.MINUTES)))

    logger.info(s"$loadTestId Load test completed.")
  }

  def readCopybook(): CopyBook = {
    logger.info(s"$loadTestId reading copybook from DSN=${cfg.copybookPath}")
    CopyBook(readByPath(cfg.copybookPath).mkString("\n"))
  }

  def readSql(): String = {
    logger.info(s"$loadTestId Reading query from DSN: ${cfg.sqlPath}")
    readByPath(cfg.sqlPath).mkString("\n")
  }

  def getOutputUri: String = s"gs://${cfg.bucket}/LOAD_TEST/$loadTestId"

  def executeRequest(jobMetadata: JobMetadata): Future[JobResponse]

  def handleResponse(out: JobResponse, alias: String = ""): Unit = {
    out._2 match {
      case Result(_, 1, _, _, _) => logger.error(s"Failed $alias! Job ${out._1.index} ${out._1.name}.")
      case Result(_, 0, _, _, _) => logger.info(s"Passed $alias! Job ${out._1.index} ${out._1.name}.")
    }
  }

  protected def readByPath(path: String): List[String] = {
    val source = Source.fromFile(path, "UTF-8")
    try source.getLines().toList finally source.close()
  }
}

