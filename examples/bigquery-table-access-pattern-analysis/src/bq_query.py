# Copyright 2021 Google LLC
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#    http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

import src.bq_name as bq_name
import src.pipeline_classes as pipeline_classes
import os
from google.cloud import bigquery

class BQQuery():
    routines_directory = 'bq_routines'
    output_table_suffix = os.getenv('OUTPUT_TABLE_SUFFIX')
    start_date = os.getenv('START_DATE')
    end_date = os.getenv('END_DATE')
    location = os.getenv('LOCATION')
    is_audit_logs_input_tables_partitioned = os.getenv('IS_AUDIT_LOGS_INPUT_TABLE_PARTITIONED')
    audit_log_data_access_table_name = bq_name.BQName.get_audit_log_data_access_table_name()
    output_dataset_name = bq_name.BQName.get_output_dataset_name()
    
    # Table names for query analysis
    job_info_with_query_info_table_name = bq_name.BQName.get_job_info_with_query_info_table_name()
    standardised_root_queries_and_aggr_job_info_table_name = bq_name.BQName.get_standardised_root_queries_and_aggr_job_info_table_name()
    smallest_subqueries_info_table_name = bq_name.BQName.get_smallest_subqueries_info_table_name()
    
    # Table names for pipeline analysis
    job_info_with_tables_info_table_name = bq_name.BQName.get_job_info_with_tables_info_table_name()
    pipeline_info_table_name = bq_name.BQName.get_pipeline_info_table_name()
    source_destination_pairs_table_name = bq_name.BQName.get_source_destination_pairs_table_name()
    table_direct_pipelines_table_name = bq_name.BQName.get_table_direct_pipelines_table_name()

    @staticmethod
    def is_safe_to_create_table():
        if not BQQuery.output_table_suffix:
            return False
        return True

    @staticmethod
    def get_datetime_constraint():
        if not BQQuery.start_date or not BQQuery.end_date:
            return "TRUE"
        elif BQQuery.is_audit_logs_input_tables_partitioned == "TRUE":
            return f"_PARTITIONTIME BETWEEN '{BQQuery.start_date}' AND '{BQQuery.end_date}'"
        else:
            return f"CAST(timestamp AS datetime) >= CAST('{BQQuery.start_date}' AS datetime) AND CAST(timestamp AS datetime) <= CAST('{BQQuery.end_date}' AS datetime)"

    @staticmethod
    def get_location():
        return BQQuery.location

    @staticmethod
    def create_functions_for_pipeline_analysis():
        # Read JS Functions file content
        getPipelineTypeAndSchedule_function_file_content= ""
        getTablesInvolvedInPipelineOfTable_function_file_content = ""
        with open(f'{BQQuery.routines_directory}/getPipelineTypeAndSchedule.js') as f:
            getPipelineTypeAndSchedule_function_file_content = f.read()
        with open(f'{BQQuery.routines_directory}/getTablesInvolvedInPipelineOfTable.js') as f:
            getTablesInvolvedInPipelineOfTable_function_file_content = f.read()

        query = f"""
        CREATE OR REPLACE FUNCTION `{BQQuery.output_dataset_name}`.getPipelineTypeAndSchedule(runHistory ARRAY<TIMESTAMP>)
        RETURNS STRUCT<pipelineType STRING, schedule STRING>
        LANGUAGE js AS r\"\"\"
        {getPipelineTypeAndSchedule_function_file_content}
        return getPipelineTypeAndSchedule(runHistory);
        \"\"\";
   
        CREATE OR REPLACE FUNCTION `{BQQuery.output_dataset_name}`.getTablesInvolvedInPipelineOfTable(table STRING, allSourceDestTablePairs ARRAY<STRUCT<sourceTable STRING, destinationTable STRING>>)
        RETURNS ARRAY<STRING>
        LANGUAGE js AS r\"\"\"
        {getTablesInvolvedInPipelineOfTable_function_file_content}
        return getTablesInvolvedInPipelineOfTable(table, allSourceDestTablePairs);
        \"\"\";
        """
        client = bigquery.Client(location=BQQuery.get_location())
        query_job = client.query(query)
        query_job.result()

    @staticmethod
    def get_query_to_create_job_info_with_tables_info_table(datetime_constraint):
        return f"""
        CREATE OR REPLACE TABLE `{BQQuery.job_info_with_tables_info_table_name}` AS
            SELECT 
                protopayload_auditlog.servicedata_v1_bigquery.jobCompletedEvent.job.jobName.jobId AS jobId,
                timestamp,
                protopayload_auditlog.authenticationInfo.principalEmail AS email, 
                resource.labels.project_id AS projectId,
                protopayload_auditlog.servicedata_v1_bigquery.jobCompletedEvent.job.jobStatistics.totalSlotMs AS totalSlotMs,
                protopayload_auditlog.servicedata_v1_bigquery.jobCompletedEvent.job.jobStatistics.totalProcessedBytes as totalProcessedBytes,
                CONCAT(
                    protopayload_auditlog.servicedata_v1_bigquery.jobCompletedEvent.job.jobConfiguration.query.destinationTable.projectId, '.', 
                    protopayload_auditlog.servicedata_v1_bigquery.jobCompletedEvent.job.jobConfiguration.query.destinationTable.datasetId, '.',
                    protopayload_auditlog.servicedata_v1_bigquery.jobCompletedEvent.job.jobConfiguration.query.destinationTable.tableId
                ) AS destinationTable,  -- this is to standardise the table path to be in dots form
                TO_JSON_STRING(
                    ARRAY(
                        SELECT * FROM (
                            SELECT
                                CONCAT(
                                    referencedTables.projectId, '.', 
                                    referencedTables.datasetId, '.',
                                    referencedTables.tableId
                                ) as tablePath
                            FROM UNNEST(protopayload_auditlog.servicedata_v1_bigquery.jobCompletedEvent.job.jobStatistics.referencedTables) as referencedTables
                            EXCEPT DISTINCT
                            SELECT
                                CONCAT(
                                    referencedViews.projectId, '.', 
                                    referencedViews.datasetId, '.',
                                    referencedViews.tableId
                                ) as tablePath
                            FROM UNNEST(protopayload_auditlog.servicedata_v1_bigquery.jobCompletedEvent.job.jobStatistics.referencedViews) as referencedViews
                        )
                        ORDER BY tablePath                    
                    )
                ) AS sourceTables -- this is to standardise the table path to be in dots form, in a JSON string of array
            FROM `{BQQuery.audit_log_data_access_table_name}`
            WHERE
            (
                protopayload_auditlog.serviceName="bigquery.googleapis.com" AND 
                protopayload_auditlog.methodName="jobservice.jobcompleted" AND 
                severity!="ERROR" AND
                protopayload_auditlog.servicedata_v1_bigquery.jobCompletedEvent.job.jobName.jobId IS NOT NULL AND
                {datetime_constraint}
            )-- this is to select query jobs only and the one that completed without `
            ;
        """
    
    @staticmethod
    def get_query_to_create_pipeline_info_table():
        return f"""
        CREATE OR REPLACE TABLE `{BQQuery.pipeline_info_table_name}` AS
            WITH pipelineCompleteInfo AS 
                (
                    SELECT 
                        ROW_NUMBER() OVER(ORDER BY destinationTable) AS pipelineId, -- ordered and incrementing id
                        ARRAY_AGG(timestamp) AS timestamps,
                        `{BQQuery.output_dataset_name}`.getPipelineTypeAndSchedule(ARRAY_AGG(timestamp)) AS pipelineTypeAndScheduleDetails,
                        destinationTable,
                        sourceTables
                    FROM {BQQuery.job_info_with_tables_info_table_name}
                    GROUP BY destinationTable, sourceTables
                    HAVING ARRAY_LENGTH(timestamps) > 0
                )
            SELECT 
                pipelineId,
                timestamps,
                pipelineTypeAndScheduleDetails.pipelineType AS pipelineType,
                pipelineTypeAndScheduleDetails.schedule AS schedule,
                destinationTable,
                sourceTables
            FROM pipelineCompleteInfo;
        """

    @staticmethod
    def get_query_to_create_source_destination_pairs_table():
        return f"""
        CREATE OR REPLACE TABLE `{BQQuery.source_destination_pairs_table_name}` AS
            SELECT 
                pipelineId, 
                destinationTable,
                JSON_EXTRACT_SCALAR(sourceTable) AS sourceTable
            FROM 
                `{BQQuery.pipeline_info_table_name}` t 
                LEFT JOIN 
                UNNEST(JSON_EXTRACT_ARRAY(t.sourceTables,'$')) AS sourceTable;
        """
 
    @staticmethod
    def get_query_to_create_table_direct_pipelines_table():
        return f"""
        CREATE OR REPLACE TABLE `{BQQuery.table_direct_pipelines_table_name}` AS 
            WITH
                table_and_direct_backward_pipelines AS (
                    SELECT 
                        destinationTable, 
                        ARRAY_AGG(
                            STRUCT(
                                pipelineId,
                                sourceTables, 
                                destinationTable,
                                ARRAY_LENGTH(timestamps) AS frequency,
                                pipelineType,
                                schedule
                            )
                        ) as directBackwardPipelines
                    FROM {BQQuery.pipeline_info_table_name}
                    GROUP BY destinationTable
                ),
                table_and_direct_forward_pipelines AS (
                    SELECT 
                        sourceTable, 
                        ARRAY_AGG(
                            STRUCT(
                                s.pipelineId,
                                TO_JSON_STRING([sourceTable]) AS sourceTables,
                                s.destinationTable, 
                                ARRAY_LENGTH(timestamps) AS frequency,
                                pipelineType,
                                schedule
                            )
                        ) as directForwardPipelines
                    FROM 
                        `{BQQuery.source_destination_pairs_table_name}` s 
                        LEFT JOIN `{BQQuery.pipeline_info_table_name}` r 
                        ON s.pipelineId = r.pipelineId
                    GROUP BY sourceTable
                )

            SELECT 
                COALESCE(NULLIF(m.destinationTable, ''), n.sourceTable) AS table, 
                directBackwardPipelines, 
                directForwardPipelines
            FROM 
                table_and_direct_backward_pipelines m
                FULL OUTER JOIN 
                table_and_direct_forward_pipelines n
                ON m.destinationTable = n.sourceTable;
        """

    @staticmethod
    def create_tables_for_pipeline_analysis():
        if not BQQuery.is_safe_to_create_table():
            raise Exception('NOT SAFE TO CREATE TABLE AS OUTPUT_TABLE_SUFFIX environment variable IS NOT SPECIFIED')
        datetime_constraint = BQQuery.get_datetime_constraint()
        query = f"""
        {BQQuery.get_query_to_create_job_info_with_tables_info_table(datetime_constraint)}
        {BQQuery.get_query_to_create_pipeline_info_table()}
        {BQQuery.get_query_to_create_source_destination_pairs_table()}
        {BQQuery.get_query_to_create_table_direct_pipelines_table()}
        """
        client = bigquery.Client(location=BQQuery.get_location())
        query_job = client.query(query)
        query_job.result()

    @staticmethod
    def delete_tables_for_pipeline_analysis():
        query = f"""
        DROP TABLE IF EXISTS `{BQQuery.job_info_with_tables_info_table_name}`;
        DROP TABLE IF EXISTS `{BQQuery.source_destination_pairs_table_name}`;
        DROP TABLE IF EXISTS `{BQQuery.pipeline_info_table_name}`;
        """
        client = bigquery.Client(location=BQQuery.get_location())
        query_job = client.query(query)
        query_job.result()

    @staticmethod
    def get_tables_read_write_frequency(top):
        query = f"""
        WITH 
            tableWriteFrequency AS (
                SELECT destinationTable, SUM(ARRAY_LENGTH(timestamps)) as writeFrequency
                FROM `{BQQuery.pipeline_info_table_name}` t
                WHERE t.destinationTable IS NOT NULL
                GROUP BY t.destinationTable
            ),
            tableReadFrequency AS (
                SELECT sourceTable, SUM(ARRAY_LENGTH(timestamps)) AS readFrequency
                FROM 
                    `{BQQuery.source_destination_pairs_table_name}` r
                    LEFT JOIN `{BQQuery.pipeline_info_table_name}` s 
                    ON r.pipelineId = s.pipelineId
                WHERE r.sourceTable IS NOT NULL
                GROUP BY r.sourceTable
            )

        SELECT 
            COALESCE(destinationTable, sourceTable) AS table, 
            COALESCE(readFrequency , 0) AS readFrequency, 
            COALESCE(writeFrequency , 0) AS writeFrequency
        FROM 
            tableWriteFrequency
            FULL OUTER JOIN 
            tableReadFrequency 
            ON tableWriteFrequency.destinationTable = tableReadFrequency.sourceTable
        ORDER BY writeFrequency - readFrequency DESC
        LIMIT {top}
        """
        client = bigquery.Client(location=BQQuery.get_location())
        query_job = client.query(query)
        return query_job

    @staticmethod
    def get_tables_involved(table):
        query = f"""
        WITH tableNames AS (
            SELECT DISTINCT table
            FROM (
                SELECT destinationTable AS table FROM `{BQQuery.source_destination_pairs_table_name}`
                UNION ALL
                SELECT sourceTable AS table FROM `{BQQuery.source_destination_pairs_table_name}`
            )
        ),
        allSourceDestTablePairs AS (
            SELECT DISTINCT sourceTable, destinationTable
            FROM `{BQQuery.source_destination_pairs_table_name}`
        ),
        allSourceDestTablePairsAggregate AS (
            SELECT ARRAY_AGG(STRUCT(sourceTable, destinationTable)) 
            FROM allSourceDestTablePairs    
        ),
        tablesInvolvedInPipelineOfCurrentTable AS (
            SELECT 
                `{BQQuery.output_dataset_name}`.getTablesInvolvedInPipelineOfTable(
                    table, (select * from allSourceDestTablePairsAggregate)
                ) as tablesInvolved
            FROM tableNames
            WHERE table = '{table}'
        )
        SELECT tablesInvolved
        FROM UNNEST((SELECT * FROM tablesInvolvedInPipelineOfCurrentTable)) AS tablesInvolved
        """
        client = bigquery.Client(location=BQQuery.get_location())
        query_job = client.query(query)
        return list(map(lambda query_result: query_result.get('tablesInvolved'), query_job.result()))

    @staticmethod
    def get_table_direct_pipelines(tables):
        query = f"""
        SELECT *
        FROM `{BQQuery.table_direct_pipelines_table_name}`
        WHERE table IN UNNEST({tables});
        """
        client = bigquery.Client(location=BQQuery.get_location())
        query_job = client.query(query)
        result = query_job.result()
        return list(map(lambda table_direct_pipelines_query_result: pipeline_classes.TableDirectPipelines.from_query_result(table_direct_pipelines_query_result), result))
