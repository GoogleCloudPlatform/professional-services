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

package com.google.cloud.bqsh.cmd

import com.google.cloud.bigquery._
import com.google.cloud.bqsh._
import com.google.cloud.imf.gzos.MVS
import com.google.cloud.imf.util.stats._
import com.google.cloud.imf.util.{Logging, Services, StatsUtil}

object Query extends Command[QueryConfig] with Logging {
  override val name: String = "bq query"
  override val parser: ArgParser[QueryConfig] = QueryOptionParser

  override def run(cfg: QueryConfig, zos: MVS, env: Map[String, String]): Result = {
    val creds = zos.getCredentialProvider().getCredentials
    logger.info(s"Initializing BigQuery client\n" +
      s"projectId=${cfg.projectId} location=${cfg.location}")
    val bq = Services.bigQuery(cfg.projectId, cfg.location, creds)

    val queryString =
      if (cfg.sql.nonEmpty) cfg.sql
      else {
        cfg.dsn match {
          case Some(dsn) =>
            logger.info(s"Reading query from DSN: $dsn")
            zos.readDSNLines(dsn).mkString("\n")
          case None =>
            logger.info("Reading query from DD: QUERY")
            zos.readDDString("QUERY", "\n")
        }
      }
    require(queryString.nonEmpty, "query must not be empty")
    val queries =
      if (cfg.splitSql) Bqsh.splitSQL(queryString)
      else Seq(queryString)

    logger.info(s"Sql script\nsplitSql=${cfg.splitSql}\nqueriesSize=${queries.size}")
    if (cfg.splitSql) logger.info(s"Entire Script:\n$queryString")

    var result: Result = null
    for (query <- queries) {
      try {
        val (jobId, job) = BqQueryJobExecutor(bq, cfg, zos).execute(query, configureQueryJob)

        // Publish results
        if (cfg.sync && cfg.statsTable.nonEmpty) {
          val statsTable = BQ.resolveTableSpec(cfg.statsTable, cfg.projectId, cfg.datasetId)
          logger.info(s"Writing stats to ${BQ.tableSpec(statsTable)} jobId=${BQ.toStr(jobId)}")
          StatsUtil.retryableInsertJobStats(zos, jobId, bq, statsTable, jobType = "query")
        } else {
          val j = BQ.apiGetJob(Services.bigQueryApi(creds), jobId)
          val sb = new StringBuilder
          JobStats.forJob(j).foreach { s => sb.append(JobStats.report(s)) }
          QueryStats.forJob(j).foreach { s => sb.append(QueryStats.report(s)) }
          SelectStats.forJob(j).foreach { s => sb.append(SelectStats.report(s)) }
          LoadStats.forJob(j).foreach { s => sb.append(LoadStats.report(s)) }
          MergeStats.forJob(j).foreach { s => sb.append(MergeStats.report(s)) }
          logger.info(s"Query Statistics:\n${sb.result} for jobId=${BQ.toStr(jobId)}")
        }

        // check for errors
        if (cfg.sync) {
          logger.info(s"Checking for errors in job status jobId=${BQ.toStr(jobId)}")
          BQ.getStatus(job) match {
            case Some(status) =>
              logger.info(s"Status = ${status.state} jobId=${BQ.toStr(jobId)}")
              if (status.hasError) {
                val msg = s"Error:\n${status.error}\nExecutionErrors: ${status.executionErrors.mkString("\n")} jobId=${BQ.toStr(jobId)}"
                logger.error(msg)
                result = Result.Failure(msg)
              } else {
                val activityCount: Long =
                  job.getStatistics[JobStatistics] match {
                    case _: JobStatistics.CopyStatistics => -1
                    case _: JobStatistics.ExtractStatistics => -1
                    case s: JobStatistics.LoadStatistics => s.getOutputRows
                    case s: JobStatistics.QueryStatistics =>
                      if (s.getStatementType == "MERGE") s.getNumDmlAffectedRows
                      else if (s.getStatementType == "SELECT") 0
                      else s.getNumDmlAffectedRows
                    case _ =>
                      -1
                  }
                result = Result(activityCount = activityCount)
              }
              BQ.throwOnError(job, status)
            case _ =>
              logger.error(s"Job ${BQ.toStr(jobId)} not found")
              result = Result.Failure("missing status")
          }
        } else {
          result = Result.Success
        }
      } catch {
        case e: BigQueryException =>
          logger.error(s"Query Job threw BigQueryException\nMessage:${e.getMessage}\n" +
            s"Query:\n$query\n")
          result = Result.Failure(e.getMessage)
      }
    }
    if (result == null) Result.Failure("no queries")
    else result
  }

  def configureQueryJob(query: String, cfg: QueryConfig): QueryJobConfiguration = {
    import scala.jdk.CollectionConverters.{MapHasAsJava, SeqHasAsJava}

    val b = QueryJobConfiguration.newBuilder(query)
      .setDryRun(cfg.dryRun)
      .setUseLegacySql(cfg.useLegacySql)
      .setUseQueryCache(cfg.useCache)
      .setAllowLargeResults(cfg.allowLargeResults)

    if (cfg.datasetId.nonEmpty)
      b.setDefaultDataset(BQ.resolveDataset(cfg.datasetId, cfg.projectId))

    if (cfg.createIfNeeded)
      b.setCreateDisposition(JobInfo.CreateDisposition.CREATE_IF_NEEDED)

    if (cfg.clusteringFields.nonEmpty) {
      val clustering = Clustering.newBuilder
        .setFields(cfg.clusteringFields.asJava)
        .build
      b.setClustering(clustering)
    }

    if (cfg.timePartitioningType == TimePartitioning.Type.DAY.name() && cfg.timePartitioningField.nonEmpty) {
      val timePartitioning = TimePartitioning
        .newBuilder(TimePartitioning.Type.DAY)
        .setExpirationMs(cfg.timePartitioningExpiration)
        .setField(cfg.timePartitioningField)
        .setRequirePartitionFilter(cfg.requirePartitionFilter)
        .build()

      b.setTimePartitioning(timePartitioning)
    }

    if (cfg.parameters.nonEmpty) {
      val (positionalValues, namedValues) = parseParameters(cfg.parameters)
      if (positionalValues.nonEmpty)
        b.setPositionalParameters(positionalValues.asJava)
      if (namedValues.nonEmpty)
        b.setNamedParameters(namedValues.toMap.asJava)
    }

    val schemaUpdateOptions = BQ.parseSchemaUpdateOption(cfg.schemaUpdateOption)
    if (schemaUpdateOptions.size() > 0)
      b.setSchemaUpdateOptions(schemaUpdateOptions)

    if (cfg.destinationTable.nonEmpty) {
      val destinationTable = BQ.resolveTableSpec(cfg.destinationTable, cfg.projectId, cfg.datasetId)
      b.setDestinationTable(destinationTable)
    }

    if (cfg.maximumBytesBilled > 0)
      b.setMaximumBytesBilled(cfg.maximumBytesBilled)

    if (cfg.batch)
      b.setPriority(QueryJobConfiguration.Priority.BATCH)

    if (cfg.replace)
      b.setWriteDisposition(JobInfo.WriteDisposition.WRITE_TRUNCATE)
    else if (cfg.appendTable)
      b.setWriteDisposition(JobInfo.WriteDisposition.WRITE_APPEND)

    b.build()
  }

  def parseParameters(parameters: Seq[String]): (Seq[QueryParameterValue], Seq[(String, QueryParameterValue)]) = {
    val params = parameters.map(_.split(':'))

    val positionalValues = params.flatMap { queryParam =>
      if (queryParam.head.nonEmpty) None
      else {
        val typeId = queryParam(1)
        val value = queryParam(2)
        val typeName =
          if (typeId.nonEmpty) StandardSQLTypeName.valueOf(typeId)
          else StandardSQLTypeName.STRING

        scala.Option(
          QueryParameterValue.newBuilder()
            .setType(typeName)
            .setValue(value)
            .build()
        )
      }
    }

    val namedValues = params.flatMap { x =>
      if (x.head.isEmpty) None
      else {
        val name = x(0)
        val t = x(1)
        val value = x(2)
        val typeName =
          if (t.nonEmpty) StandardSQLTypeName.valueOf(t)
          else StandardSQLTypeName.STRING

        val parameterValue = QueryParameterValue.newBuilder()
          .setType(typeName)
          .setValue(value)
          .build()

        scala.Option((name, parameterValue))
      }
    }

    (positionalValues, namedValues)
  }
}
