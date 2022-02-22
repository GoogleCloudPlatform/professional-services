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

import java.util.Calendar

import com.google.cloud.bigquery.JobInfo.{CreateDisposition, WriteDisposition}
import com.google.cloud.bigquery.QueryJobConfiguration.Priority
import com.google.cloud.bigquery.{BigQuery, BigQueryException, ExternalTableDefinition, FormatOptions, Job, JobConfiguration, JobId, JobInfo, QueryJobConfiguration, Schema, Table, TableId, TableInfo}
import com.google.cloud.bqhiveloader.Mapping.convertStructType
import com.google.cloud.bqhiveloader.MetaStore.{Partition, TableMetadata}
import com.google.cloud.storage.Storage
import com.google.common.base.Preconditions
import com.google.common.io.BaseEncoding
import org.apache.spark.sql.types.StructType

import scala.util.Random

object ExternalTableManager extends Logging {
  sealed trait StorageFormat
  case object Orc extends StorageFormat
  case object Parquet extends StorageFormat
  case object Avro extends StorageFormat

  def parseStorageFormat(s: String): StorageFormat = {
    s.toLowerCase match {
      case "orc" => Orc
      case "parquet" => Parquet
      case "avro" => Avro
      case _ => throw new IllegalArgumentException("invalid storage format")
    }
  }

  def defaultExpiration: Long = System.currentTimeMillis() + 1000*60*60*6 // 6 hours

  def getTable(tableId: TableId, bigquery: BigQuery): scala.Option[Table] =
    scala.Option(bigquery.getTable(tableId))

  def tableExists(tableId: TableId, bigquery: BigQuery): Boolean =
    getTable(tableId, bigquery).exists(_.exists)

  def create(tableId: TableId,
             schema: Schema,
             sources: Seq[String],
             storageFormat: StorageFormat,
             bigquery: BigQuery,
             dryRun: Boolean): TableInfo = {

    import scala.collection.JavaConverters.seqAsJavaListConverter

    val tableDefinition = storageFormat match {
      case Orc =>
        ExternalTableDefinition
          .newBuilder(sources.asJava, null, FormatOptions.orc())
          .build()
      case Parquet =>
        ExternalTableDefinition
          .newBuilder(sources.asJava, schema, FormatOptions.parquet())
          .build()
      case Avro =>
        ExternalTableDefinition
          .newBuilder(sources.asJava, schema, FormatOptions.avro())
          .build()
    }

    val tableInfo = TableInfo
      .newBuilder(tableId, tableDefinition)
      .setExpirationTime(defaultExpiration)
      .build()

    if (!tableExists(tableInfo.getTableId, bigquery)) {
      logger.info("Create Table: \n" + tableInfo.toString)
      if (!dryRun) bigquery.create(tableInfo)
    }

    tableInfo
  }

  def resolveLocations(part: Partition, gcs: Storage): Seq[String] ={
    listObjects(part.location, gcs)
  }

  def listObjects(gsUri: String, gcs: Storage): Seq[String] = {
    val bucket = gsUri.stripPrefix("gs://").takeWhile(_ != '/')
    val path = gsUri.stripPrefix(s"gs://$bucket/").stripSuffix("/")
    val prefix = s"$path/"
    val options = Seq(
      Storage.BlobListOption.prefix(prefix),
      Storage.BlobListOption.fields(Storage.BlobField.NAME)
    )
    import scala.collection.JavaConverters.iterableAsScalaIterableConverter
    val blobs = gcs.list(bucket, options:_*)
      .iterateAll().asScala.toArray
      .filterNot{obj =>
        val fileName = obj.getName.stripPrefix(prefix)
        fileName.startsWith(".") || fileName.endsWith("/") || fileName.isEmpty
      }

    val hasDotFiles = blobs.exists{obj =>
      obj.getName.stripPrefix(prefix).startsWith(".")
    }

    val partPrefix = blobs.forall{obj =>
      obj.getName.stripPrefix(prefix).startsWith("part")
    }

    val numPrefix = blobs.forall{obj =>
      obj.getName.stripPrefix(prefix).startsWith("0")
    }

    if (!hasDotFiles) {
      if (path == "")
        Seq(s"gs://$bucket/*")
      else
        Seq(s"gs://$bucket/$path/*")
    } else if (partPrefix) {
      if (path == "")
        Seq(s"gs://$bucket/part*")
      else Seq(s"gs://$bucket/$path/part*")
    } else if (numPrefix) {
      if (path == "") Seq(s"gs://$bucket/0*")
      else Seq(s"gs://$bucket/$path/0*")
    } else {
      val locations = blobs.filterNot{obj =>
        val fileName = obj.getName.stripPrefix(prefix)
        fileName.startsWith(".") || fileName.endsWith("/") || fileName.isEmpty
      }
        .map{obj => s"gs://$bucket/${obj.getName}"}

      require(locations.length <= 500, "partition has more than 500 objects - remove files beginning with '.' to enable * wildcard matching")

    locations
    }
  }

  def createExternalTable(project: String,
                          dataset: String,
                          table: String,
                          tableMetadata: TableMetadata,
                          part: Partition,
                          storageFormat: StorageFormat,
                          bigquery: BigQuery,
                          gcs: Storage,
                          dryRun: Boolean): TableInfo = {
    val extTableName = validBigQueryTableName(table + "_" + part.values.mkString("_"))
    val partCols = tableMetadata.partitionColumnNames.toSet

    val partSchema = StructType(tableMetadata.schema.filterNot(x => partCols.contains(x.name)))

    val sources = resolveLocations(part, gcs)
    if (sources.nonEmpty)
      logger.info(s"Creating external table with sources '${sources.mkString(", ")}'")
    else
      throw new RuntimeException(s"No sources found for ${part.location}")

    create(TableId.of(project, dataset, extTableName),
           schema = convertStructType(partSchema),
           sources = sources,
           storageFormat = Orc,
           bigquery = bigquery,
           dryRun = dryRun)
  }

  def runQuery(sql: String, destTableId: TableId, project: String, location: String, dryRun: Boolean, overwrite: Boolean, batch: Boolean, bq: BigQuery): Job = {
    val query = QueryJobConfiguration
      .newBuilder(sql)
      .setCreateDisposition(CreateDisposition.CREATE_NEVER)
      .setWriteDisposition(if (!overwrite) WriteDisposition.WRITE_APPEND else WriteDisposition.WRITE_TRUNCATE)
      .setDestinationTable(destTableId)
      .setPriority(if (batch) Priority.BATCH else Priority.INTERACTIVE)
      .setUseLegacySql(false)
      .setUseQueryCache(false)
      .setDryRun(dryRun)
      .setAllowLargeResults(true)
      .build()

    val job = jobid(destTableId)
    val jobId = JobId.newBuilder()
      .setProject(project)
      .setLocation(location)
      .setJob(job)
      .build()

    logger.info(s"Creating Job with id $job")
    createJob(bq, jobId, query)
  }

  def createJob(bq: BigQuery, jobId: JobId, jobConfiguration: JobConfiguration): Job = {
    try {
      bq.create(JobInfo.of(jobId, jobConfiguration))
    } catch {
      case e: BigQueryException =>
        if (e.getMessage.contains("Already Exists")) {
          bq.getJob(jobId)
        } else {
          logger.error(s"failed to create job: ${e.getMessage}", e)
          throw e
        }
    }
  }

  def loadPart(destTableId: TableId,
               schema: StructType,
               partition: Partition,
               extTableId: TableId,
               unusedColumnName: String,
               partColFormats: Map[String,String],
               bigqueryWrite: BigQuery,
               overwrite: Boolean = false,
               batch: Boolean = true,
               renameOrcCols: Boolean = false,
               dryRun: Boolean = false,
               dropColumns: Set[String] = Set.empty,
               keepColumns: Set[String] = Set.empty,
               renameColumns: Map[String,String] = Map.empty): Job = {
    // TODO use dest table to provide schema
    val sql = SQLGenerator.generateSelectFromExternalTable(
      extTable = extTableId,
      schema = schema,
      partition = partition,
      unusedColumnName = unusedColumnName,
      formats = partColFormats,
      renameOrcCols = renameOrcCols,
      dropColumns = dropColumns,
      keepColumns = keepColumns,
      renameColumns = renameColumns)

    val query = QueryJobConfiguration
      .newBuilder(sql)
      .setCreateDisposition(CreateDisposition.CREATE_NEVER)
      .setWriteDisposition(if (!overwrite) WriteDisposition.WRITE_APPEND else WriteDisposition.WRITE_TRUNCATE)
      .setDestinationTable(destTableId)
      .setPriority(if (batch) Priority.BATCH else Priority.INTERACTIVE)
      .setUseLegacySql(false)
      .setUseQueryCache(false)
      .setDryRun(dryRun)
      .build()

    val jobId = JobId.newBuilder()
      .setProject(extTableId.getProject)
      .setLocation("US")
      .setJob(jobid(destTableId, partition))
      .build()

    createJob(bigqueryWrite, jobId, query)
  }

  def jobid(table: TableId): String = {
    val randomBytes = new Array[Byte](6)
    Random.nextBytes(randomBytes)
    validJobId(Seq(
      "load",
      table.getDataset,
      table.getTable,
      "all",
      (System.currentTimeMillis()/1000).toString,
      BaseEncoding.base64().encode(randomBytes)
    ).mkString("_"))
  }

  def jobid(table: TableId, partition: Partition): String = {
    validJobId(Seq(
      "load",
      table.getDataset,
      table.getTable,
      partition.values.map(_._2).mkString("_"),
      (System.currentTimeMillis()/1000).toString
    ).mkString("_"))
  }

  def waitForCreation(tableId: TableId, timeoutMillis: Long, bigquery: BigQuery): Table = {
    require(timeoutMillis > 0)
    val start = System.currentTimeMillis
    while ((System.currentTimeMillis - start) < timeoutMillis) {
      Thread.sleep(2000L)
      getTable(tableId, bigquery) match {
        case Some(table) =>
          return table
        case _ =>
      }
    }
    throw new RuntimeException(s"timed out waiting for ${tableId.getDataset}.${tableId.getTable} table creation")
  }

  def hasOrcPositionalColNames(table: Table): Boolean = {
    import scala.collection.JavaConverters.asScalaIteratorConverter
    table
      .getDefinition[ExternalTableDefinition]
      .getSchema
      .getFields.iterator.asScala
      .forall(f => f.getName.startsWith("_col"))
  }

  def validBigQueryColumnName(s: String): Boolean = {
    //https://cloud.google.com/bigquery/docs/schemas#column_names
    require(s.length <= 128, "column names must be 128 characters or less")
    val msg = s"$s is not a valid column name"
    require(!s.startsWith("_TABLE_"), msg)
    require(!s.startsWith("_FILE_"), msg)
    require(!s.startsWith("_PARTITION"), msg)
    require(s.matches("^[a-zA-Z_][a-zA-Z0-9_]{0,127}$"), msg)
    true
  }

  def validBigQueryTableName(s: String): String = {
    s.replace('=','_')
      .filter(c =>
        (c >= '0' && c <= '9') ||
          (c >= 'A' && c <= 'Z') ||
          (c >= 'a' && c <= 'z') ||
          c == '_'
      ).take(1024)
  }

  def validJobId(s: String): String = {
    s.filter(c =>
      (c >= '0' && c <= '9') ||
      (c >= 'A' && c <= 'Z') ||
      (c >= 'a' && c <= 'z') ||
      c == '_' || c == '-'
    ).take(1024)
  }

  /** Interprets partition column value string according to a known format
    *
    * @param colName name of column to be formatted
    * @param colValue value to be formatted
    * @param colFormat format string used to identify conversion function
    * @return SQL fragment "$colValue as '$colName'"
    */
  def format(colName: String, colValue: String, colFormat: String): String = {
    if (colFormat == "YYYYMM") {
      require(colValue.matches("""^\d{6}$"""))
      val y = colValue.substring(0,4)
      val m = colValue.substring(4,6)
      s"'$y-$m-01' as $colName"
    } else if (colFormat == "YYYYWW" || colFormat == "%Y%U" || colFormat == "%Y%V" || colFormat == "%Y%W") {
      s"PARSE_DATE('%Y-%m-%d','${getAsDate(colValue, colFormat)}') as $colName"
    } else {
      s"PARSE_DATE('$colFormat','$colValue') as $colName"
    }
  }

  def jan1dow(y: Int): Int = {
    val cal = Calendar.getInstance()
    cal.set(y, 0, 1)
    cal.get(Calendar.DAY_OF_WEEK)
  }

  def simpleYrWk(yr: Int, week: Int, calendar: Calendar): Calendar = {
    require(week >= 1 && week <= 53, "week must be in range [1,53]")
    require(yr >= 1950 && yr < 2100, "yr must be in range [1950,2100]")
    calendar.set(yr, Calendar.JANUARY,1)
    calendar.add(Calendar.DATE, (week-1) * 7)
    calendar
  }

  def printDate(cal: Calendar): String = {
    val year = cal.get(Calendar.YEAR)
    val month = f"${cal.get(Calendar.MONTH)+1}%02d"
    val day = f"${cal.get(Calendar.DAY_OF_MONTH)}%02d"
    s"$year-$month-$day"
  }

  def getAsDate(s: String, fmt: String): String = {
    if (fmt == "YYYYWW" || fmt == "%Y%U" || fmt == "%Y%V" || fmt == "%Y%W" || fmt == "YRWK") {
      Preconditions.checkArgument(s.matches("""^\d{6}$"""))
      val y = s.substring(0,4).toInt
      val week = s.substring(4,6).toInt
      val cal = Calendar.getInstance()
      if (fmt == "%Y%V") {
        // %V	The week number of the year (Monday as the first day of the week) as a decimal number (01-53). If the week containing January 1 has four or more days in the new year, then it is week 1; otherwise it is week 53 of the previous year, and the next week is week 1.
        val jan1 = jan1dow(y)
        if (jan1 == Calendar.FRIDAY || jan1 == Calendar.SATURDAY || jan1 == Calendar.SUNDAY) {
          cal.setWeekDate(y, week+1, Calendar.MONDAY)
        } else
          cal.setWeekDate(y, week, Calendar.MONDAY)
      } else if (fmt == "%Y%W")
        cal.setWeekDate(y, week, Calendar.MONDAY)
      else if (fmt == "%Y%U") {
        // %U	The week number of the year (Sunday as the first day of the week) as a decimal number (00-53).
        cal.setWeekDate(y, week+1, Calendar.SUNDAY)
      } else if (fmt == "YYYYWW") {
        // Week (01-53) (Sunday as the first day of the week)
        cal.setWeekDate(y, week, Calendar.SUNDAY)
      } else if (fmt == "YRWK") {
        simpleYrWk(y, week, cal)
      }
      printDate(cal)
    } else ""
  }
}
