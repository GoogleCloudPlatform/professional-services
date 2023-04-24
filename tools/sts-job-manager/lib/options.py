#!/usr/bin/env python3
# Copyright 2020 Google LLC
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

"""
This file contains the options used throughout this toolkit and their
corresponding command line arguments.
"""

import argparse
import json
from typing import Dict, Optional


class BigQueryOptions():
    def __init__(self, dataset_name='data_migration', dataset_location='US',
                 table_name: Optional[Dict[str, str]] = None):
        self.dataset_name = dataset_name
        self.dataset_location = dataset_location
        self.table_name: Dict[str, str] = table_name if table_name else {
            "job": 'sts_job',
            "job_history": 'sts_job_history'
        }

    def setup_arg_parser(self, parser: argparse.ArgumentParser):
        parser.add_argument('--dataset', type=str, default=self.dataset_name,
                            help='The name of the dataset to create and use \
                                (default: %(default)s)')
        parser.add_argument('--dataset-location', type=str,
                            default=self.dataset_location,
                            help='The location of the dataset \
                                (default: %(default)s)')
        parser.add_argument('--job-table', type=str,
                            default=self.table_name['job'],
                            help='Name of the job table \
                                (default: %(default)s)')
        parser.add_argument('--job-history-table', type=str,
                            default=self.table_name['job_history'],
                            help='Name of the job history table \
                                (default: %(default)s)')

    def assign_from_parsed_args(self, args: argparse.Namespace):
        self.dataset_name = args.dataset
        self.dataset_location = args.dataset_location
        self.table_name['job'] = args.job_table
        self.table_name['job_history'] = args.job_history_table


class PrepareTableOptions():
    def __init__(self, job_prefix_source_file: Optional[str] = None,
                 bigquery_options: Optional[BigQueryOptions] = None):
        self.job_prefix_source_file = job_prefix_source_file
        self.bigquery_options: BigQueryOptions = bigquery_options \
            if bigquery_options else BigQueryOptions()

    def setup_arg_parser(self, parser: argparse.ArgumentParser):
        self.bigquery_options.setup_arg_parser(parser)

        parser.add_argument('--job-prefix-source-file', type=str,
                            default=self.job_prefix_source_file,
                            help='A JSON file with a list of prefixes in \
                                `Array<string>` format. Used when preparing \
                                tables. (default: %(default)s)')

    def assign_from_parsed_args(self, args: argparse.Namespace):
        self.bigquery_options.assign_from_parsed_args(args)

        self.job_prefix_source_file = args.job_prefix_source_file

        
def _int_below_or_equal_to_fifty(int_string):
    int_val = int(int_string)
    if int_val > 50:
        raise argparse.ArgumentTypeError('Value cannot be greater than fifty.')
    return int_val


class STSJobManagerOptions():
    def __init__(self,
                 config_path: Optional[str] = None,
                 source_bucket='migration-source',
                 destination_bucket='migration-destination',
                 job_interval=1200,
                 metrics_interval=300,
                 max_concurrent_jobs=20,
                 overwrite_dest_objects=False,
                 sleep_timeout=60, no_retry_on_job_error=False,
                 allow_new_jobs_when_stalled=False,
                 publish_heartbeat=False,
                 stackdriver_project: Optional[str] = None,
                 bigquery_options: Optional[BigQueryOptions] = None):
        self.config_path = config_path
        self.source_bucket = source_bucket
        self.destination_bucket = destination_bucket
        self.job_interval = job_interval
        self.metrics_interval = metrics_interval
        self.max_concurrent_jobs = max_concurrent_jobs
        self.overwrite_dest_objects = overwrite_dest_objects
        self.sleep_timeout = sleep_timeout
        self.no_retry_on_job_error = no_retry_on_job_error
        self.allow_new_jobs_when_stalled = allow_new_jobs_when_stalled
        self.publish_heartbeat = publish_heartbeat
        self.stackdriver_project = stackdriver_project
        self.bigquery_options: BigQueryOptions = bigquery_options \
            if bigquery_options else BigQueryOptions()

    def setup_arg_parser(self, parser: argparse.ArgumentParser):
        self.bigquery_options.setup_arg_parser(parser)

        parser.add_argument('--config-path', type=str,
                            default=self.config_path,
                            help='A JSON config file with these commandline \
                                arguments (without the leading dashes). When \
                                an arg is found in both the config and \
                                commandline the config file arg will take \
                                precedence. (default: %(default)s)')
        parser.add_argument('--source-bucket', type=str,
                            default=self.source_bucket,
                            help='The source bucket to transfer data from \
                                (default: %(default)s)')
        parser.add_argument('--destination-bucket', type=str,
                            default=self.destination_bucket,
                            help='The destination bucket to transfer data to \
                                (default: %(default)s)')
        parser.add_argument('--job-interval', type=int, metavar='N',
                            default=self.job_interval,
                            help='The amount of time between spinning up new \
                                jobs. Every job interval also runs a metrics \
                                interval. This should be >= \
                                `--sleep-timeout`. (default: %(default)s) \
                                (unit: seconds)')
        parser.add_argument('--metrics-interval', type=int, metavar='N',
                            default=self.metrics_interval,
                            help='Determines how often this tool gathers \
                                metrics. This should be >= \
                                `--sleep-timeout`. (default: %(default)s) \
                                (unit: seconds)')
        parser.add_argument('--max-concurrent-jobs',
                            type=_int_below_or_equal_to_fifty, metavar='N',
                            default=self.max_concurrent_jobs,
                            help='The max number of jobs allowed to run \
                                concurrently (default: %(default)s)')
        parser.add_argument('--no-retry-on-job-error',
                            default=self.no_retry_on_job_error,
                            help='Use this flag to disable the retrying of \
                                failed jobs. (default: %(default)s)',
                            action='store_true')
        parser.add_argument('--allow-new-jobs-when-stalled',
                            default=self.allow_new_jobs_when_stalled,
                            help='Allows new jobs to be spun up when jobs are \
                                stalled. This has the potential to allow \
                                more running STS jobs than \
                                `--max-concurrent-jobs`. \
                                (default: %(default)s)',
                            action='store_true')
        parser.add_argument('--publish-heartbeat',
                            default=self.publish_heartbeat,
                            help='Use this flag to enable publishing \
                                heartbeats to Stackdriver. (default: \
                                %(default)s)', action='store_true')
        parser.add_argument('--stackdriver-project', type=str,
                            default=self.stackdriver_project,
                            help='The project to use when using Stackdriver. \
                                If `--publish-heartbeat` and this is not set, \
                                the project will inferred from the \
                                environment (default: %(default)s)')
        parser.add_argument('--overwrite-dest-objects',
                            default=self.overwrite_dest_objects,
                            help='Determines if the \
                                `overwrite_objects_already_existing_in_sink` \
                                option will be used for newly created jobs. \
                                (default: %(default)s)', action='store_true')
        parser.add_argument('--sleep-timeout', type=int, metavar='N',
                            default=self.sleep_timeout,
                            help='Determines how long to sleep between running \
                                intervals. (default: %(default)s) \
                                (unit: seconds)')

    def assign_from_parsed_args(self, args: argparse.Namespace):
        if args.config_path:
            with open(args.config_path) as config_file:
                config_data = json.load(config_file)

                for key in config_data:
                    arg_key = key.replace('-', '_')

                    if arg_key not in args:
                        raise Exception(
                            f'`{key}` from config file is not a valid arg. \
                            Hint: check spelling or the tools\' version')

                    # Prefer config file > commandline arg on conflict as you
                    # cannot detect if the a given commandline arg
                    # used it's default value or not
                    setattr(args, arg_key, config_data[key])

        self.bigquery_options.assign_from_parsed_args(args)

        self.source_bucket = args.source_bucket
        self.destination_bucket = args.destination_bucket
        self.job_interval = args.job_interval
        self.metrics_interval = args.metrics_interval
        self.max_concurrent_jobs = args.max_concurrent_jobs
        self.no_retry_on_job_error = args.no_retry_on_job_error
        self.allow_new_jobs_when_stalled = args.allow_new_jobs_when_stalled
        self.overwrite_dest_objects = args.overwrite_dest_objects
        self.sleep_timeout = args.sleep_timeout
        self.publish_heartbeat = args.publish_heartbeat
        self.stackdriver_project = args.stackdriver_project \
            if args.stackdriver_project else None

        # Validity checks
        if self.job_interval < self.sleep_timeout:
            raise Exception('The job interval should be >= `--sleep-timeout`')
        if self.metrics_interval < self.sleep_timeout:
            raise Exception(
                'The metrics interval should be >= `--sleep-timeout`')
