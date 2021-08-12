# Copyright 2021 Google LLC
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#     http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.
# Create summary table view
from google.cloud import bigquery
from google.cloud.exceptions import NotFound

class CreateView():

    def __init__(self, project_id, data_project_id, dataset_id, audit_log_table,
                 location, audit_log_partitioned, destination_project_id,
                 destination_dataset_id, summary_table_name):
        # Source Project Dataset
        self.project_id = project_id
        self.data_project_id = data_project_id
        self.dataset_id = dataset_id
        self.audit_log_table = audit_log_table
        self.location = location
        self.audit_log_partitioned = audit_log_partitioned

        ## Destination View
        self.destination_project_id = destination_project_id
        self.destination_dataset_id = destination_dataset_id
        self.summary_table_name = summary_table_name

    def get_datetime_constraint(self, start_date, end_date):
        if not start_date or not end_date:
            return ""
        elif self.audit_log_partitioned:
            return f"_PARTITIONTIME BETWEEN '{start_date}' AND '{end_date}' AND "
        else:
            return f"CAST(protopayload_auditlog.servicedata_v1_bigquery.jobCompletedEvent.job.jobStatistics.createTime AS datetime) >= CAST('{start_date}' AS datetime) AND CAST(protopayload_auditlog.servicedata_v1_bigquery.jobCompletedEvent.job.jobStatistics.createTime AS datetime) <= CAST('{end_date}' AS datetime) AND "

    # Create completed job Table Query
    def create_completed_job_view(self):

        sql_template = """WITH BQAudit AS (
        SELECT
            protopayload_auditlog.authenticationInfo.principalEmail,
            protopayload_auditlog.requestMetadata.callerIp,
            protopayload_auditlog.requestMetadata.callerSuppliedUserAgent,
            timestamp,
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
            TIMESTAMP_DIFF(
            protopayload_auditlog.servicedata_v1_bigquery.jobCompletedEvent.job.jobStatistics.startTime,
            protopayload_auditlog.servicedata_v1_bigquery.jobCompletedEvent.job.jobStatistics.createTime, MILLISECOND)
            AS lagtimeMs,
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
            TIMESTAMP_DIFF(
            protopayload_auditlog.servicedata_v1_bigquery.jobCompletedEvent.job.jobStatistics.startTime,
            protopayload_auditlog.servicedata_v1_bigquery.jobCompletedEvent.job.jobStatistics.createTime, SECOND)
            AS lagtimeSecs,
            CAST(CEILING((TIMESTAMP_DIFF(
            protopayload_auditlog.servicedata_v1_bigquery.jobCompletedEvent.job.jobStatistics.endTime,
            protopayload_auditlog.servicedata_v1_bigquery.jobCompletedEvent.job.jobStatistics.startTime, SECOND)) / 60) AS INT64)
            AS executionMinuteBuckets,
            IF(COALESCE(protopayload_auditlog.servicedata_v1_bigquery.jobCompletedEvent.job.jobStatistics.totalProcessedBytes,
            protopayload_auditlog.servicedata_v1_bigquery.jobCompletedEvent.job.jobStatistics.totalSlotMs,
            protopayload_auditlog.servicedata_v1_bigquery.jobCompletedEvent.job.jobStatus.error.code) IS NULL, TRUE, FALSE
            ) AS isCached,
            protopayload_auditlog.servicedata_v1_bigquery.jobCompletedEvent.job.jobStatistics.reservationUsage,
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
            `{}.{}.{}`
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
        )


        /* This code queries BQAudit */

        SELECT
        principalEmail,
        IF(principalEmail LIKE '%iam.gserviceaccount.com', 1, 0 ) AS isService,
        timestamp,
        callerIp,
        serviceName,
        callerSuppliedUserAgent,
        methodName,
        eventName,
        projectId,
        jobId,
        errorCode,
        errorMessage,
        EXTRACT(MINUTE FROM startTime) AS minuteOfDay,
        EXTRACT(HOUR FROM startTime) AS hourOfDay,
        EXTRACT(DAYOFWEEK FROM startTime) - 1 AS dayOfWeek,
        EXTRACT(DAYOFYEAR FROM startTime) AS dayOfYear,
        EXTRACT(WEEK FROM startTime) AS week,
        EXTRACT(MONTH FROM startTime) AS month,
        EXTRACT(QUARTER FROM startTime) AS quarter,
        EXTRACT(YEAR FROM startTime) AS year,
        DATE(startTime) AS fullDate,
        createTime,
        startTime,
        endTime,
        runtimeMs,
        runtimeSecs,
        lagtimeMs,
        lagtimeSecs,
        tableCopy, /* This code queries data specific to the Copy operation */
        CONCAT(tableCopy.destinationTable.datasetId, '.', tableCopy.destinationTable.tableId)
            AS tableCopyDestinationTableRelativePath,
        CONCAT(tableCopy.destinationTable.projectId, '.', tableCopy.destinationTable.datasetId, '.',
            tableCopy.destinationTable.tableId) AS tableCopyDestinationTableAbsolutePath,
        IF(eventName = 'table_copy_job_completed', 1, 0) AS numCopies, /* This code queries data specific to the Copy operation */
        /* The following code queries data specific to the Load operation in BQ */
        totalLoadOutputBytes,
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
        IF(errorCode IS NOT NULL, 1, 0) AS numError,
        REGEXP_CONTAINS(errorMessage, 'timeout') AS isTimeout,
        isCached,
        IF(isCached, 1, 0) AS numCached,
        reservationUsage,
        totalSlotMs,
        IF(runtimeMs <> 0, totalSlotMs / runtimeMs, 0) AS avgSlotsMS,

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
                IF(runtimeMs <> 0, totalSlotMs / runtimeMs, 0) AS avgSlotUsageMS
            )
            FROM
            UNNEST(GENERATE_ARRAY(1, executionMinuteBuckets)) AS bucket_num
        ) AS executionTimeline,
        referencedTables,
        IF(totalTablesProcessed IS NOT NULL, totalTablesProcessed, 0) as totalTablesProcessed,
        referencedViews,
        IF(totalViewsProcessed IS NOT NULL, totalViewsProcessed, 0) as totalViewsProcessed,
        totalProcessedBytes,
        totalBilledBytes,
        (totalBilledBytes / pow(2,40)) * 5 AS estimatedCostUsd,
        billingTier,
        query,
        LENGTH(query.query) as querylength,
        CONCAT(query.destinationTable.datasetId, '.', query.destinationTable.tableId) AS queryDestinationTableRelativePath,
        CONCAT(query.destinationTable.projectId, '.', query.destinationTable.datasetId, '.',
            query.destinationTable.tableId) AS queryDestinationTableAbsolutePath,
        IF(eventName = 'query_job_completed', 1, 0) AS numQueries
        /* This ends the code snippet that queries columns specific to the Query operation in BQ */
        FROM
        BQAudit"""

        client = bigquery.Client(location=self.location,
                                 project=self.destination_project_id)
        print("Client creating using default project: {}".format(
            client.project))
        shared_dataset_ref = client.dataset(self.destination_dataset_id)
        view_ref = shared_dataset_ref.table(self.summary_table_name)
        view = bigquery.Table(view_ref)
        try:
            dataset_id = self.dataset_id
            client.get_table(view_ref)
            print("Summary View already exists {}".format(
                self.summary_table_name))
        except NotFound:
            print(dataset_id)
            view.view_query = sql_template.format(self.data_project_id,
                                                  dataset_id,
                                                  self.audit_log_table)
            view = client.create_table(view)
            print("Successfully created view at {}".format(view.full_table_id))

    def create_all_job_view(self):
        self.create_completed_job_view()
