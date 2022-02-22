/*
 * Copyright 2019 Google LLC
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

package com.google.cloud.bqhiveloader

import java.util
import java.util.Map

import com.google.cloud.RetryOption
import com.google.cloud.bigquery.JobInfo.{CreateDisposition, WriteDisposition}
import com.google.cloud.bigquery.QueryJobConfiguration.Priority
import com.google.cloud.bigquery.{BigQuery, Clustering, Job, JobId, JobInfo, QueryJobConfiguration, RangePartitioningUtil, StandardTableDefinition, Table, TableId, TableInfo, TableResult, TimePartitioning}
import com.google.cloud.bqhiveloader.ExternalTableManager.jobid
import org.apache.spark.sql.types.{DateType, StructType}
import org.threeten.bp.Duration

import scala.util.{Failure, Success}

object NativeTableManager extends Logging {
  def getExistingPartitions(tableId: TableId, bigQuery: BigQuery): TableResult = {
    val tableSpec = tableId.getProject + ":" + tableId.getDataset + "." + tableId.getTable
    tableId.toString + "$__PARTITIONS_SUMMARY__"
    bigQuery.query(QueryJobConfiguration.newBuilder(
      s"""SELECT
         |  partition_id,
         |  TIMESTAMP(creation_time/1000) AS creation_time
         |FROM [$tableSpec]""".stripMargin)
      .setUseLegacySql(true)
      .setPriority(Priority.INTERACTIVE)
      .build())
  }

  def createTableIfNotExists(project: String, dataset: String, table: String, c: Config, schema: StructType, bigquery: BigQuery, bql: com.google.api.services.bigquery.Bigquery, expirationMs: scala.Option[Long] = None): Boolean = {
    val tableId = TableId.of(project, dataset, table)
    createTableIfNotExistsWithId(c, schema, tableId, bigquery, bql, expirationMs)
  }

  def createTableIfNotExistsWithId(c: Config, schema: StructType, tableId: TableId, bigquery: BigQuery, bql: com.google.api.services.bigquery.Bigquery, expirationMs: scala.Option[Long] = None): Boolean = {
    if (!ExternalTableManager.tableExists(tableId, bigquery)) {
      createTable(c, schema, tableId, bigquery, bql, expirationMs)
      true
    } else false
  }

  def copyOnto(srcProject: String, srcDataset: String, srcTable: String, destProject: String, destDataset: String, destTable: String, destPartition: scala.Option[String] = None, bq: BigQuery, dryRun: Boolean, batch: Boolean): scala.util.Try[Job] = {
    val tableWithPartition = destPartition.map(partId => destTable + "$" + partId).getOrElse(destTable)

    val srcTableId = TableId.of(srcProject, srcDataset, srcTable)
    val destTableId = TableId.of(destProject, destDataset, tableWithPartition)

    val job = selectInto(srcTableId, destTableId, bq, dryRun, batch)

    if (!dryRun){
      job.map{_.waitFor(
        RetryOption.initialRetryDelay(Duration.ofSeconds(8)),
        RetryOption.maxRetryDelay(Duration.ofSeconds(60)),
        RetryOption.retryDelayMultiplier(2.0d),
        RetryOption.totalTimeout(Duration.ofMinutes(120)))
      } match {
        case Some(j) =>
          val error = scala.Option(j.getStatus).flatMap(x => scala.Option(x.getError))
          error
            .map(e => Failure(new RuntimeException(e.toString)))
            .getOrElse(Success(j))
        case _ =>
          Failure(new RuntimeException("Job doesn't exist"))
      }
    } else Success(null)
  }

  def deletePartition(tbl: TableId, partitionId: String, bq: BigQuery): Boolean = {
    require(partitionId.matches("""^\d{8}$"""), "partitionId must match format YYYYMMDD")
    bq.delete(TableId.of(tbl.getProject, tbl.getDataset, tbl.getTable + "$" + partitionId))
  }

  def selectInto(src: TableId, dest: TableId, bq: BigQuery, dryRun: Boolean = false, batch: Boolean = false): scala.Option[Job] = {
    val query = s"select * from `${src.getProject}.${src.getDataset}.${src.getTable}`"
    val jobConfig = QueryJobConfiguration
      .newBuilder(query)
      .setCreateDisposition(CreateDisposition.CREATE_NEVER)
      .setWriteDisposition(WriteDisposition.WRITE_TRUNCATE)
      .setDestinationTable(dest)
      .setAllowLargeResults(true)
      .setDryRun(dryRun)
      .setUseLegacySql(false)
      .setUseQueryCache(false)
      .setPriority(if (batch) Priority.BATCH else Priority.INTERACTIVE)
      .build()

    val jobId = JobId.newBuilder()
      .setProject(src.getProject)
      .setJob(jobid(dest))
      .build()
    val jobInfo = JobInfo.of(jobId, jobConfig)
    logger.info(jobInfo.toString)
    if (dryRun) None
    else scala.Option(ExternalTableManager.createJob(bq, jobId, jobConfig))
  }

  def createTable(c: Config, schema: StructType, destTableId: TableId, bigquery: BigQuery, bql: com.google.api.services.bigquery.Bigquery, expirationMs: scala.Option[Long] = None): Table ={
    require(c.clusterColumns.nonEmpty, "destination table does not exist, clusterColumns must not be empty")
    require(c.partitionColumn.nonEmpty, "destination table does not exist, partitionColumn must not be empty")
    val destTableSchema = if (c.partitionColumn.map(_.toLowerCase).contains("none")) {
      Mapping.convertStructType(schema.add(c.unusedColumnName, DateType))
    } else {
      val hasPartCol = schema
        .find(_.name.equalsIgnoreCase(c.partitionColumn.get))
        .exists(_.dataType == DateType)
      if (hasPartCol)
        Mapping.convertStructType(schema)
      else {
        val fieldsWithoutPartCol = schema
          .filterNot(_.name.equalsIgnoreCase(c.partitionColumn.get))
        val withPartCol = StructType(fieldsWithoutPartCol)
          .add(c.partitionColumn.get, DateType)
        Mapping.convertStructType(withPartCol)
      }
    }

    val destTableDefBuilder = StandardTableDefinition.newBuilder()
      .setLocation(c.bqLocation)
      .setSchema(destTableSchema)

    if (c.clusterColumns.map(_.toLowerCase) != Seq("none")) {
      import scala.collection.JavaConverters.seqAsJavaListConverter
      destTableDefBuilder.setClustering(Clustering.newBuilder()
        .setFields(c.clusterColumns.map(_.toLowerCase).asJava).build())
    }

    if (c.partitionColumn.contains("none") && c.clusterColumns.exists(_ != "none")) {
      // Only set null partition column if both partition column and cluster columns are provided
      destTableDefBuilder
        .setTimePartitioning(TimePartitioning
          .newBuilder(TimePartitioning.Type.DAY)
          .setField(c.unusedColumnName)
          .build())
    } else if (c.partitionType == "DAY") {
      c.partitionColumn match {
        case Some(partitionCol) if partitionCol != "none" =>
          // Only set partition column if partition column is set
          destTableDefBuilder
            .setTimePartitioning(TimePartitioning
              .newBuilder(TimePartitioning.Type.DAY)
              .setField(partitionCol)
              .build())
        case _ =>
          // Don't set a partition column if partition column is none
      }
    }

    val tableInfoBuilder = TableInfo.newBuilder(destTableId, destTableDefBuilder.build())

    expirationMs.foreach(x => tableInfoBuilder.setExpirationTime(System.currentTimeMillis() + x))

    if (c.partitionType == "RANGE" && c.partitionColumn.isDefined) {
      val tableInfo = tableInfoBuilder.build()
      RangePartitioningUtil.createTable(destTableId.getProject, destTableId.getDataset, tableInfo, bql, c.partitionColumn.get, c.partitionRangeStart, c.partitionRangeEnd, c.partitionRangeInterval)
      bigquery.getTable(tableInfo.getTableId)
    } else {
      bigquery.create(tableInfoBuilder.build())
    }
  }
}
