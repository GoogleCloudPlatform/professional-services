# Copyright 2018 Google Inc.
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#      http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

import logging
import re
import time

from google.api_core import exceptions
from google.cloud import bigquery
from google.cloud import storage

from generic_benchmark_tools import benchmark_parameters
from generic_benchmark_tools import benchmark_result_util
from generic_benchmark_tools import table_util
from generic_benchmark_tools import file_constants


class LoadTableBenchmark:
    """Represents a BigQuery load table.

    Holds methods for creating a table in BigQuery and loading data from GCS
        into the table.

    Attributes:
        benchmark_name(str): The name of the benchmark test.
        bq_project(str): ID of the project that holds the BigQuery dataset
            and table that the data is loaded into.
        bq_client(google.cloud.bigquery.client.Client): Client to hold
            configurations needed for BigQuery API requests.
        gcs_project(str):  ID of the project that holds the GCS bucket
            where the files to be loaded are stored.
        gcs_client(google.cloud.storage.client.Client): Client to hold
            configurations needed for GCS API requests.
        staging_project(str): ID of the project that holds the staging tables
            used to create the file combinations.
        staging_dataset_id(str): ID of the dataset that contains the staging
            table that the files loaded into the benchmark table were
            generated from.
        dataset_id(str): ID of the dataset that holds the benchmark table.
        dataset_ref(google.cloud.bigquery.dataset.DatasetReference): Pointer
            to the dataset that holds the benchmark table.
        bucket_name(str): Name of the bucket that holds the files to be loaded
            into the benchmark table.
        dirname(str): Directory of the files in GCS to be loaded into the
            benchmark table. Path does not include the full GCS URI (i.e.
            gs://bucket_name), the file name (i.e. file1), or file extension
            (i.e. .csv).
        uri(str): Full GCS URI of the files to be loaded into the benchmark
            table. Includes the 'gs://' prefix, the bucket name, and dirname
            above.
        results_table_name(str): Name of the BigQuery table that the
            benchmark table's load results will be inserted into.
        results_table_dataset_id(str): Name of the BigQuery dataset that the
            benchmark table's load results will be inserted into.
        results_table(google.cloud.bigquery.table.Table): BigQuery table that
            the benchmark table's load results will be inserted into.
        bq_logs_dataset(str): Name of dataset hold BQ logs table.
        file_type(str): Type of files that will be loaded from GCS into
            the benchmark table (i.e. csv, avro, parquet, etc).
        compression_format(bigquery.job.Compression):  Object representing the
            compression of the file.
        benchmark_table_util(load_benchmark_tools.table_util.TableUtil): Object
            to assist with the handling of the benchmark table's creation
            and properties.
        num_columns(int): Number of columns in the benchmark table.
        column_types(str): Representation of the types of columns in the
            benchmark table(50_STRING_50_NUMERIC, 100_STRING, etc)
        bq_schema(List[google.cloud.bigquery.schema.SchemaField]): Schema of
            the benchmark table.
        load_job(google.cloud.bigquery.job.LoadJob): Object for loading data
            from GCS to BigQuery tables.
        job_destination_table(str): Name of the destination table. Generated
            using the current timestamp converted to a string.

    """

    def __init__(self, bq_project, gcs_project, staging_project,
                 staging_dataset_id, dataset_id, bucket_name, dirname,
                 results_table_name, results_table_dataset_id, bq_logs_dataset):
        self.benchmark_name = 'FILE LOADER'
        self.bq_project = bq_project
        self.bq_client = bigquery.Client(project=self.bq_project)
        self.gcs_project = gcs_project
        self.gcs_client = storage.Client(project=self.gcs_project)
        self.staging_project = staging_project
        self.staging_dataset_id = staging_dataset_id
        self.dataset_id = dataset_id
        self.dataset_ref = self.bq_client.dataset(self.dataset_id)
        self.bucket_name = bucket_name
        self.dirname = dirname
        self.uri = 'gs://{0:s}/{1:s}'.format(self.bucket_name, dirname)
        self.results_table_name = results_table_name
        self.results_table_dataset_id = results_table_dataset_id
        self.results_table_dataset_ref = self.bq_client.dataset(
            results_table_dataset_id)
        results_table_ref = self.results_table_dataset_ref.table(
            self.results_table_name)
        self.results_table = self.bq_client.get_table(results_table_ref)
        self.bq_logs_dataset = bq_logs_dataset
        self.file_type = None
        self.compression_format = None
        self.benchmark_table_util = None
        self.num_columns = None
        self.column_types = None
        self.bq_schema = None
        self.load_job = None
        self.job_destination_table = None
        self.gather_file_properties()

    def gather_file_properties(self):
        """Gathers properties of the files loaded into the benchmark table.
        """
        # gather file properties from the files' path
        # pylint: disable=line-too-long
        benchmark_details_pattern = \
            r'fileType=(\w+)/compression=(\w+)/numColumns=(\d+)/columnTypes=(\w+)/numFiles=(\d+)/tableSize=(\w+)'
        self.file_type, compression, self.num_columns, self.column_types, \
            num_files, table_size = \
            re.findall(benchmark_details_pattern, self.dirname)[0]

        self.compression_format = (
            file_constants.FILE_CONSTANTS['compressionFormats'][compression])

        # get schema from the staging table that the file was generated from
        source_staging_table_name = '{0:s}_{1:s}'.format(
            self.column_types, self.num_columns)

        source_staging_table_util = table_util.TableUtil(
            source_staging_table_name,
            self.staging_dataset_id,
            project=self.staging_project,
        )
        if self.file_type == 'parquet' or self.file_type == 'avro':
            self.bq_schema = None
        else:
            self.bq_schema = source_staging_table_util.table.schema

    def create_table(self):
        """Creates the bencmark table in BigQuery.

        The method creates an empty table using the schema from the staging
        table that the files were generated from. It uses the current
        timestamp to name the benchmark table to create a random, unique name.
        """
        self.job_destination_table = '{0:d}'.format(int(time.time()))
        self.benchmark_table_util = table_util.TableUtil(
            self.job_destination_table,
            self.dataset_id,
            bq_schema=self.bq_schema,
        )
        self.benchmark_table_util.create_table()
        return self.job_destination_table

    def load_from_gcs(self):
        """Loads GCS files into the benchmark table and stores results.

        Creates and runs a load job to load files the GCS URI into the
        benchmark table. Then uses benchmark_result_util.BenchmarkResultUtil
        to gather results and generate a results row, which it then inserts
        into the BigQuery results table.

        Raises:
            google.api_core.exceptions.BadRequest: 400 Error while reading data,
                error message: Total data size exceeds max allowed size

        """
        job_type = benchmark_parameters.BENCHMARK_PARAMETERS['benchmark_names'][
            self.benchmark_name]['type']
        source_formats = file_constants.FILE_CONSTANTS['sourceFormats']
        job_config = bigquery.LoadJobConfig()
        job_config.source_format = source_formats[self.file_type]
        if self.file_type == 'csv':
            job_config.skip_leading_rows = 1

        self.load_job = self.bq_client.load_table_from_uri(
            source_uris='{0:s}/*'.format(self.uri),
            destination=self.dataset_ref.table(self.job_destination_table),
            job_config=job_config,
        )
        logging.info('Started load job {0:s} for table {1:s}.'.format(
            self.load_job.job_id, self.job_destination_table))
        try:
            self.load_job.result()
            load_result = benchmark_result_util.LoadBenchmarkResultUtil(
                job=self.load_job,
                job_type=job_type,
                benchmark_name=self.benchmark_name,
                project_id=self.bq_project,
                results_table_name=self.results_table_name,
                results_dataset_id=self.results_table_dataset_id,
                bq_logs_dataset=self.bq_logs_dataset,
                job_source_uri='{0:s}/*'.format(self.uri),
                load_table_id=self.job_destination_table,
                load_dataset_id=self.dataset_id)
            load_result.insert_results_row()

        except exceptions.BadRequest as e:
            logging.error(e.message)

    def delete_table(self):
        """Deletes table once benchmark results have been captured."""
        self.bq_client.delete_table('{0:s}.{1:s}.{2:s}'.format(
            self.bq_project, self.dataset_id, self.job_destination_table))
        logging.info('Deleting table {0:s}'.format(self.job_destination_table))
