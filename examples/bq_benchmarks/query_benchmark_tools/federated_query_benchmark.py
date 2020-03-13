import logging
import re

from google.cloud import bigquery

from generic_benchmark_tools import benchmark_parameters
from generic_benchmark_tools import benchmark_result_util
from generic_benchmark_tools import file_constants
from generic_benchmark_tools import table_util
from query_benchmark_tools import query_generator

FEDERATED_QUERY_ID = 'FEDERATED QUERY'
BQ_MANAGED_TYPE_ID = 'BQ_MANAGED'
EXTERNAL_TYPE_ID = 'EXTERNAL'
MB_IN_TB = 1000000


class FederatedQueryBenchmark:
    """Class to create and run queries for the Federated Query Benchmark.

    Attributes:
        bq_project(str): ID of the project that holds the BigQuery
            resources.
        gcs_project(str): ID of the project that holds the files to be queried.
        dataset_id(str): ID of the dataset that holds the table to be queried.
        bq_logs_dataset_id(str): Name of dataset hold BQ logs table.
        native_table_id(str): ID of the BQ managed table to be queried.
        bucket_name(str): Name of the bucket holding the files to be queried.
        file_uri(str): URI of the files to be queried.
        results_table_name(str): Name of the BigQuery table that the
            benchmark results will be inserted into.
        results_table_dataset_id(str): Name of the BigQuery dataset that holds
            the table the benchmark results will be inserted into.
        benchmark_name(str): The name of the benchmark test.
        job_type(str): The type of BigQuery job (LOAD, QUERY, COPY, or EXTRACT).
        bq_client(google.cloud.bigquery.client.Client): Client to hold
            configurations needed for BigQuery API requests.
        file_type(str): Type of file(s) to be queried.
        compression(str): Compression type of file(s) to be queried.

    """

    def __init__(
            self,
            bq_project,
            gcs_project,
            dataset_id,
            bq_logs_dataset_id,
            native_table_id,
            bucket_name,
            file_uri,
            results_table_name,
            results_table_dataset_id,
    ):
        self.benchmark_name = FEDERATED_QUERY_ID
        self.job_type = benchmark_parameters.BENCHMARK_PARAMETERS[
            'benchmark_names'][self.benchmark_name]['type']
        self.bq_project = bq_project
        self.bq_client = bigquery.Client(project=self.bq_project)
        self.gcs_project = gcs_project
        self.dataset_id = dataset_id
        self.bq_logs_dataset_id = bq_logs_dataset_id
        self.native_table_id = native_table_id
        self.bucket_name = bucket_name
        self.file_uri = file_uri
        file_pattern = r'fileType=(\w+)/compression=(\w+)/numColumns=(\d+)/columnTypes=(\w+)/numFiles=(\d+)/tableSize=(\w+)'
        self.file_type, self.compression, num_columns, column_types,\
            num_files, table_size = \
            re.findall(file_pattern, file_uri)[0]
        self.total_table_size = int(num_files) * int(table_size.split('MB')[0])

        self.results_table_name = results_table_name
        self.results_table_dataset_id = results_table_dataset_id

    def run_queries(self):
        """Generates and runs queries on BQ_MANAGED tables and EXTERNAL files"""
        if self.file_type == 'avro' and self.compression == 'snappy':
            logging.info(
                'External queries on snappy compressed files are not '
                'supported. Skipping external query benchmark for BQ managed '
                'table {0:s} and file {1:s}'.format(self.native_table_id,
                                                    self.file_uri))
        elif self.total_table_size > MB_IN_TB:
            logging.info('Queries will not be run on tables larger than 1 TB '
                         'in order to save cost. Skipping queries for table '
                         '{0:s} with approximate size of {1:d} TB.'.format(
                             self.native_table_id,
                             self.total_table_size // MB_IN_TB))
        else:
            benchmark_query_generator = query_generator.QueryGenerator(
                self.native_table_id, self.dataset_id)
            query_strings = benchmark_query_generator.get_query_strings()
            for query_type in query_strings:
                self.run_native_query(query_type, query_strings[query_type])
                self.run_federated_query(query_type, query_strings[query_type])

    def run_native_query(self, query_type, query):
        """Runs native queries on BQ_MANAGED tables

        Args:
            query_type(str): Code for the category of the query to
                run (SIMPLE_SELECT_*, SELECT_ONE_STRING, SELECT_50_PERCENT).
            query(str): The query to run.
        """
        table_name = '{0:s}.{1:s}.{2:s}'.format(self.bq_project,
                                                self.dataset_id,
                                                self.native_table_id)
        bql = query.format(table_name)
        query_config = bigquery.QueryJobConfig()
        query_config.use_legacy_sql = False
        query_config.allow_large_results = True
        results_destination = '{0:s}.{1:s}.{2:s}_query_results'.format(
            self.bq_project, self.dataset_id, self.native_table_id)
        logging.info(
            'Storing query results in {0:s}'.format(results_destination))
        query_config.destination = results_destination
        query_job = self.bq_client.query(query=bql,
                                         location='US',
                                         job_config=query_config)
        query_job.result()
        logging.info("Running native {0:s} query.".format(query_type))
        query_result = benchmark_result_util.QueryBenchmarkResultUtil(
            job=query_job,
            job_type=self.job_type,
            benchmark_name=self.benchmark_name,
            project_id=self.bq_project,
            results_table_name=self.results_table_name,
            results_dataset_id=self.results_table_dataset_id,
            bq_logs_dataset=self.bq_logs_dataset_id,
            bql=bql,
            query_category=query_type,
            main_table_name=self.native_table_id,
            table_dataset_id=self.dataset_id,
            table_type=BQ_MANAGED_TYPE_ID,
            file_uri=self.file_uri,
        )
        query_result.insert_results_row()
        self.bq_client.delete_table(results_destination)
        logging.info('Deleting results destination table {0:s}'.format(
            results_destination))

    def run_federated_query(self, query_type, query):
        """Runs native queries on EXTERNAL files

        Args:
            query_type(str): Code for the category of the query to
                run (SIMPLE_SELECT_*, SELECT_ONE_STRING, SELECT_50_PERCENT).
            query(str): The query to run.
        """
        file_formats = file_constants.FILE_CONSTANTS['sourceFormats']
        source_format = file_formats[self.file_type]
        external_config = bigquery.ExternalConfig(source_format=source_format)
        external_config.source_uris = [self.file_uri + '/*']
        if source_format != 'AVRO' and source_format != 'PARQUET':
            main_table_util = table_util.TableUtil(self.native_table_id,
                                                   self.dataset_id)
            external_config.schema = main_table_util.table.schema

        if source_format == 'CSV':
            external_config.options.skip_leading_rows = 1

        external_config.compression = self.compression.upper()
        table_id = self.native_table_id + '_external'
        results_destination = '{0:s}.{1:s}.{2:s}_query_results'.format(
            self.bq_project, self.dataset_id, table_id)
        logging.info(
            'Storing query results in {0:s}'.format(results_destination))
        job_config = bigquery.QueryJobConfig(
            table_definitions={table_id: external_config},
            use_legacy_sql=False,
            allow_large_results=True,
            destination=results_destination)
        bql = query.format(table_id)
        print(bql)
        query_job = self.bq_client.query(bql, job_config=job_config)
        logging.info("Running external {0:s} query.".format(query_type))
        query_job.result()
        query_result = benchmark_result_util.QueryBenchmarkResultUtil(
            job=query_job,
            job_type=self.job_type,
            benchmark_name=self.benchmark_name,
            project_id=self.bq_project,
            results_table_name=self.results_table_name,
            results_dataset_id=self.results_table_dataset_id,
            bq_logs_dataset=self.bq_logs_dataset_id,
            bql=bql,
            query_category=query_type,
            main_table_name=self.native_table_id,
            table_dataset_id=self.dataset_id,
            table_type=EXTERNAL_TYPE_ID,
            file_uri=self.file_uri,
        )
        query_result.insert_results_row()
        self.bq_client.delete_table(results_destination)
        logging.info('Deleting results destination table {0:s}'.format(
            results_destination))
