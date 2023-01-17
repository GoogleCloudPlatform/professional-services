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

package com.google.cloud.bqsh

import com.google.api.client.json.jackson2.JacksonFactory
import com.google.api.services.bigquery.{Bigquery, model}
import com.google.auth.Credentials
import com.google.auth.http.HttpCredentialsAdapter
import com.google.cloud.bigquery.InsertAllRequest.RowToInsert
import com.google.cloud.bigquery.{BigQuery, BigQueryError, BigQueryException, CopyJobConfiguration, DatasetId,
  ExtractJobConfiguration, Field, InsertAllRequest, InsertAllResponse, Job, JobConfiguration, JobId, JobInfo,
  JobStatus, LoadJobConfiguration, QueryJobConfiguration, Schema, StandardSQLTypeName, StandardTableDefinition,
  TableDefinition, TableId}
import com.google.cloud.imf.gzos.Util
import com.google.cloud.imf.gzos.pb.GRecvProto.ZOSJobInfo
import com.google.cloud.imf.util.{CCATransportFactory, GoogleApiL2Retrier, Logging, Services, StatsUtil}
import com.google.common.collect.ImmutableList

import java.time.LocalDateTime
import scala.annotation.tailrec
import scala.collection.mutable.ListBuffer
import scala.jdk.CollectionConverters.IterableHasAsScala
import scala.util.{Failure, Success, Try}

object BQ extends Logging with GoogleApiL2Retrier {
  override val retriesCount: Int = Services.l2RetriesCount
  override val retriesTimeoutMillis: Int = Services.l2RetriesTimeoutMillis

  /** Creates a standardized BigQuery job id from timestamp and job info
    * job id is used to query the status of a BigQuery job.
    *
    * @param t LocalDateTime
    * @param job ZOSJobInfo
    * @param jobType user specified job type such as query, load, mk
    * @param randomSuffix when true, a random 8 digit string will be appended
    * @return job id String
    */
  private def mkJobId(t: LocalDateTime, job: ZOSJobInfo, jobType: String, randomSuffix: Boolean): String =
    Seq(
      job.getJobname.filter(_.isLetterOrDigit),
      job.getStepName.filter(_.isLetterOrDigit),
      job.getJobid.filter(_.isLetterOrDigit),
      jobType,
      s"${t.getHour}${t.getMinute}${t.getSecond}",
      if (randomSuffix) Util.generateHashString else ""
    ).filter(_.nonEmpty).mkString("_")

  /** Creates BigQuery JobId from timestamp and job info
    * job id is used to query the status of a BigQuery job.
    *
    * @param projectId Google Cloud project id
    * @param location Google Cloud location
    * @param job ZOSJobInfo
    * @param jobType user specified job type such as query, load, mk
    * @param randomSuffix when true, a random 8 digit string will be appended
    * @return JobId
    */
  def genJobId(projectId: String, location: String, job: ZOSJobInfo, jobType: String, randomSuffix: Boolean = false): JobId =
    JobId.newBuilder()
      .setProject(projectId)
      .setLocation(location)
      .setJob(mkJobId(LocalDateTime.now(), job, jobType, randomSuffix))
      .build()

  /** Converts TableId to String */
  def tableSpec(t: TableId): String = s"${t.getProject}.${t.getDataset}.${t.getTable}"

  /** Converts Option[TableId] to String */
  def tableSpec(t: Option[TableId]): String = t.map(tableSpec).getOrElse("")
  def tableSpec(t: model.TableReference): String =
    s"${t.getProjectId}.${t.getDatasetId}.${t.getTableId}"

  def tablesEqual(t: TableId, t1: TableId): Boolean = {
    t1.getProject == t.getProject &&
    t1.getDataset == t.getDataset &&
    t1.getTable == t.getTable
  }

  def tablesEqual(t0: TableId, t1: Option[TableId]): Boolean = {
    t1.exists{t => tablesEqual(t0, t)}
  }

  /** Counts rows in a table
    * @param bq BigQuery
    * @param table TableId
    * @return row count
    */
  def rowCount(bq: BigQuery, table: TableId): Long = {
    val tbl = bq.getTable(table)
    val n = tbl.getNumRows.longValueExact
    val nBytes = tbl.getNumBytes.longValue
    val ts = StatsUtil.epochMillis2Timestamp(tbl.getLastModifiedTime)
    logger.info(s"${tableSpec(table)} contains $n rows $nBytes bytes as of $ts")
    n
  }

  /** Submits a query with Dry Run enabled
    *
    * @param bq BigQuery client instance
    * @param cfg QueryJobConfiguration
    * @param jobId QueryJobConfiguration
    * @param timeoutSeconds maximum wait time
    * @return
    */
  def queryDryRun(bq: BigQuery,
                  cfg: QueryJobConfiguration,
                  jobId: JobId,
                  timeoutSeconds: Long): Job = {
    val jobId1 = jobId.toBuilder.setJob(jobId.getJob+"_dryrun")
    bq.create(JobInfo.of(jobId1.build, cfg.toBuilder.setDryRun(true).build))
    waitForJob(bq, jobId, timeoutMillis = timeoutSeconds * 1000L)
  }

  /** Submits a BigQuery job and waits for completion
    * returns a completed job or throws exception
    *
    * @param bq BigQuery client instance
    * @param cfg QueryJobConfiguration
    * @param jobId JobId
    * @param timeoutSeconds maximum time to wait for status change
    * @param sync if set to false, return without waiting for status change
    * @return Job
    */
  def runJob(bq: BigQuery,
             cfg: QueryJobConfiguration,
             jobId: JobId,
             timeoutSeconds: Long,
             sync: Boolean): Job = {
    try {
      val job = bq.create(JobInfo.of(jobId, cfg))
      if (sync) {
        logger.info(s"Waiting for Job jobid=${BQ.toStr(jobId)}")
        waitForJob(bq, jobId, timeoutMillis = timeoutSeconds * 1000L)
      } else {
        logger.info(s"Returning without waiting for job to complete because sync=false jobid=${BQ.toStr(jobId)}")
        job
      }
    } catch {
      case e: BigQueryException =>
        if (e.getReason == "duplicate" && e.getMessage.startsWith("Already Exists: Job")) {
          logger.warn(s"Job already exists, waiting for completion.\njobid=${BQ.toStr(jobId)}")
          waitForJob(bq, jobId, timeoutMillis = timeoutSeconds * 1000L)
        } else {
          logger.error(s"BQ API call failed for:$jobId\n$cfg\n$e")
          throw new RuntimeException(e)
        }
    }
  }

  def toStr(j: JobId): String =
    s"${j.getProject}:${j.getLocation}.${j.getJob}"

  @tailrec
  def waitForJob(bq: BigQuery,
                 jobId: JobId,
                 waitMillis: Long = 2000,
                 maxWaitMillis: Long = 60000,
                 timeoutMillis: Long = 300000,
                 retries: Int = 120): Job = {
    if (timeoutMillis <= 0){
      throw new RuntimeException(s"Timed out waiting for ${toStr(jobId)}")
    } else if (retries <= 0){
      throw new RuntimeException(s"Timed out waiting for ${toStr(jobId)} - retry limit reached")
    }
    Try{Option(bq.getJob(jobId))} match {
      case Success(Some(job)) if isDone(job) =>
        logger.info(s"${toStr(jobId)} Status = DONE")
        job
      case Failure(e) =>
        logger.error(s"BigQuery Job failed jobid=${toStr(jobId)}\n" +
          s"message=${e.getMessage}", e)
        throw e
      case Success(None) =>
        throw new RuntimeException(s"BigQuery Job not found jobid=${toStr(jobId)}")
      case Success(_) =>
        Util.sleepOrYield(waitMillis)
        waitForJob(bq, jobId, math.min(waitMillis * 2, maxWaitMillis),
          maxWaitMillis, timeoutMillis - waitMillis, retries - 1)
    }
  }

  def isDone(job: Job): Boolean =
    job.getStatus != null && job.getStatus.getState == JobStatus.State.DONE

  def hasError(job: Job): Boolean = {
    Option(job.getStatus)
      .flatMap(x => Option(x.getError))
      .isDefined ||
    hasExecutionErrors(job)
  }

  def hasExecutionErrors(job: Job): Boolean = {
    Option(job.getStatus)
      .flatMap(x => Option(x.getExecutionErrors))
      .map(_.size())
      .exists(_ > 0)
  }

  case class BQError(message: Option[String],
                     reason: Option[String],
                     location: Option[String]) {
    override def toString: String = {
      s"BigQueryError:\nreason: ${reason.getOrElse("no reason given")}\nmessage: ${message.getOrElse("no message given")}"
    }
  }

  case class BQStatus(state: JobStatus.State,
                      error: Option[BQError],
                      executionErrors: Seq[BQError]) {
    def hasError: Boolean = error.isDefined || executionErrors.nonEmpty
    def isDone: Boolean = state == JobStatus.State.DONE
  }

  def getExecutionErrors(status: JobStatus): Seq[BQError] = {
    Option(status)
      .flatMap(x => Option(x.getExecutionErrors))
      .map(_.asScala.flatMap(toBQError).toArray.toSeq)
      .getOrElse(Seq.empty)
  }

  def toBQError(error: BigQueryError): Option[BQError] = {
    if (error == null) None
    else Option(BQError(
      message = Option(error.getMessage),
      reason = Option(error.getReason),
      location = Option(error.getLocation)
    ))
  }

  def getStatus(job: Job): Option[BQStatus] = {
    val status = job.getStatus
    if (status == null) None
    else {
      Option(BQStatus(
        state = status.getState,
        error = toBQError(status.getError),
        executionErrors = getExecutionErrors(status)))
    }
  }

  def throwOnError(job: Job, status: BQStatus): Unit = {
    if (job == null) throw new IllegalStateException("job not found")
    val sb = new StringBuilder
    if (status.hasError) {
      if (job.getJobId != null)
        sb.append(s"${BQ.toStr(job.getJobId)} has errors\n")
      job.getConfiguration[JobConfiguration] match {
        case c: CopyJobConfiguration =>
        case c: ExtractJobConfiguration =>
        case c: LoadJobConfiguration =>
        case c: QueryJobConfiguration =>
          sb.append("Query:\n")
          sb.append(c.getQuery)
          sb.append("\n")
        case _ =>
      }
      sb.append("\n")
      sb.append("Errors:\n")
      status.error.foreach { err =>
        sb.append(err.toString)
        sb.append("\n")
      }
      if (status.executionErrors.nonEmpty) {
        sb.append("Execution Errors:\n")
      }
      status.executionErrors.foreach{err =>
        sb.append(err.toString)
        sb.append("\n")
      }
      val msg = sb.result
      logger.error(msg)
      throw new RuntimeException(msg)
    }
  }

  /**
    *
    * @param datasetSpec [PROJECT]:[DATASET] may override project
    * @param defaultProject BigQuery billing project
    * @return
    */
  def resolveDataset(datasetSpec: String, defaultProject: String): DatasetId = {
    val i =
      if (datasetSpec.contains('.'))
        datasetSpec.indexOf('.')
      else datasetSpec.indexOf(':')
    val project = if (i > 0) datasetSpec.substring(0, i) else defaultProject
    val dataset = datasetSpec.substring(i+1)
    DatasetId.of(project, dataset)
  }

  /** Read TableId from String, allowing for either : or . as delimiters
    *
    * @param tableSpec project:dataset.table or project.dataset.table
    * @param defaultProject project to use if not provided by tablespec or dataset
    * @param defaultDataset project:dataset or project.dataset may override project
    * @return
    */
  def resolveTableSpec(tableSpec: String,
                       defaultProject: String,
                       defaultDataset: String): TableId = {
    val i =
      if (tableSpec.count(_ == '.') == 2)
        tableSpec.indexOf('.')
      else tableSpec.indexOf(':')
    val j = tableSpec.indexOf('.',i+1)

    val default =
      if (defaultProject.nonEmpty && defaultDataset.nonEmpty) {
        val datasetId = resolveDataset(defaultDataset, defaultProject)
        Option(datasetId)
      } else {
        logger.warn("default dataset not set")
        None
      }

    val project =
      if (i > 0) tableSpec.substring(0, i)
      else default.map(_.getProject).getOrElse(defaultProject)

    val dataset =
      if (j > 0) tableSpec.substring(i+1, j)
      else default.map(_.getDataset).getOrElse(defaultDataset)

    val table =
      if (j > 0) tableSpec.substring(j+1, tableSpec.length)
      else tableSpec
    TableId.of(project, dataset, table)
  }

  def parseSchemaUpdateOption(schemaUpdateOption: Seq[String]): java.util.List[JobInfo.SchemaUpdateOption] = {
    val schemaUpdateOptionsBuilder = ImmutableList.builder[JobInfo.SchemaUpdateOption]()
    if (schemaUpdateOption.contains(JobInfo.SchemaUpdateOption.ALLOW_FIELD_ADDITION.name())) {
      schemaUpdateOptionsBuilder
        .add(JobInfo.SchemaUpdateOption.ALLOW_FIELD_ADDITION)
    }
    if (schemaUpdateOption.contains(JobInfo.SchemaUpdateOption.ALLOW_FIELD_RELAXATION.name())) {
      schemaUpdateOptionsBuilder
        .add(JobInfo.SchemaUpdateOption.ALLOW_FIELD_RELAXATION)
    }
    schemaUpdateOptionsBuilder.build
  }

  def parseField(s: String): Field = {
    val Array(field,dataType) = s.split(':')
    val typeName = StandardSQLTypeName.valueOf(dataType)
    Field.newBuilder(field,typeName).build
  }

  def parseSchema(s: Seq[String]): Schema = {
    Schema.of(s.map(parseField):_*)
  }

  def isValidTableName(s: String): Boolean = {
    s.matches("[a-zA-Z0-9_]{1,1024}")
  }

  def isValidBigQueryName(s: String): Boolean =
    s.matches("[a-zA-Z0-9_]{1,1024}")

  /** Convert Java List to Scala Seq */
  def l2l[T](l: java.util.List[T]): Seq[T] = {
    if (l == null) Nil
    else {
      val buf = ListBuffer.empty[T]
      l.forEach(buf.append)
      buf.toList
    }
  }

  def mv[K,V](m: java.util.Map[K,V]): Seq[V] = {
    if (m == null) Nil
    else {
      val buf = ListBuffer.empty[V]
      m.forEach{(_, v) => buf.append(v)}
      buf.toList
    }
  }

  def logInsertErrors(res: InsertAllResponse): Unit = {
    res match {
      case x if x.hasErrors =>
        val errors = mv(x.getInsertErrors).flatMap(l2l).mkString("\n")
        logger.warn(s"Failed to insert rows:\n$errors")
      case _ =>
    }
  }

  def insertRow(content: java.util.Map[String,Any],
                bq: BigQuery,
                tableId: TableId): Unit = {
    val request = InsertAllRequest.of(tableId, RowToInsert.of(content))
    val result = bq.insertAll(request)
    if (result.hasErrors) {
      val errors: Seq[BigQueryError] = mv(result.getInsertErrors).flatMap(l2l)
      val tblSpec = s"${tableId.getProject}.${tableId.getDataset}.${tableId.getTable}"
      val sb = new StringBuilder
      sb.append(s"Errors inserting row into $tblSpec\n")
      content.forEach{(k,v) => sb.append(s"$k -> $v\n")}
      sb.append("\n")
      errors.foreach{e =>
        sb.append("BigQueryError:\n")
        sb.append(s"message: ${e.getMessage}\n")
        sb.append(s"reason: ${e.getReason}\n\n")
      }
      logger.error(sb.result)
    }
  }

  case class BQField(name: String,
                     typ: StandardSQLTypeName = StandardSQLTypeName.STRING,
                     mode: Field.Mode = Field.Mode.NULLABLE)

  case class BQSchema(fields: Seq[BQField] = Nil) {
    private val fieldNames: Set[String] = fields.map(_.name).toSet
    def contains(name: String): Boolean = fieldNames.contains(name)
  }

  /** Builder meant to be used with streaming insert
    * Won't insert columns that don't exist in the schema
    */
  case class SchemaRowBuilder(schema: Option[BQSchema] = None) {
    private val row = new java.util.HashMap[String,Any]()
    def put(name: String, value: Any): SchemaRowBuilder = {
      if (schema.isDefined && schema.get.contains(name) && value != null) {
        value match {
          case None =>
          case s: String if s.isEmpty =>
          case _ =>
            row.put(name, value)
        }
      }
      this
    }
    def build: java.util.Map[String,Any] = row
    def clear(): Unit = row.clear()
    def insert(bq: BigQuery, tableId: TableId, id: String): InsertAllResponse =
      bq.insertAll(InsertAllRequest.newBuilder(tableId).addRow(id, row).build)
  }

  def getFields(x: TableDefinition): BQSchema = {
    val buf = ListBuffer.empty[BQField]
    x.getSchema.getFields.forEach{f =>
      if (f.getType == null)
        logger.warn(s"field type not set for ${f.getName}")
      else
        buf.append(BQField(f.getName, f.getType.getStandardType, f.getMode))
    }

    if (x.getSchema == null)
      logger.warn(s"schema not found for standard table")
    BQSchema(buf.result)
  }

  def checkTableDef(bq: BigQuery, tableId: TableId, expectedSchema: BQSchema): Option[BQSchema] = {
    val ts = BQ.tableSpec(tableId)
    Option(bq.getTable(tableId)) match {
      case Some(table) =>
        table.getDefinition[TableDefinition] match {
          case x: StandardTableDefinition =>
            val schema = getFields(x)
            if (schema != expectedSchema) {
              logger.warn(s"Schema mismatch\nExpected:\n$expectedSchema\n\nGot:\n$schema")
              Option(schema)
            } else Option(schema)
          case x =>
            val typ = x.getClass.getSimpleName.stripSuffix("$").stripSuffix("Definition")
            logger.warn(s"stats table is a $typ but should be a standard table. tablespec=$ts")
            None
        }
      case None =>
        logger.warn(s"stats table not found. tablespec=$ts")
        None
    }
  }

  def apiClient(credentials: Credentials): Bigquery =
    new Bigquery(CCATransportFactory.create,
      JacksonFactory.getDefaultInstance, new HttpCredentialsAdapter(credentials))

  def apiGetJob(bq: Bigquery, jobId: JobId): model.Job = {
    val req = bq.jobs().get(jobId.getProject, jobId.getJob)
    req.setLocation(jobId.getLocation)
    runWithRetry(req.execute(), "Bigquery.Jobs.Get.execute()")
  }

  def readsFrom(step: model.ExplainQueryStep, t: TableId): Boolean =
    readsFrom(step, tableSpec(t))

  def readsFrom(step: model.ExplainQueryStep, t: String): Boolean = {
    if (step.getKind == null || step.getSubsteps == null) false
    else
      step.getKind == "READ" &&
      step.getSubsteps.asScala.exists{subStep =>
        subStep.startsWith("FROM ") && subStep.endsWith(t)
      }
  }

  def readsFrom(stage: model.ExplainQueryStage, t: model.TableReference): Boolean =
    readsFrom(stage, tableSpec(t))

  def readsFrom(stage: model.ExplainQueryStage, t: String): Boolean = {
    stage.getSteps.asScala.exists(step => readsFrom(step,t))
  }
}
