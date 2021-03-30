/*
 * Script: BQ Audit
 * Author: ryanmcdowell, freedomofnet, mihirborkar
 * Description:
 * This SQL Script creates a materialized source table acting as input to the Dashboard.
 */

WITH BQAudit AS (
  SELECT
    protopayload_auditlog.authenticationInfo.principalEmail,
    protopayload_auditlog.requestMetadata.callerIp,
    protopayload_auditlog.serviceName,
    protopayload_auditlog.methodName,
    protopayload_auditlog.servicedata_v1_bigquery.jobCompletedEvent.eventName,
    protopayload_auditlog.servicedata_v1_bigquery.jobCompletedEvent.job.jobName.projectId,
    protopayload_auditlog.servicedata_v1_bigquery.jobCompletedEvent.job.jobName.jobId,
    protopayload_auditlog.servicedata_v1_bigquery.jobCompletedEvent.job.jobStatistics.createTime,
    protopayload_auditlog.servicedata_v1_bigquery.jobCompletedEvent.job.jobStatistics.startTime,
    protopayload_auditlog.servicedata_v1_bigquery.jobCompletedEvent.job.jobStatistics.endTime,
    protopayload_auditlog.servicedata_v1_bigquery.jobCompletedEvent.job.jobStatus.error.code
    AS errorCode,
    protopayload_auditlog.servicedata_v1_bigquery.jobCompletedEvent.job.jobStatus.error.message
    AS errorMessage,
    TIMESTAMP_DIFF(
      protopayload_auditlog.servicedata_v1_bigquery.jobCompletedEvent.job.jobStatistics.endTime,
      protopayload_auditlog.servicedata_v1_bigquery.jobCompletedEvent.job.jobStatistics.startTime, MILLISECOND)
      AS runtimeMs,
    /* This code extracts the column specific to the Copy operation in BQ */
    protopayload_auditlog.servicedata_v1_bigquery.jobCompletedEvent.job.jobConfiguration.tableCopy,
    /* This code extracts the column specific to the Extract operation in BQ */
    protopayload_auditlog.servicedata_v1_bigquery.jobCompletedEvent.job.jobConfiguration.extract,
    /* The following code extracts the columns specific to the Load operation in BQ */
    protopayload_auditlog.servicedata_v1_bigquery.jobCompletedEvent.job.jobStatistics.totalLoadOutputBytes,
    protopayload_auditlog.servicedata_v1_bigquery.jobCompletedEvent.job.jobConfiguration.load,
    /* The following code extracts columns specific to Query operation in BQ */
    TIMESTAMP_DIFF(
      protopayload_auditlog.servicedata_v1_bigquery.jobCompletedEvent.job.jobStatistics.endTime,
      protopayload_auditlog.servicedata_v1_bigquery.jobCompletedEvent.job.jobStatistics.startTime, SECOND)
      AS runtimeSecs,
    CAST(CEILING((TIMESTAMP_DIFF(
      protopayload_auditlog.servicedata_v1_bigquery.jobCompletedEvent.job.jobStatistics.endTime,
      protopayload_auditlog.servicedata_v1_bigquery.jobCompletedEvent.job.jobStatistics.startTime, SECOND)) / 60) AS INT64)
      AS executionMinuteBuckets,
    IF(COALESCE(protopayload_auditlog.servicedata_v1_bigquery.jobCompletedEvent.job.jobStatistics.totalProcessedBytes,
      protopayload_auditlog.servicedata_v1_bigquery.jobCompletedEvent.job.jobStatistics.totalSlotMs,
      protopayload_auditlog.servicedata_v1_bigquery.jobCompletedEvent.job.jobStatus.error.code) IS NULL, TRUE, FALSE
    ) AS isCached,
    protopayload_auditlog.servicedata_v1_bigquery.jobCompletedEvent.job.jobStatistics.totalSlotMs,
    protopayload_auditlog.servicedata_v1_bigquery.jobCompletedEvent.job.jobStatistics.totalTablesProcessed,
    protopayload_auditlog.servicedata_v1_bigquery.jobCompletedEvent.job.jobStatistics.totalViewsProcessed,
    protopayload_auditlog.servicedata_v1_bigquery.jobCompletedEvent.job.jobStatistics.totalProcessedBytes,
    protopayload_auditlog.servicedata_v1_bigquery.jobCompletedEvent.job.jobStatistics.totalBilledBytes,
    protopayload_auditlog.servicedata_v1_bigquery.jobCompletedEvent.job.jobStatistics.billingTier,
    protopayload_auditlog.servicedata_v1_bigquery.jobCompletedEvent.job.jobConfiguration.query,
    protopayload_auditlog.servicedata_v1_bigquery.jobCompletedEvent.job.jobStatistics.referencedTables,
    protopayload_auditlog.servicedata_v1_bigquery.jobCompletedEvent.job.jobStatistics.referencedViews
    /* This ends the code snippet that extracts columns specific to Query operation in BQ */
  FROM
    `data-analytics-pocs.billing.cloudaudit_googleapis_com_data_access_*`
  WHERE
    protopayload_auditlog.serviceName = 'bigquery.googleapis.com'
    AND protopayload_auditlog.methodName = 'jobservice.jobcompleted'
    AND protopayload_auditlog.servicedata_v1_bigquery.jobCompletedEvent.eventName IN
    (
      'table_copy_job_completed',
      'query_job_completed',
      'extract_job_completed',
      'load_job_completed'
    )
    AND DATE_DIFF(CURRENT_DATE(), DATE(protopayload_auditlog.servicedata_v1_bigquery.jobCompletedEvent.job.jobStatistics.startTime), month) <= 12
)


/* This code queries BQAudit */

SELECT
  principalEmail,
  callerIp,
  serviceName,
  methodName,
  eventName,
  projectId,
  jobId,
  errorCode,
  errorMessage,
  STRUCT(
    EXTRACT(MINUTE FROM startTime) AS minuteOfDay,
    EXTRACT(HOUR FROM startTime) AS hourOfDay,
    EXTRACT(DAYOFWEEK FROM startTime) - 1 AS dayOfWeek,
    EXTRACT(DAYOFYEAR FROM startTime) AS dayOfYear,
    EXTRACT(WEEK FROM startTime) AS week,
    EXTRACT(MONTH FROM startTime) AS month,
    EXTRACT(QUARTER FROM startTime) AS quarter,
    EXTRACT(YEAR FROM startTime) AS year
  ) AS date,
  createTime,
  startTime,
  endTime,
  runtimeMs,
  runtimeSecs,
  tableCopy, /* This code queries data specific to the Copy operation */
  CONCAT(tableCopy.destinationTable.datasetId, '.', tableCopy.destinationTable.tableId)
    AS tableCopyDestinationTableRelativePath,
  CONCAT(tableCopy.destinationTable.projectId, '.', tableCopy.destinationTable.datasetId, '.',
    tableCopy.destinationTable.tableId) AS tableCopyDestinationTableAbsolutePath,
  IF(eventName = 'table_copy_job_completed', 1, 0) AS numCopies, /* This code queries data specific to the Copy operation */
  /* The following code queries data specific to the Load operation in BQ */
  totalLoadOutputBytes,
  (totalLoadOutputBytes / pow(2,30)) AS totalLoadOutputGigabytes,
  (totalLoadOutputBytes / pow(2,40)) AS totalLoadOutputTerabytes,
  STRUCT(
    load.sourceUris,
    STRUCT(
      load.destinationTable.projectId,
      load.destinationTable.datasetId,
      load.destinationTable.tableId,
      CONCAT(load.destinationTable.datasetId, '.', load.destinationTable.tableId) AS relativePath,
      CONCAT(load.destinationTable.projectId, '.', load.destinationTable.datasetId,
        '.', load.destinationTable.tableId) AS absolutePath
    ) AS destinationTable,
    load.createDisposition,
    load.writeDisposition,
    load.schemaJson
  ) AS load,
  IF(eventName = 'load_job_completed', 1, 0) AS numLoads,
  /* This ends the code snippet that queries columns specific to the Load operation in BQ */
  /* The following code queries data specific to the Extract operation in BQ */
  REGEXP_CONTAINS(jobId, 'beam') AS isBeamJob,
  STRUCT(
    `extract`.destinationUris,
    STRUCT(
      `extract`.sourceTable.projectId,
      `extract`.sourceTable.datasetId,
      `extract`.sourceTable.tableId,
      CONCAT(`extract`.sourceTable.datasetId, '.', `extract`.sourceTable.tableId)
      AS relativeTableRef,
      CONCAT(`extract`.sourceTable.projectId, '.', `extract`.sourceTable.datasetId,
      '.', `extract`.sourceTable.tableId) AS absoluteTableRef
    ) AS sourceTable
  ) AS `extract`,
  IF(eventName = 'extract_job_completed', 1, 0) AS numExtracts,
  /* This ends the code snippet that queries columns specific to the Extract operation in BQ */
  /* The following code queries data specific to the Query operation in BQ */
  REGEXP_CONTAINS(query.query, 'cloudaudit_googleapis_com_data_access_') AS isAuditDashboardQuery,
  errorCode IS NOT NULL AS isError,
  REGEXP_CONTAINS(errorMessage, 'timeout') AS isTimeout,
  isCached,
  IF(isCached, 1, 0) AS numCached,
  totalSlotMs,
  totalSlotMs / runtimeMs AS avgSlots,
  /* The following statement breaks down the query into minute buckets
   * and provides the average slot usage within that minute. This is a
   * crude way of making it so you can retrieve the average slot utilization
   * for a particular minute across multiple queries.
   */
  ARRAY(
    SELECT
      STRUCT(
        TIMESTAMP_TRUNC(TIMESTAMP_ADD(startTime, INTERVAL bucket_num MINUTE),
        MINUTE) AS time,
        totalSlotMs / runtimeMs AS avgSlotUsage
      )
    FROM
      UNNEST(GENERATE_ARRAY(1, executionMinuteBuckets)) AS bucket_num
  ) AS executionTimeline,
  totalTablesProcessed,
  totalViewsProcessed,
  totalProcessedBytes,
  totalBilledBytes,
  (totalBilledBytes / pow(2,30)) AS totalBilledGigabytes,
  (totalBilledBytes / pow(2,40)) AS totalBilledTerabytes,
  (totalBilledBytes / pow(2,40)) * 5 AS estimatedCostUsd,
  billingTier,
  query,
  CONCAT(query.destinationTable.datasetId, '.', query.destinationTable.tableId) AS queryDestinationTableRelativePath,
  CONCAT(query.destinationTable.projectId, '.', query.destinationTable.datasetId, '.',
    query.destinationTable.tableId) AS queryDestinationTableAbsolutePath,
  referencedTables,
  referencedViews,
  IF(eventName = 'query_job_completed', 1, 0) AS queries
  /* This ends the code snippet that queries columns specific to the Query operation in BQ */
FROM
  BQAudit
