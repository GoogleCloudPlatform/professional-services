import logging
import os

from google.cloud import bigquery

from generic_benchmark_tools import benchmark_parameters
from generic_benchmark_tools import benchmark_result_util
from generic_benchmark_tools import file_constants
from generic_benchmark_tools import table_util
from query_benchmark_tools import query_generator


FEDERATED_QUERY_ID = 'FEDERATED QUERY'
BQ_MANAGED_TYPE_ID = 'BQ_MANAGED'
EXTERNAL_TYPE_ID = 'EXTERNAL'


class FederatedQueryBenchmark:

    def __init__(
            self,
            bq_project,
            gcs_project,
            dataset_id,
            bq_logs_dataset_id,
            native_table_id,
            bucket_name,
            file_uri,
            file_type,
            results_table_name,
            results_table_dataset_id,

    ):
        self.benchmark_name = FEDERATED_QUERY_ID
        self.job_type = benchmark_parameters.BENCHMARK_PARAMETERS[
            'benchmark_names'][self.benchmark_name]['type']
        self.bq_project = bq_project
        self.bq_client = bigquery.Client(
            project=self.bq_project
        )
        self.gcs_project = gcs_project
        self.dataset_id = dataset_id
        self.bq_logs_dataset_id = bq_logs_dataset_id
        self.native_table_id = native_table_id
        self.bucket_name = bucket_name
        self.file_uri = file_uri
        self.file_type = file_type
        self.results_table_name = results_table_name
        self.results_table_dataset_id = results_table_dataset_id

    def run_queries(self):
        benchmark_query_generator = query_generator.QueryGenerator(
            self.native_table_id,
            self.dataset_id
        )
        query_strings = benchmark_query_generator.get_query_strings()
        logging.info("!!!!!!!!!!!")
        logging.info(query_strings)
        for query_type in query_strings:
            self.run_native_query(query_type, query_strings[query_type])
            self.run_federated_query(query_type, query_strings[query_type])

    def run_native_query(self, query_type, query):
        table_name = '{0:s}.{1:s}.{2:s}'.format(
            self.bq_project,
            self.dataset_id,
            self.native_table_id
        )
        bql = query.format(table_name)
        query_config = bigquery.QueryJobConfig()
        query_config.use_legacy_sql = False
        query_job = self.bq_client.query(
            query=bql,
            location='US',
            job_config=query_config
        )
        query_job.result()
        logging.info("Running native {0:s} query.".format(query_type))
        query_result = benchmark_result_util.QueryBenchmarkResultUtil(
            job=query_job,
            job_type=self.job_type,
            benchmark_name=self.benchmark_name,
            project_id=self.bq_project,
            result_table_name=self.results_table_name,
            result_dataset_id=self.results_table_dataset_id,
            bq_logs_dataset=self.bq_logs_dataset_id,
            bql=bql,
            query_category=query_type,
            main_table_name=self.native_table_id,
            table_dataset_id=self.dataset_id,
            table_type=BQ_MANAGED_TYPE_ID,
            file_uri=self.file_uri,
        )
        query_result.insert_results_row()

    def run_federated_query(self, query_type, query):
        file_formats = file_constants.FILE_CONSTANTS['extractFormats']
        source_format = file_formats[self.file_type]
        external_config = bigquery.ExternalConfig(
            source_format=source_format
        )
        external_config.source_uris = [
            self.file_uri + '/*'
        ]
        if source_format != 'AVRO':
            main_table_util = table_util.TableUtil(
                self.native_table_id,
                self.dataset_id
            )
            external_config.schema = main_table_util.table.schema

        if source_format == 'CSV':
            external_config.options.skip_leading_rows = 1
        table_id = self.native_table_id + '_external'

        job_config = bigquery.QueryJobConfig(
            table_definitions={table_id: external_config},
            use_legacy_sql=False
        )
        bql = query.format(table_id)

        query_job = self.bq_client.query(
            bql,
            job_config=job_config
        )
        logging.info("Running external {0:s} query.".format(query_type))
        query_job.result()
        query_result = benchmark_result_util.QueryBenchmarkResultUtil(
            job=query_job,
            job_type=self.job_type,
            benchmark_name=self.benchmark_name,
            project_id=self.bq_project,
            result_table_name=self.results_table_name,
            result_dataset_id=self.results_table_dataset_id,
            bq_logs_dataset=self.bq_logs_dataset_id,
            bql=bql,
            query_category=query_type,
            main_table_name=self.native_table_id,
            table_dataset_id=self.dataset_id,
            table_type=EXTERNAL_TYPE_ID,
            file_uri=self.file_uri,
        )
        query_result.insert_results_row()

