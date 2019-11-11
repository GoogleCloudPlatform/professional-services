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
            job,
            job_type,
            benchmark_name,
            project_id,
            result_table_name,
            result_dataset_id,
            bq_logs_dataset
    ):
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
        log_query_file = os.path.join(
            abs_path,
            '../queries/log_query.txt'
        )
        with open(log_query_file, 'r') as input_file:
            log_query_bql = input_file.read().format(
                self.project_id,
                self.bq_logs_dataset,
                sharded_table_timestamp,
                self.job.job_id
            )
        log_query_config = bigquery.QueryJobConfig()
        log_query_config.use_legacy_sql = False
        log_query_job = self.bq_client.query(
            query=log_query_bql,
            location='US',
            job_config=log_query_config
        )
        log_query_job.result()
        total_slot_ms = None
        avg_slots = None
        for row in log_query_job:
            total_slot_ms = row['totalSlotMs']
            avg_slots = row['avgSlots']

        return total_slot_ms, avg_slots

    def _set_benchmark_properties(self):
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

    def insert_results_row(self):
        """Gathers the results of a load job into a benchmark table.

        Waits until the stat of the load job is 'DONE'. Note that this may take
        several minutes. Once the job stat is done, the method calls an
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
                logging.info(
                    'Waiting to gather results for job {0:s} until '
                    'data has been loaded.'.format(self.job.job_id))
                i += 1
            self.job = self.bq_client.get_job(self.job.job_id)
            job_state = self.job.state
        logging.info('Job {0:s} currently in state {1:s}'.format(
            self.job.job_id,
            job_state,
        ))
        logging.info('Gathering results for benchmark')
        self._set_benchmark_properties()

        results_table_dataset_ref = self.bq_client.dataset(
            self.results_dataset_id
        )
        results_table_ref = results_table_dataset_ref.table(
            self.results_table_name
        )
        results_table = self.bq_client.get_table(results_table_ref)
        logging.info('Inserting {0:s}'.format(str(self.results_dict)))
        insert_job = self.bq_client.insert_rows(
            results_table,
            [self.results_dict],
        )
        if len(insert_job) == 0:
            logging.info(('{0:s} Benchmark results for job {1:s} loaded '
                          'loaded successfully'.format(
                                self.benchmark_name,
                                self.job.job_id)
                          ))
        else:
            logging.error(insert_job)






