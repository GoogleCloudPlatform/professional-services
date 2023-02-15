package com.google.cloud.imf.util

import com.google.api.gax.paging.Page
import com.google.cloud.Policy
import com.google.cloud.bigquery._


class BigQueryWithRetries(bq: BigQuery, override val retriesCount: Int, override val retriesTimeoutMillis: Int) extends BigQuery with GoogleApiL2Retrier {
  private def canRetry(ex: Throwable): Boolean = !(ex.isInstanceOf[BigQueryException] && ex.getMessage.contains("Already Exists: Job"))

  override def create(jobInfo: JobInfo, options: BigQuery.JobOption*): Job = runWithRetry(bq.create(jobInfo, options: _*), "BigQuery.create()", canRetry)

  override def create(datasetInfo: DatasetInfo, options: BigQuery.DatasetOption*): Dataset = runWithRetry(bq.create(datasetInfo, options: _*), "BigQuery.create()", canRetry)

  override def create(tableInfo: TableInfo, options: BigQuery.TableOption*): Table = runWithRetry(bq.create(tableInfo, options: _*), "BigQuery.create()", canRetry)

  override def create(routineInfo: RoutineInfo, options: BigQuery.RoutineOption*): Routine = runWithRetry(bq.create(routineInfo, options: _*), "BigQuery.create()", canRetry)

  override def getJob(jobId: JobId, options: BigQuery.JobOption*): Job = runWithRetry(bq.getJob(jobId, options: _*), "BigQuery.getJob()")

  override def getJob(jobId: String, options: BigQuery.JobOption*): Job = runWithRetry(bq.getJob(jobId, options: _*), "BigQuery.getJob()")

  override def getTable(datasetId: String, tableId: String, options: BigQuery.TableOption*): Table = runWithRetry(bq.getTable(datasetId, tableId, options: _*),"BigQuery.getTable()")

  override def getTable(tableId: TableId, options: BigQuery.TableOption*): Table = runWithRetry(bq.getTable(tableId, options: _*),"BigQuery.getTable()")

  override def listTableData(datasetId: String, tableId: String, options: BigQuery.TableDataListOption*): TableResult = runWithRetry(bq.listTableData(datasetId, tableId, options: _*),"BigQuery.listTableData()")

  override def listTableData(tableId: TableId, options: BigQuery.TableDataListOption*): TableResult = runWithRetry(bq.listTableData(tableId, options: _*),"BigQuery.listTableData()")

  override def listTableData(datasetId: String, tableId: String, schema: Schema, options: BigQuery.TableDataListOption*): TableResult = runWithRetry(bq.listTableData(datasetId, tableId, schema, options: _*),"BigQuery.listTableData()")

  override def listTableData(tableId: TableId, schema: Schema, options: BigQuery.TableDataListOption*): TableResult = runWithRetry(bq.listTableData(tableId, schema, options: _*),"BigQuery.listTableData()")

  //no retries
  override def getDataset(datasetId: String, options: BigQuery.DatasetOption*): Dataset = bq.getDataset(datasetId, options: _*)

  override def getDataset(datasetId: DatasetId, options: BigQuery.DatasetOption*): Dataset = bq.getDataset(datasetId, options: _*)

  override def listDatasets(options: BigQuery.DatasetListOption*): Page[Dataset] = bq.listDatasets(options: _*)

  override def listDatasets(projectId: String, options: BigQuery.DatasetListOption*): Page[Dataset] = bq.listDatasets(projectId, options: _*)

  override def delete(datasetId: String, options: BigQuery.DatasetDeleteOption*): Boolean = bq.delete(datasetId, options: _*)

  override def delete(datasetId: DatasetId, options: BigQuery.DatasetDeleteOption*): Boolean = bq.delete(datasetId, options: _*)

  @deprecated
  override def delete(datasetId: String, tableId: String): Boolean = bq.delete(datasetId, tableId)

  override def delete(tableId: TableId): Boolean = bq.delete(tableId)

  override def delete(modelId: ModelId): Boolean = bq.delete(modelId)

  override def delete(routineId: RoutineId): Boolean = bq.delete(routineId)

  override def delete(jobId: JobId): Boolean = bq.delete(jobId)

  override def update(datasetInfo: DatasetInfo, options: BigQuery.DatasetOption*): Dataset = bq.update(datasetInfo, options: _*)

  override def update(tableInfo: TableInfo, options: BigQuery.TableOption*): Table = bq.update(tableInfo, options: _*)

  override def update(modelInfo: ModelInfo, options: BigQuery.ModelOption*): Model = bq.update(modelInfo, options: _*)

  override def update(routineInfo: RoutineInfo, options: BigQuery.RoutineOption*): Routine = bq.update(routineInfo, options: _*)

  override def getModel(datasetId: String, modelId: String, options: BigQuery.ModelOption*): Model = bq.getModel(datasetId, modelId, options: _*)

  override def getModel(tableId: ModelId, options: BigQuery.ModelOption*): Model = bq.getModel(tableId, options: _*)

  override def getRoutine(datasetId: String, routineId: String, options: BigQuery.RoutineOption*): Routine = bq.getRoutine(datasetId, routineId, options: _*)

  override def getRoutine(routineId: RoutineId, options: BigQuery.RoutineOption*): Routine = bq.getRoutine(routineId, options: _*)

  override def listRoutines(datasetId: String, options: BigQuery.RoutineListOption*): Page[Routine] = bq.listRoutines(datasetId, options: _*)

  override def listRoutines(datasetId: DatasetId, options: BigQuery.RoutineListOption*): Page[Routine] = bq.listRoutines(datasetId, options: _*)

  override def listTables(datasetId: String, options: BigQuery.TableListOption*): Page[Table] = bq.listTables(datasetId, options: _*)

  override def listTables(datasetId: DatasetId, options: BigQuery.TableListOption*): Page[Table] = bq.listTables(datasetId, options: _*)

  override def listModels(datasetId: String, options: BigQuery.ModelListOption*): Page[Model] = bq.listModels(datasetId, options: _*)

  override def listModels(datasetId: DatasetId, options: BigQuery.ModelListOption*): Page[Model] = bq.listModels(datasetId, options: _*)

  override def listPartitions(tableId: TableId): java.util.List[String] = bq.listPartitions(tableId)

  override def insertAll(request: InsertAllRequest): InsertAllResponse = bq.insertAll(request)

  override def listJobs(options: BigQuery.JobListOption*): Page[Job] = bq.listJobs(options: _*)

  override def cancel(jobId: String): Boolean = bq.cancel(jobId)

  override def cancel(jobId: JobId): Boolean = bq.cancel(jobId)

  override def query(configuration: QueryJobConfiguration, options: BigQuery.JobOption*): TableResult = bq.query(configuration, options: _*)

  override def query(configuration: QueryJobConfiguration, jobId: JobId, options: BigQuery.JobOption*): TableResult = bq.query(configuration, jobId, options: _*)

  override def getQueryResults(jobId: JobId, options: BigQuery.QueryResultsOption*): QueryResponse = bq.getQueryResults(jobId, options: _*)

  override def writer(writeChannelConfiguration: WriteChannelConfiguration): TableDataWriteChannel = bq.writer(writeChannelConfiguration)

  override def writer(jobId: JobId, writeChannelConfiguration: WriteChannelConfiguration): TableDataWriteChannel = bq.writer(jobId, writeChannelConfiguration)

  override def getIamPolicy(tableId: TableId, options: BigQuery.IAMOption*): Policy = bq.getIamPolicy(tableId, options: _*)

  override def setIamPolicy(tableId: TableId, policy: Policy, options: BigQuery.IAMOption*): Policy = bq.setIamPolicy(tableId, policy, options: _*)

  override def testIamPermissions(table: TableId, permissions: java.util.List[String], options: BigQuery.IAMOption*): java.util.List[String] = bq.testIamPermissions(table, permissions, options: _*)

  override def getOptions: BigQueryOptions = bq.getOptions

  override def createConnection(connectionSettings: ConnectionSettings): Connection = bq.createConnection(connectionSettings)

  override def createConnection(): Connection = bq.createConnection()
}
