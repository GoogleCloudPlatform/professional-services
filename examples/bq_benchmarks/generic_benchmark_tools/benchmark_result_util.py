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

from abc import ABC, abstractmethod
import logging
import os
import re

from google.cloud import bigquery
from google.cloud import storage

from generic_benchmark_tools import file_constants
from generic_benchmark_tools import table_util

BYTES_IN_MB = 10**6


class BenchmarkResultUtil(ABC):
    """Parent class for handling results of benchmark jobs.

    Sets generic benchmark properties that all benchmark tests will share
        and loads them into a results table.

    Attributes:
        bq_client(google.cloud.bigquery.client.Client): Client to hold
            configurations needed for BigQuery API requests.
        storage_client(google.cloud.storage.client.Client): Client to hold
            configurations needed for GCS API requests.
        project_id(str): ID of the project that holds the BigQuery dataset
            and table that the result data is loaded into.
        results_table_name(str): Name of the BigQuery table that the
            benchmark results will be inserted into.
        results_dataset_id(str): Name of the BigQuery dataset that holds the
            table the benchmark results will be inserted into.
        bq_logs_dataset(str): Name of the dataset hold BQ logs table.
        job(google.cloud.bigquery.job): The BigQuery jobs whose performance
            the benchmark will measure.
        job_type(str): The type of BigQuery job (LOAD, QUERY, COPY, or EXTRACT).
        benchmark_name(str): The name of the benchmark test.
        results_dict(dict): Dictionary holding the results to be loaded into
            the results table.

    """

    def __init__(self, job, job_type, benchmark_name, project_id,
                 result_table_name, result_dataset_id, bq_logs_dataset):
        self.bq_client = bigquery.Client()
        self.storage_client = storage.Client()
        self.project_id = project_id
        self.results_table_name = result_table_name
        self.results_dataset_id = result_dataset_id
        self.bq_logs_dataset = bq_logs_dataset
        self.job = job
        self.job_type = job_type
        self.benchmark_name = benchmark_name
        self.results_dict = {}

    def _get_audit_log_properties(self):
        str_timestamp = str(self.job.created)
        sharded_table_timestamp = str_timestamp.split(' ')[0].replace('-', '')
        abs_path = os.path.abspath(os.path.dirname(__file__))
        log_query_file = os.path.join(abs_path, '../queries/log_query.txt')
        with open(log_query_file, 'r') as input_file:
            log_query_bql = input_file.read().format(self.project_id,
                                                     self.bq_logs_dataset,
                                                     sharded_table_timestamp,
                                                     self.job.job_id)
        log_query_config = bigquery.QueryJobConfig()
        log_query_config.use_legacy_sql = False
        log_query_job = self.bq_client.query(query=log_query_bql,
                                             location='US',
                                             job_config=log_query_config)
        log_query_job.result()
        total_slot_ms = None
        avg_slots = None
        for row in log_query_job:
            total_slot_ms = row['totalSlotMs']
            avg_slots = row['avgSlots']

        return total_slot_ms, avg_slots

    def _set_generic_properties(self):
        """Sets properties from results of the benchmark load.

        Internal method that gathers and sets properties from the benchmark
        load to be used as results.
        """

        # get properties from BQ logs
        total_slot_ms, avg_slots = self._get_audit_log_properties()

        # set job properties
        self.results_dict['benchmarkTime'] = self.job.created
        self.results_dict['benchmarkName'] = self.benchmark_name
        self.results_dict['job'] = {
            "id": self.job.job_id,
            "type": self.job_type,
            "user": self.job.user_email,
            "location": self.job.location,
            "startTime": self.job.started.isoformat(),
            "endTime": self.job.ended.isoformat(),
            "duration": (self.job.ended - self.job.started).total_seconds(),
            "totalSlotMs": total_slot_ms,
            "avgSlots": avg_slots
        }

    def _get_properties_from_file_path(self, file_uri):
        """Gathers benchmark properties from a file uri.

        Args:
            file_uri: Full GCS URI of the files to be loaded. Includes
            the 'gs://' prefix, the bucket name, and path.

        Returns:
            A dictionary holding the property types as keys and the properties
            as values.

        """
        benchmark_details_pattern = \
            r'gs://([\w\'-]+)/fileType=(\w+)/compression=(\w+)/numColumns=(\d+)/columnTypes=(\w+)/numFiles=(\d+)/tableSize=(\d+)(\w+)'
        bucket_name, file_type, compression, num_columns, column_types, \
            num_files, staging_data_size, staging_data_unit = \
            re.findall(benchmark_details_pattern, file_uri)[0]
        compression_format = (
            file_constants.FILE_CONSTANTS['compressionFormats'][compression])
        file_name_prefix = 'fileType={0:s}/compression={1:s}/numColumns={2:s}/columnTypes={3:s}/numFiles={4:s}/tableSize={5:s}{6:s}'.format(
            file_type, compression, num_columns, column_types, num_files,
            staging_data_size, staging_data_unit)
        bucket = self.storage_client.get_bucket(bucket_name)
        files_consts = file_constants.FILE_CONSTANTS
        if compression == 'none':
            file_ext = file_type
        else:
            file_ext = files_consts['compressionExtensions'][compression]

        file_name = '{0:s}/file1.{1:s}'.format(file_name_prefix, file_ext)

        file_size = float(bucket.get_blob(file_name).size) / BYTES_IN_MB
        properties_from_file_path = dict()
        properties_from_file_path['fileType'] = file_type
        properties_from_file_path['compressionType'] = compression_format
        properties_from_file_path['numColumns'] = num_columns
        properties_from_file_path['columnTypes'] = column_types

        properties_from_file_path['numFiles'] = num_files
        properties_from_file_path['fileSize'] = file_size
        properties_from_file_path['stagingDataSize'] = staging_data_size
        return properties_from_file_path

    def insert_results_row(self):
        """Gathers the results of a load job into a benchmark table.

        Waits until the stat of the BigQuery job is 'DONE'. Note that this may
        take several minutes. Once the job stat is done, the method calls an
        internal method to set the benchmark properties, and another to get
        a BigQuery row containing the benchmark properties.

        Returns:
            A dict representing a row to be inserted into BigQuery.

        """
        job_state = self.job.state
        i = 0
        while job_state != 'DONE':
            if i == 0:
                logging.info('Job {0:s} currently in state {1:s}'.format(
                    self.job.job_id,
                    job_state,
                ))
                logging.info('Waiting to gather results for job {0:s} until '
                             'data has been loaded.'.format(self.job.job_id))
                i += 1
            self.job = self.bq_client.get_job(self.job.job_id)
            job_state = self.job.state
        logging.info('Job {0:s} currently in state {1:s}'.format(
            self.job.job_id,
            job_state,
        ))
        logging.info('Gathering results for benchmark')
        self._set_generic_properties()

        results_table_dataset_ref = self.bq_client.dataset(
            self.results_dataset_id)
        results_table_ref = results_table_dataset_ref.table(
            self.results_table_name)
        results_table = self.bq_client.get_table(results_table_ref)
        logging.info('Inserting {0:s}'.format(str(self.results_dict)))
        insert_job = self.bq_client.insert_rows(
            results_table,
            [self.results_dict],
        )
        if len(insert_job) == 0:
            logging.info(('{0:s} Benchmark results for job {1:s} loaded '
                          'loaded successfully'.format(self.benchmark_name,
                                                       self.job.job_id)))
        else:
            logging.error(insert_job)

    @abstractmethod
    def _set_job_properties(self):
        """Abstract class to ensure children set properties specific to job."""
        pass


class LoadBenchmarkResultUtil(BenchmarkResultUtil):
    """Child class for handling load specific results of benchmark load jobs.

    Attributes:
        job(google.cloud.bigquery.job): The BigQuery jobs whose performance
            the benchmark will measure.
        job_type(str): The type of BigQuery job (LOAD, QUERY, COPY, or EXTRACT).
        benchmark_name(str): The name of the benchmark test.
        project_id(str): ID of the project that holds the BigQuery dataset
            and table that the result data is loaded into.
        results_table_name(str): Name of the BigQuery table that the
            benchmark results will be inserted into.
        results_dataset_id(str): Name of the BigQuery dataset that holds the
            table the benchmark results will be inserted into.
        bq_logs_dataset(str): Name of the dataset hold BQ logs table.
        job_source_uri(str): Full GCS URI of the files to be loaded. Includes
            the 'gs://' prefix, the bucket name, and path.
        load_table_id(str): ID of the table the file has been loaded into.
        load_dataset_id(str): ID of the dataset that holds the table the file
            has been loaded into.

    """

    def __init__(self, job, job_type, benchmark_name, project_id,
                 results_table_name, results_dataset_id, bq_logs_dataset,
                 job_source_uri, load_table_id, load_dataset_id):
        super().__init__(job, job_type, benchmark_name, project_id,
                         results_table_name, results_dataset_id,
                         bq_logs_dataset)
        self.job_source_uri = job_source_uri
        self.load_table_id = load_table_id
        self.load_dataset_id = load_dataset_id
        self._set_job_properties()

    def _set_job_properties(self):
        """Sets load specific properties."""
        load_properties = dict()
        load_properties['destinationTable'] = '{0:s}.{1:s}.{2:s}'.format(
            self.project_id, self.load_dataset_id, self.load_table_id)
        load_properties['sourceURI'] = self.job_source_uri

        # get properties from benchmark table
        benchmark_table_util = table_util.TableUtil(self.load_table_id,
                                                    self.load_dataset_id)
        benchmark_table_util.set_table_properties()
        load_properties['numRows'] = benchmark_table_util.table.num_rows

        # get properties from the load job
        load_properties['sourceFormat'] = self.job.source_format

        # get properties from file
        properties_from_file_path = self._get_properties_from_file_path(
            self.job_source_uri)
        load_properties.update(properties_from_file_path)

        self.results_dict['loadProperties'] = load_properties


class QueryBenchmarkResultUtil(BenchmarkResultUtil):
    """Child class for handling load specific results of benchmark query jobs.

    Attributes:
        job(google.cloud.bigquery.job): The BigQuery jobs whose performance
            the benchmark will measure.
        job_type(str): The type of BigQuery job (LOAD, QUERY, COPY, or EXTRACT).
        benchmark_name(str): The name of the benchmark test.
        project_id(str): ID of the project that holds the BigQuery resources.
        results_table_name(str): Name of the BigQuery table that the
            benchmark results will be inserted into.
        results_dataset_id(str): Name of the BigQuery dataset that holds the
            table the benchmark results will be inserted into.
        bq_logs_dataset(str): Name of the dataset hold BQ logs table.
        bql(str): The SQL that was run.
        query_category(str): Code for the category of the query that was
            run (SIMPLE_SELECT_*, SELECT_ONE_STRING, SELECT_50_PERCENT).
        main_table_name(str): ID of the table that was used if the query was run
            natively, otherwise the ID of equivalent table (i.e. the table that
            the file was loaded into) if query was run externally. If a join
            was used, then the main_table_name is the ID of the left table.
        table_dataset_id(str): ID of the table that the query was run on.
        table_type(str): The code for the type of table (BQ_MANAGED or EXTERNAL)
        file_uri(str): Either the URI that was used as an external table if the
            query was run externally, or the equivalent URI (i.e. the URI that
            was used to create the table) if the query was run on a native
            table. Includes the 'gs://' prefix, the bucket name, and path.
    """

    def __init__(self, job, job_type, benchmark_name, project_id,
                 results_table_name, results_dataset_id, bq_logs_dataset, bql,
                 query_category, main_table_name, table_dataset_id, table_type,
                 file_uri):
        super().__init__(job, job_type, benchmark_name, project_id,
                         results_table_name, results_dataset_id,
                         bq_logs_dataset)
        self.bql = bql
        self.query_category = query_category
        self.main_table_name = main_table_name
        self.table_dataset_id = table_dataset_id
        self.table_type = table_type
        self.file_uri = file_uri
        self._set_job_properties()

    def _set_job_properties(self):
        query_properties = dict()
        query_properties['query'] = self.bql
        query_properties['queryCategory'] = self.query_category

        # get properties from job
        query_properties['totalBytesBilled'] = self.job.total_bytes_billed
        query_properties['totalBytesProcessed'] = self.job.total_bytes_processed

        # get main table properties
        main_table_properties = dict()
        main_table_properties['tableType'] = self.table_type
        main_table_properties['tableName'] = self.main_table_name
        main_table_util = table_util.TableUtil(self.main_table_name,
                                               self.table_dataset_id)
        main_table_util.set_table_properties()
        main_table_properties['equivalentBqTableSize'] = \
            main_table_util.size_in_mb
        main_table_properties['fileURI'] = self.file_uri

        # get properties from file path
        properties_from_file_path = self._get_properties_from_file_path(
            self.file_uri)
        main_table_properties.update(properties_from_file_path)
        del main_table_properties['stagingDataSize']

        query_properties['mainTable'] = main_table_properties
        self.results_dict['queryProperties'] = query_properties
