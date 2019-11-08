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
import os
import re

from google.cloud import bigquery
from google.cloud import storage

from benchmark_tools import file_constants
from benchmark_tools import table_util

BYTES_IN_MB = 1000000


class BenchmarkResultUtil(object):
    """Helper for handling results of benchmark load jobs.

    Handles gathering and and returning of results generated from loading data
    into benchmark tables.

    Attributes:
        load_job(google.cloud.bigquery.job.LoadJob): Object for loading data
            from GCS to BigQuery tables.
        job_id(str): ID of the load_job.
        benchmark_table_name(str): Name of the table that data from GCS
            is loaded into.
        project_id(str): ID of the project that holds the BigQuery dataset
            and table that the data is loaded into.
        benchmark_dataset_id(str): ID of the dataset that holds the BigQuery
            table that the data is loaded into.
        bq_logs_dataset(str): Name of dataset hold BQ logs table.
        job_source_uri(str): URI of the file in the GCS that contains the data
            that is loaded into the BigQuery table.
        bq_client(google.cloud.bigquery.client.Client): Client to hold
            configurations needed for BigQuery API requests.
        file_type(str): Type of file (csv, avro, parquet, etc)
        compression_format(bigquery.job.Compression):  Object representing the
            compression of the file.
        benchmark_time(datetime.datetime): Date and time that the load job
            for the benchmark was created.
        num_columns(int): Number of columns in the benchmark table.
        num_rows(int): Number of rows in the benchmark table.
        column_types(str): Representation of the types of columns in the
            benchmark table(50_STRING_50_NUMERIC, 100_STRING, etc)
        num_files(int): Number of files in the GCS URI that are loaded into
            the benchmark table.
        file_size(int): Size of each file in MB loaded from GCS into
            the benchmark table.
        staging_data_size(int): Size of the BigQuery table that the files
            in GCS were derived from before being loaded into the benchmark
            table.
        job_user(str): E-mail address of user who submitted the job.
        job_location(str): Location where the load job ran.
        job_start_time(datetime.datetime): Date and time that the load
            job started.
        job_end_time(datetime.datetime): Date and time that the load job
            ended.
        job_duration(datetime.timedelta): Duration of the load job run.
        job_source_format(google.cloud.bigquery.job.SourceFormat): format
            of the files loaded into the benchmark table (CSV, AVRO,
            NEWLINE_DELIMITED_JSON, etc)

    """

    def __init__(
            self,
            load_job,
            file_uri,
            benchmark_table_name,
            benchmark_dataset_id,
            project_id,
            bq_logs_dataset,

    ):
        self.load_job = load_job
        self.job_id = self.load_job.job_id
        self.benchmark_table_name = benchmark_table_name
        self.project_id = project_id
        self.benchmark_dataset_id = benchmark_dataset_id
        self.job_source_uri = file_uri
        self.bq_logs_dataset = bq_logs_dataset
        self.bq_client = bigquery.Client()
        self.storage_client = storage.Client()
        self.file_type = None
        self.compression_format = None
        self.benchmark_time = None
        self.num_columns = None
        self.num_rows = None
        self.column_types = None
        self.num_files = None
        self.file_size = None
        self.staging_data_size = None
        self.job_user = None
        self.job_location = None
        self.job_start_time = None
        self.job_end_time = None
        self.job_duration = None
        self.job_source_format = None
        self.totalSlotMs = None
        self.avgSlots = None

    def get_results_row(self):
        """Gathers the results of a load job into a benchmark table.

        Waits until the stat of the load job is 'DONE'. Note that this may take
        several minutes. Once the job stat is done, the method calls an
        internal method to set the benchmark properties, and another to get
        a BigQuery row containing the benchmark properties.

        Returns:
            A dict representing a row to be inserted into BigQuery.

        """
        job_state = self.load_job.state
        i = 0
        while job_state != 'DONE':
            if i == 0:
                logging.info('Job {0:s} currently in state {1:s}'.format(
                    self.job_id,
                    job_state,
                ))
                logging.info('Waiting to gather results for job {0:s} until '
                             'data has been loaded.'.format(self.job_id))
                i += 1
            self.load_job = self.bq_client.get_job(self.job_id)
            job_state = self.load_job.state
        logging.info('Job {0:s} currently in state {1:s}'.format(
            self.job_id,
            job_state,
        ))
        logging.info('Gathering results for benchmark table {0:s}.'.format(
            self.benchmark_table_name
        ))
        self._set_benchmark_properties()
        row = self._get_row()
        return row

    def _set_benchmark_properties(self):
        """Sets properties from results of the benchmark load.

        Internal method that gathers and sets properties from the benchmark
        load to be used as results.
        """

        # get properties from benchmark table
        benchmark_table_util = table_util.TableUtil(
            self.benchmark_table_name,
            self.benchmark_dataset_id,
        )
        benchmark_table_util.set_table_properties()
        self.num_rows = benchmark_table_util.table.num_rows

        # get properties from the load job
        self.benchmark_time = self.load_job.created
        self.job_start_time = self.load_job.started
        self.job_end_time = self.load_job.ended
        self.job_duration = self.job_end_time - self.job_start_time
        self.job_user = self.load_job.user_email
        self.num_files = self.load_job.input_files
        self.job_location = self.load_job.location
        self.job_source_format = self.load_job.source_format

        # get properties from file
        # pylint: disable=line-too-long
        benchmark_details_pattern = \
            r'gs://([\w\'-]+)/fileType=(\w+)/compression=(\w+)/numColumns=(\d+)/columnTypes=(\w+)/numFiles=(\d+)/tableSize=(\d+)(\w+)'
        bucket_name, self.file_type, compression, self.num_columns, \
            self.column_types, expected_num_files, self.staging_data_size, \
            staging_data_unit = \
            re.findall(benchmark_details_pattern, self.job_source_uri)[0]
        self.compression_format = (file_constants.FILE_CONSTANTS
                                   ['compressionFormats'][compression])
        file_name_prefix = 'fileType={0:s}/compression={1:s}/numColumns={2:s}/columnTypes={3:s}/numFiles={4:s}/tableSize={5:s}{6:s}'.format(
            self.file_type,
            compression,
            self.num_columns,
            self.column_types,
            expected_num_files,
            self.staging_data_size,
            staging_data_unit
        )
        bucket = self.storage_client.get_bucket(bucket_name)
        files_consts = file_constants.FILE_CONSTANTS
        if compression == 'none':
            file_ext = self.file_type
        else:
            file_ext = files_consts['compressionExtensions'][compression]

        file_name = '{0:s}/file1.{1:s}'.format(
            file_name_prefix,
            file_ext
        )

        self.file_size = float(bucket.get_blob(file_name).size)/BYTES_IN_MB

        # get properties from BQ logs
        str_timestamp = str(self.benchmark_time)
        sharded_table_timestamp = str_timestamp.split(' ')[0].replace('-', '')
        abs_path = os.path.abspath(os.path.dirname(__file__))
        log_query_file = os.path.join(
            abs_path,
            '../queries/log_query.txt'
        )
        with open(log_query_file, 'r') as input_file:
            log_query_bql = input_file.read().format(
                self.project_id,
                self.bq_logs_dataset,
                sharded_table_timestamp,
                self.job_id
            )
        log_query_config = bigquery.QueryJobConfig()
        log_query_config.use_legacy_sql = False
        log_query_job = self.bq_client.query(
            query=log_query_bql,
            location='US',
            job_config=log_query_config
        )
        log_query_job.result()
        for row in log_query_job:
            self.totalSlotMs = row['totalSlotMs']
            self.avgSlots = row['avgSlots']

    def _get_row(self):
        """Returns a row of results.

        Internal method that forms a dictionary of benchmark properties to be
        returned as row. The row represents the results of the benchmark load.

        Returns:
            A row in the form of a dictionary that represents the results of
            the benchmark load. Each key represents a field in the BigQuery
            results table.
        """
        fields_dict = dict(
            id=self.job_id,
            user=self.job_user,
            location=self.job_location,
            startTime=self.job_start_time.isoformat(),
            endTime=self.job_end_time.isoformat(),
            duration=self.job_duration.total_seconds(),
            destinationTable='{0:s}.{1:s}.{2:s}'.format(
                self.project_id,
                self.benchmark_dataset_id,
                self.benchmark_table_name,
            ),
            sourceURI=self.job_source_uri,
            sourceFormat=self.job_source_format,
            totalSlotMs=self.totalSlotMs,
            avgSlots=self.avgSlots
        )
        row = dict(
            benchmarkTime=self.benchmark_time,
            fileType=self.file_type,
            compressionType=self.compression_format,
            numColumns=self.num_columns,
            numRows=self.num_rows,
            columnTypes=self.column_types,
            numFiles=self.num_files,
            fileSize=self.file_size,
            stagingDataSize=self.staging_data_size,
            job=fields_dict,
        )

        return row




