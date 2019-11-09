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

import java.io.ByteArrayInputStream
import java.nio.file.{Files, Paths}

import com.google.api.gax.retrying.RetrySettings
import com.google.api.gax.rpc.FixedHeaderProvider
import com.google.auth.oauth2.GoogleCredentials
import com.google.cloud.RetryOption
import com.google.cloud.bigquery.{BigQuery, BigQueryOptions, RangePartitioningUtil, TableId, TableInfo, ViewDefinition}
import com.google.cloud.bqhiveloader.ExternalTableManager.{Orc, createExternalTable, hasOrcPositionalColNames, waitForCreation}
import com.google.cloud.bqhiveloader.MetaStore.{ExternalCatalogMetaStore, MetaStore, Partition, SparkSQLMetaStore, TableMetadata}
import com.google.cloud.storage.{Storage, StorageOptions}
import org.apache.spark.SparkFiles
import org.apache.spark.sql.SparkSession
import org.apache.spark.sql.types.StructType
import org.threeten.bp.Duration

import scala.util.Try


object SparkJobs extends Logging {
  val BigQueryScope = "https://www.googleapis.com/auth/bigquery"
  val StorageScope = "https://www.googleapis.com/auth/devstorage.read_write"
  val MaxSQLLength: Int = 1024 * 1024

  def run(config: Config): Unit = {
    val spark = SparkSession
      .builder()
      .config("spark.yarn.maxAppAttempts","1")
      .appName("BQHiveORCLoader")
      .enableHiveSupport
      .getOrCreate()

    logger.info(s"launching with MetaStore type '${config.hiveMetastoreType}'")
    val metaStore = {
      config.hiveMetastoreType match {
        case "jdbc" =>
          JDBCMetaStore(config.hiveJdbcUrl, spark)
        case "sql" =>
          SparkSQLMetaStore(spark)
        case "external" =>
          ExternalCatalogMetaStore(spark)
        case x =>
          throw new IllegalArgumentException(s"unsupported metastore type '$x'")
      }
    }

    for {
      keytab <- config.krbKeyTab
      principal <- config.krbPrincipal
    } yield {
      Kerberos.configureJaas(keytab, principal)
    }

    runWithMetaStore(config, metaStore, spark)
  }

  /** Reads partitions from MetaStore and launches Spark Job
    *
    * @param config
    * @param metaStore
    * @param spark
    */
  def runWithMetaStore(config: Config, metaStore: MetaStore, spark: SparkSession): Unit = {
    val table = metaStore.getTable(config.hiveDbName, config.hiveTableName)
    val partitions: Seq[Partition] =
      if (config.partitioned && table.partitionColumnNames.nonEmpty) {
        metaStore.filterPartitions(db = config.hiveDbName,
          table = config.hiveTableName,
          filterExpression = config.partFilters
        ) match {
          case parts if parts.nonEmpty =>
            logger.info(s"Selected ${parts.length} partitions for table '${config.hiveDbName}.${config.hiveTableName}':\n\t${parts.map(_.location).mkString("\n\t")}")
            parts
          case _ =>
            throw new RuntimeException(s"No partitions found with filter expression '${config.partFilters}'")
        }
      } else {
        table.location match {
          case Some(location) =>
            logger.info(s"Loading '${config.hiveDbName}.${config.hiveTableName}' as non-partitioned table from $location")
            Seq(Partition(Seq.empty, location))
          case _ =>
            throw new RuntimeException("Location not found in table description for non-partitioned table")
        }
      }
    val sc = spark.sparkContext

    // function which will accept a Config and load the targeted partitions from the table
    val sparkFunction: Iterator[Config] => Unit =
      loadPartitionsJob(table, partitions)

    // Submit the Job to the cluster
    sc.runJob(rdd = sc.makeRDD(Seq(config), numSlices = 1),
              func = sparkFunction)
  }

  /** loadPartitionsJob creates function that accepts a Config object
    * The function returned is accepted by SparkContext#runJob()
    * then serialized as a Spark Job and executed as a Task on a Worker node
    *
    * @param table table information from Hive metastore
    * @param partitions partition ids being targeted
    * @return function with signature Iterator[Config] => Unit to be used by SparkContext#runJob()
    */
  def loadPartitionsJob(table: TableMetadata, partitions: Seq[Partition]): Iterator[Config] => Unit =
    (it: Iterator[Config]) => loadPartitions(it.next, table, partitions)

  def readLocalOrSparkFile(maybePath: scala.Option[String]): scala.Option[Array[Byte]] = {
    val direct = maybePath
      .map(Paths.get(_))
      .filter{_.toFile.exists()}

    val fromSparkFiles = maybePath
      .map(SparkFiles.get)
      .map(Paths.get(_))
      .filter{_.toFile.exists}

    direct.orElse(fromSparkFiles)
      .map(Files.readAllBytes)
      .filter(_.nonEmpty)
  }

  /** loadPartitions loads Hive External Table partitions into BigQuery.
    * External table creation is a metadata only operation.
    * No Data in GCS is read by this job.
    * This was originally designed as a Spark job in order to access
    * Service Account Key Files accessible only on a worker node.
    *
    * This function performs the following actions:
    * 1) Load credentials from local filesystem
    * 2) Create BigQuery External Table from GCS paths
    *    where Hive table data is stored as ORC or Parquet
    * 3) Submit BigQuery load job to select from External Table
    *    into native table
    *
    * @param c Config object
    * @param table table information from Hive metastore
    * @param partitions partition ids being targeted
    */
  def loadPartitions(c: Config, table: TableMetadata, partitions: Seq[Partition]): Unit = {
    for {
      keytab <- c.krbKeyTab
      principal <- c.krbPrincipal
    } yield {
      Kerberos.configureJaas(keytab, principal)
    }

    val writeKeyPath = c.bqWriteKeyFile.orElse(c.bqKeyFile)
    val createKeyPath = c.bqCreateTableKeyFile.orElse(c.bqKeyFile)
    val gcsKeyPath = c.gcsKeyFile.orElse(c.bqKeyFile)
    val writeKey = readLocalOrSparkFile(writeKeyPath)
    val createKey = readLocalOrSparkFile(createKeyPath)
    val gcsKey = readLocalOrSparkFile(gcsKeyPath)
    writeKeyPath.foreach{p =>
      require(writeKey.isDefined, s"unable to load BigQuery write key from $p")
      logger.info(s"loaded BigQuery write key from $p")
    }
    createKeyPath.foreach{p =>
      require(createKey.isDefined, s"unable to load BigQuery create key from $p")
      logger.info(s"loaded BigQuery create key from $p")
    }
    gcsKeyPath.foreach{p =>
      require(gcsKey.isDefined, s"unable to load GCS key from $p")
      logger.info(s"loaded GCS key from $p")
    }

    val bqCreateCredentials: GoogleCredentials =
      createKey match {
        case Some(bytes) =>
          GoogleCredentials
            .fromStream(new ByteArrayInputStream(bytes))
            .createScoped(BigQueryScope)
        case _ =>
          GoogleCredentials.getApplicationDefault
      }

    val bqWriteCredentials: GoogleCredentials =
      writeKey match {
        case Some(bytes) =>
          GoogleCredentials
            .fromStream(new ByteArrayInputStream(bytes))
            .createScoped(BigQueryScope)
        case _ =>
          GoogleCredentials.getApplicationDefault
      }

    val storageCreds: GoogleCredentials =
      gcsKey match {
        case Some(bytes) =>
          GoogleCredentials
            .fromStream(new ByteArrayInputStream(bytes))
            .createScoped(StorageScope)
        case _ =>
          GoogleCredentials.getApplicationDefault
      }

    val retrySettings = RetrySettings.newBuilder()
      .setMaxAttempts(0)
      .setTotalTimeout(Duration.ofHours(24))
      .setInitialRetryDelay(Duration.ofSeconds(30))
      .setRetryDelayMultiplier(2.0d)
      .setMaxRetryDelay(Duration.ofSeconds(300))
      .setInitialRpcTimeout(Duration.ofHours(8))
      .setRpcTimeoutMultiplier(1.0d)
      .setMaxRpcTimeout(Duration.ofHours(8))
      .setJittered(false)
      .build()

    val bigqueryCreate: BigQuery = BigQueryOptions.newBuilder()
      .setLocation(c.bqLocation)
      .setCredentials(bqCreateCredentials)
      .setProjectId(c.bqProject)
      .setHeaderProvider(FixedHeaderProvider.create("user-agent", BQHiveLoader.UserAgent))
      .setRetrySettings(retrySettings)
      .build()
      .getService

    val bigqueryWrite: BigQuery = BigQueryOptions.newBuilder()
      .setLocation(c.bqLocation)
      .setCredentials(bqWriteCredentials)
      .setProjectId(c.bqProject)
      .setHeaderProvider(FixedHeaderProvider.create("user-agent", BQHiveLoader.UserAgent))
      .setRetrySettings(retrySettings)
      .build()
      .getService

    val bql: com.google.api.services.bigquery.Bigquery = RangePartitioningUtil.bq(bqCreateCredentials)

    val gcs: Storage = StorageOptions.newBuilder()
      .setCredentials(storageCreds)
      .setProjectId(c.bqProject)
      .setHeaderProvider(FixedHeaderProvider.create("user-agent", BQHiveLoader.UserAgent))
      .setRetrySettings(retrySettings)
      .build()
      .getService

    // TODO detect from metadata
    val storageFormat = c.hiveStorageFormat
        .map(ExternalTableManager.parseStorageFormat)
        .getOrElse(Orc)

    val filteredSchema = StructType(table.schema
      .filterNot{x => c.dropColumns.contains(x.name)}
      .filter{x => c.keepColumns.contains(x.name) || c.keepColumns.isEmpty}
      .map{x =>
        c.renameColumns.find(_._1 == x.name) match {
          case Some((_, newName)) =>
            x.copy(name = newName)
          case _ =>
            x
        }
      })

    /* Create BigQuery table to be loaded */
    NativeTableManager.createTableIfNotExists(c.bqProject, c.bqDataset, c.bqTable, c, filteredSchema, bigqueryWrite, bql)

    val externalTables: Seq[(Partition,TableInfo, Boolean)] = partitions.map{part =>
      val extTable = createExternalTable(c.bqProject, c.tempDataset, c.bqTable,
        table, part, storageFormat, bigqueryCreate, gcs, c.dryRun)

      val renameOrcCols = if (!c.dryRun) {
        val creation = waitForCreation(extTable.getTableId, timeoutMillis = 120000L, bigqueryCreate)
        hasOrcPositionalColNames(creation)
      } else true

      (part, extTable, renameOrcCols)
    }

    /* We generate SQL for each of the external tables
     * Each one is a distinct query because partition values
     * may be selected as a literal value specific to that partition
     */
    val sql: Seq[String] = externalTables.map{x =>
      val partition = x._1
      val extTableId = x._2.getTableId
      val schema = table.schema
      val renameOrcCols = x._3
      SQLGenerator.generateSelectFromExternalTable(
        extTable = extTableId,
        schema = schema,
        partition = partition,
        unusedColumnName = c.unusedColumnName,
        formats = c.partColFormats.toMap,
        renameOrcCols = renameOrcCols,
        dropColumns = c.dropColumns,
        keepColumns = c.keepColumns)
    }

    /* Our load operation needs to be atomic to prevent users from
     * receiving partial results.
     * The simplest way to achieve this is to union all the queries.
     */
    val unionSQL = sql.mkString("\nUNION ALL\n")
    logger.info(s"Generated SQL with length ${unionSQL.length}")
    if (unionSQL.length < MaxSQLLength) {
      /* Only proceed with this method if we are under the 1MB SQL limit. */
      logger.debug("Submitting Query:\n" + unionSQL)
      val destTableId = TableId.of(c.bqProject, c.bqDataset, c.bqTable)
      val queryJob = ExternalTableManager.runQuery(unionSQL, destTableId, c.bqProject,
        c.bqLocation, c.dryRun, c.bqOverwrite, c.bqBatch, bigqueryWrite)
      logger.info(s"Waiting for Job")
      scala.Option(queryJob.waitFor(RetryOption.totalTimeout(Duration.ofHours(8)))) match {
        case None =>
          val msg = s"Job doesn't exist"
          logger.error(msg)
          throw new RuntimeException(msg)
        case Some(j) if j.getStatus.getError != null =>
          val msg = s"Job failed with message: " + j.getStatus.getError.getMessage
          logger.error(msg)
          throw new RuntimeException(msg)
        case _ =>
      }
      logger.info(s"Finished loading partitions")
    } else if (c.useTempViews) {
      /* If we are over the limit we have one more method to squeeze
       * more SQL into a single Query Job by splitting our union all
       * into multiple views, which we will then select from.
       * This lets us use the 12MB SQL limit for resolved SQL.
       */
      logger.info("Creating temporary views")
      val t = System.currentTimeMillis() / 1000
      val views = SQLGenerator.createViews(sql)
        .zipWithIndex
        .map { x =>
          val (query, i) = x
          val viewName = s"vw_${c.bqTable}_${i}_$t"
          val tableId = TableId.of(c.bqProject, c.tempDataset, viewName)
          bigqueryCreate.create(TableInfo.of(tableId, ViewDefinition.of(query)))
          tableId
        }

      logger.info("Finished creating temporary views")

      val viewSQL = SQLGenerator.generateSelectFromViews(views, filteredSchema)

      logger.debug("Submitting Query:\n" + viewSQL)
      val destTableId = TableId.of(c.bqProject, c.bqDataset, c.bqTable)
      val queryJob = ExternalTableManager.runQuery(viewSQL, destTableId, c.bqProject,
        c.bqLocation, c.dryRun, c.bqOverwrite, c.bqBatch, bigqueryWrite)
      logger.info(s"Waiting for Job")
      scala.Option(queryJob.waitFor(RetryOption.totalTimeout(Duration.ofHours(8)))) match {
        case None =>
          val msg = s"Job doesn't exist"
          logger.error(msg)
          throw new RuntimeException(msg)
        case Some(j) if j.getStatus.getError != null =>
          val msg = s"Job failed with message: " + j.getStatus.getError.getMessage
          logger.error(msg)
          throw new RuntimeException(msg)
        case _ =>
      }
      logger.info(s"Finished loading partitions")
      logger.info(s"Deleting temporary views")
      views.foreach{x =>
        Try(bigqueryCreate.delete(x))
          .failed.foreach{y => logger.error(s"Failed to delete ${x.getDataset}.${x.getTable}")}
      }
      logger.info(s"Finished deleting temporary views")
    } else if (c.useTempTable) {
      /* It's possible that the table has so many partitions and/or
       * columns that the resolved SQL exceeds 12MB.
       * We could take the risk of using "SELECT *" instead of naming
       * columns, but as currently implemented we don't do that
       * and simply fall back to the original method which appends
       * each partition into a temp table before running an atomic select
       * query job to load the temp table partitions into the destination table.
       */
      val tmpTableName = c.bqTable + "_" + c.refreshPartition.getOrElse("") + "_tmp_" + (System.currentTimeMillis()/1000L).toString
      logger.info("Loading partitions into temporary table " + tmpTableName)

      NativeTableManager.createTableIfNotExists(c.bqProject, c.tempDataset, tmpTableName, c, table.schema, bigqueryWrite, bql, Some(Duration.ofHours(6).toMillis))

      logger.info("Loading partitions from external tables")
      val tmpTableId = TableId.of(c.bqProject, c.tempDataset, tmpTableName)
      val jobs = externalTables.map{ x =>
        val partition = x._1
        val extTableId = x._2.getTableId
        val schema = table.schema
        val renameOrcCols = x._3
        val loadJob = ExternalTableManager.loadPart(
          destTableId = tmpTableId,
          schema = schema,
          partition = partition,
          extTableId = extTableId,
          unusedColumnName = c.unusedColumnName,
          partColFormats = c.partColFormats.toMap,
          bigqueryWrite = bigqueryWrite,
          batch = c.bqBatch,
          overwrite = c.bqOverwrite,
          renameOrcCols = renameOrcCols,
          dryRun = c.dryRun,
          dropColumns = c.dropColumns,
          keepColumns = c.keepColumns,
          renameColumns = c.renameColumns.toMap)
        logger.info(s"Created QueryJob ${loadJob.getJobId.getJob}")
        (partition, loadJob)
      }

      jobs.foreach{x =>
        val (partition,loadJob) = x
        scala.Option(loadJob.waitFor(RetryOption.totalTimeout(Duration.ofDays(1)))) match {
          case Some(j) if j.getStatus.getError != null =>
            val msg = s"Job ${j.getJobId.getJob} failed with message: ${j.getStatus.getError}\nsql:\n$sql\n\npartition:\n$partition\n\nschema:\n${table.schema.map(_.toString).mkString("\n")}"
            throw new RuntimeException(msg)
          case None =>
            val msg = s"Job was not created successfully"
            throw new RuntimeException(msg)
          case _ =>
        }
      }

      logger.info("Finished loading " + tmpTableName)
      NativeTableManager.copyOnto(c.bqProject, c.tempDataset, tmpTableName,
        c.bqProject, c.bqDataset, c.bqTable, destPartition = c.refreshPartition,
        bq = bigqueryWrite, dryRun = c.dryRun, batch = c.bqBatch)
      logger.info(s"Finished loading ${c.bqTable}")
    } else {
      val msg = s"Generated SQL with length ${unionSQL.length} but useTempTable is set to false. Reduce number of selected partitions or add --useTempTable flag."
      throw new RuntimeException(msg)
    }
  }
}
