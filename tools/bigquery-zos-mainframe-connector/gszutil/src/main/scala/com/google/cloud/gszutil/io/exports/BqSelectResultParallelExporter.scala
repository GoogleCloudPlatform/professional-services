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

import com.google.cloud.bigquery.BigQuery.TableDataListOption
import com.google.cloud.bigquery._
import com.google.cloud.bqsh.ExportConfig
import com.google.cloud.bqsh.cmd.Result
import com.google.cloud.gszutil.SchemaProvider
import com.google.cloud.imf.gzos.Util
import com.google.cloud.imf.gzos.pb.GRecvProto
import com.google.common.collect.Iterators
import com.google.cloud.imf.util.RetryHelper._

import java.util.concurrent.atomic.AtomicLong
import java.util.concurrent.{Executors, TimeUnit}
import scala.concurrent.{ExecutionContext, ExecutionContextExecutor, Future}

class BqSelectResultParallelExporter(cfg: ExportConfig,
                                     bq: BigQuery,
                                     jobInfo: GRecvProto.ZOSJobInfo,
                                     sp: SchemaProvider,
                                     exporterFactory: (String, ExportConfig) => SimpleFileExporter) extends NativeExporter(bq, cfg, jobInfo) {

  private implicit val ec: ExecutionContextExecutor = ExecutionContext.fromExecutor(Executors.newWorkStealingPool(cfg.exporterThreadCount))
  private var exporters: Seq[SimpleFileExporter] = List()

  private val _2MB: Int = 2 * 1024 * 1024

  override def exportData(job: Job): Result = {
    logger.info("Multithreading export started")
    val tableWithResults = bq.getTable(job.getConfiguration.asInstanceOf[QueryJobConfiguration].getDestinationTable)
    val tableSchema = tableWithResults.getDefinition[TableDefinition].getSchema.getFields
    val totalRowsToExport = tableWithResults.getNumRows.longValue()

    val pageSize = _2MB / sp.LRECL
    val partitionSize = math.max(pageSize, totalRowsToExport / cfg.exporterThreadCount + 1)
    val partitions = for (leftBound <- 0L to totalRowsToExport by partitionSize) yield leftBound

    logger.info(
      s"""Multithreading settings(
         |  bqJobId=${job.getJobId.getJob},
         |  totalRowsToExport=$totalRowsToExport,
         |  threadsCount=${cfg.exporterThreadCount},
         |  partitionCount=${partitions.size},
         |  partitionSize=$partitionSize)
         |  BQDestinationTable=${tableWithResults.getTableId}""".stripMargin)

    val iterators = partitions.map(leftBound =>
      new PartialPageIterator[java.lang.Iterable[FieldValueList]](
        startIndex = leftBound,
        endIndex = Math.min(leftBound + partitionSize, totalRowsToExport),
        pageSize = pageSize,
        pageFetcher = fetchPage(tableWithResults, _, _))
    )

    exporters = partitions.map(leftBound => {
      exporterFactory((leftBound / partitionSize).toString, cfg)
    })

    exporters.headOption.foreach(_.validateData(tableSchema, sp.encoders))

    val exportedRows = new AtomicLong(0)
    val results = iterators.zip(exporters).map {
      case (iterator, exporter) =>
        Future {
          try {
            val partitionName = s"Batch[${iterator.startIndex}:${iterator.endIndex}]"

            var rowsProcessed: Long = 0
            val totalPartitionRows = iterator.endIndex - iterator.startIndex

            while (iterator.hasNext()) {
              exporter.exportData(iterator.next(), tableSchema, sp.encoders) match {
                case Result(_, 0, rowsWritten, _, _) =>
                  rowsProcessed = rowsProcessed + rowsWritten
                  logger.info(s"$partitionName, exported by thread=[${Thread.currentThread().getName}]: [$rowsProcessed / $totalPartitionRows], " +
                    s"total exported: [${exportedRows.addAndGet(rowsWritten)} / $totalRowsToExport]")
                  if (rowsProcessed > totalPartitionRows)
                    throw new IllegalStateException(s"$partitionName Internal issue, to many rows exported!!!")
                case Result(_, 1, _, msg, _) => throw new IllegalStateException(s"$partitionName Failed when encoding values to file: $msg")
              }
            }
            Result(activityCount = rowsProcessed)
          } finally {
            exporter.endIfOpen()
          }
        }
    }.map(Util.await(_, cfg.timeoutMinutes, TimeUnit.MINUTES))

    val rowsProcessed = results.map(_.activityCount).sum
    logger.info(s"Received $totalRowsToExport rows from BigQuery API, written $rowsProcessed rows.")
    require(totalRowsToExport == rowsProcessed, s"BigQuery API sent $totalRowsToExport rows but " +
      s"writer wrote $rowsProcessed")
    Result(activityCount = rowsProcessed)
  }

  def fetchPage(table: Table, startIndex: Long, pageSize: Long): Page[java.lang.Iterable[FieldValueList]] = {
    val result = bq.listTableData(
      table.getTableId,
      TableDataListOption.startIndex(startIndex),
      TableDataListOption.pageSize(pageSize)
    )
    Page(result.getValues, Iterators.size(result.getValues.iterator()))
  }

  override def close(): Unit = {
    val errors: Seq[(SimpleFileExporter, Either[Throwable, Unit])] = exporters
      .map(e => (e, retryableOnError(e.endIfOpen(), s"Resource closing for $e. ")))
      .filter(r => r._2.isLeft)

    if(errors.nonEmpty)
      throw new IllegalStateException(s"Resources [${errors.map(_._1)}] were not closed properly!", errors.head._2.left.get)
  }
}
