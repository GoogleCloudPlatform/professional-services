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

from __future__ import absolute_import
from __future__ import division
from __future__ import print_function
import logging

from google.cloud import bigquery

from load_benchmark_tools import benchmark_load_table
from generic_benchmark_tools import bucket_util


class LoadTablesProcessor(object):
    """Contains methods for processing and creating load tables for benchmarks.

    Attributes:
        benchmark_name(str): The name of the benchmark test.
        bq_project(str): ID of the project that holds the BigQuery dataset
            and benchmark tables.
        gcs_project(str):  ID of the project that holds the GCS bucket
            where the files to be loaded are stored.
        staging_project(str_: ID of the project that contains the
            staging tables that the files to be loaded into the benchmark table
            were generated from.
        staging_dataset_id(str): ID of the dataset that contains the
            staging tables that the files to be loaded into the benchmark table
            were generated from.
        dataset_id(str): ID of the dataset that the benchmark tables should
            be loaded into.
        bucket_name(str): Name of the GCS bucket that holds the files that
            should be loaded into the benchmark table.
        bucket_util(load_benchmark_tools.bucket_util.BucketUtil): Helper class for
            interacting with the bucket that the holds the files that
            should be loaded into the benchmark table.
        results_table_name(str): Name of the BigQuery table that the
            benchmark table's load results will be inserted into.
        results_table_dataset_id(str): Name of the BigQuery dataset that the
            benchmark table's load results will be inserted into.
        duplicate_benchmark_tables(bool): Boolean value to determine what to
            do if a benchmark table already exists for a given file
            combination. If True, TableProcessor knows to create another
            benchmark table with the same combination to increase the
            number of results for accuracy. If not, TablesProcessor knows
            to only create a benchmark table for a given combination if one
            has not yet been created.
        file_params(dict): Dictionary containing each file parameter and
            its possible values.
        bq_logs_dataset(str): Name of dataset hold BQ logs table.

    """

    def __init__(
            self,
            benchmark_name,
            bq_project,
            gcs_project,
            staging_project,
            staging_dataset_id,
            dataset_id,
            bucket_name,
            results_table_name,
            results_table_dataset_id,
            duplicate_benchmark_tables,
            file_params,
            bq_logs_dataset,
    ):
        self.benchmark_name = benchmark_name
        self.bq_project = bq_project
        self.gcs_project = gcs_project
        self.staging_project = staging_project
        self.staging_dataset_id = staging_dataset_id
        self.dataset_id = dataset_id
        self.bucket_name = bucket_name
        self.bucket_util = bucket_util.BucketUtil(
            bucket_name=self.bucket_name,
            project_id=self.gcs_project,
            file_params=file_params,
        )
        self.results_table_name = results_table_name
        self.results_table_dataset_id = results_table_dataset_id
        self.duplicate_benchmark_tables = duplicate_benchmark_tables
        self.bq_logs_dataset = bq_logs_dataset

    def gather_files_with_benchmark_tables(self):
        """Generates file combinations that already have benchmark tables.

        Creates a set of files that already have been loaded to create
        benchmark tables. Generates list by querying the job.sourceURI field
        from the results table.
        Returns:
            Set of file names that already have been loaded to create
            benchmark tables.
        """
        query = (
            'SELECT loadProperties.sourceURI FROM `{0:s}.{1:s}.{2:s}` '.format(
                self.bq_project,
                self.results_table_dataset_id,
                self.results_table_name,
            )
        )
        query_job = bigquery.Client().query(
            query,
            location='US',
        )
        files_with_benchmark_tables = set()
        for row in query_job:
            if row['sourceURI'] and self.bucket_name in row['sourceURI']:
                uri = row['sourceURI'].split('gs://{0:s}/'.format(
                    self.bucket_name
                ))[1]
                file_name = uri.split('/*')[0]
                files_with_benchmark_tables.add(file_name)
        return files_with_benchmark_tables

    def create_benchmark_tables(self):
        """Creates a benchmark table for each file combination in GCS bucket.
        """

        # Gather files combinations that already have benchmark tables.
        files_with_benchmark_tables = self.gather_files_with_benchmark_tables()
        if self.duplicate_benchmark_tables:
            files_to_skip = set()
        else:
            files_to_skip = files_with_benchmark_tables
        # Gather file combinations that exist in the GCS Bucket.
        existing_paths = self.bucket_util.get_existing_paths()
        # Create a benchmark table for each existing file combination, and
        # load the data from the file into the benchmark table.
        for path in existing_paths:
            path = path.split('/')
            path = '/'.join(path[:len(path) - 1])
            if path not in files_to_skip:

                if path in files_with_benchmark_tables:
                    verb = 'Duplicating'
                else:
                    verb = 'Processing'
                logging.info('{0:s} benchmark table for {1:s}'.format(
                    verb,
                    path,
                ))
                table = benchmark_load_table.BenchmarkLoadTable(
                    benchmark_name=self.benchmark_name,
                    bq_project=self.bq_project,
                    gcs_project=self.gcs_project,
                    staging_project=self.staging_project,
                    staging_dataset_id=self.staging_dataset_id,
                    dataset_id=self.dataset_id,
                    bucket_name=self.bucket_name,
                    path=path,
                    results_table_name=self.results_table_name,
                    results_table_dataset_id=self.results_table_dataset_id,
                    bq_logs_dataset=self.bq_logs_dataset,
                )
                table.create_table()
                table.load_from_gcs()
