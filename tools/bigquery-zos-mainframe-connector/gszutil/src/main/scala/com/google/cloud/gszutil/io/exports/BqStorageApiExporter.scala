package com.google.cloud.gszutil.io.exports

import com.google.cloud.bigquery.storage.v1.ReadSession.TableReadOptions
import com.google.cloud.bigquery.storage.v1._
import com.google.cloud.bigquery.{BigQuery, Job, QueryJobConfiguration, TableDefinition}
import com.google.cloud.bqsh.cmd.Result
import com.google.cloud.bqsh.ExportConfig
import com.google.cloud.gszutil.SchemaProvider
import com.google.cloud.imf.gzos.Util
import com.google.cloud.imf.gzos.pb.GRecvProto
import com.google.cloud.imf.util.RetryHelper._
import org.apache.avro.Schema

import java.util.concurrent.atomic.AtomicLong
import java.util.concurrent.{Executors, TimeUnit}
import scala.concurrent.{ExecutionContext, ExecutionContextExecutor, Future}

class BqStorageApiExporter(cfg: ExportConfig,
                           bqStorage: BigQueryReadClient,
                           bq: BigQuery,
                           exporterFactory: (String, ExportConfig) => SimpleFileExporter,
                           jobInfo: GRecvProto.ZOSJobInfo,
                           sp: SchemaProvider) extends NativeExporter(bq, cfg, jobInfo) {

  private implicit val ec: ExecutionContextExecutor = ExecutionContext.fromExecutor(Executors.newWorkStealingPool(cfg.exporterThreadCount))

  private val MaxStreams = math.max(1, cfg.exporterThreadCount / 3)
  private val exporters = collection.mutable.ListBuffer.empty[BqAvroExporter]
  private val retryCount = sys.env.get("RST_STREAM_RETRY_COUNT").flatMap(_.toIntOption).filter(_ >= 0).getOrElse(5)
  private val minRetryTimeoutSec = sys.env.get("RST_STREAM_MIN_TIMEOUT_SEC").flatMap(_.toIntOption).filter(_ > 0).getOrElse(5)
  private val maxRetryTimeoutSec = minRetryTimeoutSec + 15

  override def exportData(job: Job): Result = {
    logger.info(s"Using BqStorageApiExporter, workersCount=${cfg.exporterThreadCount}")
    val tableWithResults = bq.getTable(job.getConfiguration.asInstanceOf[QueryJobConfiguration].getDestinationTable)
    val rowsInDestTable = tableWithResults.getNumRows.longValueExact
    val projectPath = s"projects/${cfg.projectId}"
    val tablePath = tableWithResults.getTableId.getIAMResourceName

    val session: ReadSession = bqStorage.createReadSession(
      CreateReadSessionRequest.newBuilder
        .setParent(projectPath)
        .setMaxStreamCount(MaxStreams)
        .setReadSession(ReadSession.newBuilder
          .setTable(tablePath)
          .setDataFormat(DataFormat.AVRO)
          .setReadOptions(TableReadOptions.newBuilder.build)
          .build)
        .build)

    logger.info(s"ReadSession created: rowsInTable=$rowsInDestTable, maxStreamsCount=$MaxStreams, " +
      s"streamsCount=${session.getStreamsCount}, tablePath=$tablePath, " +
      s"retryCount=$retryCount, minRetryTimeoutSec=$minRetryTimeoutSec, maxRetryTimeoutSec=$maxRetryTimeoutSec")
    val bqTableSchema = tableWithResults.getDefinition[TableDefinition].getSchema.getFields
    val avroSchema = new Schema.Parser().parse(session.getAvroSchema.getSchema)

    import scala.jdk.CollectionConverters._
    val rowsProcessed = new AtomicLong(0)
    session.getStreamsList.asScala.zipWithIndex.map { streamToIndex =>
      val request = ReadRowsRequest.newBuilder.setReadStream(streamToIndex._1.getName).build
      val fileExporter = exporterFactory(streamToIndex._2.toString, cfg)
      val exporter = new BqAvroExporter(fileExporter, avroSchema, bqTableSchema, sp, streamToIndex._2.toString)
      if (exporters.isEmpty) {
        fileExporter.validateData(bqTableSchema, sp.encoders)
      }
      exporters.append(exporter)

      Future {
        val avroRowsIterator = new AvroRowsRetryableIterator(bqStorage.readRowsCallable, request,
          retryCount, minRetryTimeoutSec, maxRetryTimeoutSec)
        avroRowsIterator.foreach { res =>
          if (res.hasAvroRows) {
            val r = exporter.processRows(res.getAvroRows)
            exporter.logIfNeeded(rowsProcessed.addAndGet(r), rowsInDestTable)
            avroRowsIterator.consumed(r)
          }
        }
        exporter.close()
      }
    }.foreach(Util.await(_, cfg.timeoutMinutes, TimeUnit.MINUTES))

    val rowsWritten = exporters.map(_.rowsWritten).sum
    logger.info(s"Finished writing $rowsWritten rows from BigQuery Storage API ReadStream")
    require(rowsProcessed.get() == rowsWritten, s"Internal error, rowsWritten doesn't match rowsProcessed.")
    require(rowsInDestTable == rowsWritten, s"Table contains $rowsInDestTable rows but writer wrote $rowsWritten")

    Result(activityCount = rowsWritten)
  }

  override def close(): Unit = {
    val errors = exporters
      .map(e => (e, retryableOnError(e.close(), s"Resource closing for $e. ")))
      .filter(r => r._2.isLeft)

    if (errors.nonEmpty)
      throw new IllegalStateException(s"Resources [${errors.map(_._1).toSeq}] were not closed properly!", errors.head._2.left.get)
  }
}
