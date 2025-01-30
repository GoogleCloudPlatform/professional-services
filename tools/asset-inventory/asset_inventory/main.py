#!/usr/bin/env python
#
# Copyright 2019 Google Inc.
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
"""Import Cloud Asset Inventory Assets to BigQuery.

This is a command line utility to run the export and import pipeline.

"""

import argparse
import datetime
import json
import logging
import sys

from asset_inventory import export
from asset_inventory import pipeline_runner


def parse_args():
    """Parse command line arguments.

    Present a slightly simpler interface by constructing the pipeline input and
    stage parameters from the export gcs-destination if not supplied. Also
    accepts arbitrary beam pipeline arguments if using a beam runner. but #
    getting them into the help text is near impossible.


    Returns:
        List if strings. The user supplied command line arguments with
        added input and stage arguments.

    """
    parser = argparse.ArgumentParser()

    # Take all the arguments that export takes.
    export.add_argparse_args(parser, True)

    parser.add_argument(
        '--group_by',
        default='ASSET_TYPE',
        choices=['ASSET_TYPE', 'ASSET_TYPE_VERSION', 'NONE'],
        # pylint: disable=line-too-long
        help=(
            'How to group exported resources into Bigquery tables.\n'
            '  ASSET_TYPE: A table for each asset type (like google.compute.Instance\n'
            '  ASSET_TYPE_VERSION: A table for each asset type and api version (like google.compute.Instance.v1\n'
            '  NONE: One one table holding assets in a single json column\n'))

    parser.add_argument(
        '--write_disposition',
        default='WRITE_APPEND',
        choices=['WRITE_APPEND', 'WRITE_EMPTY'],
        help='When WRITE_EMPTY, will delete the tables first prior to loading.')

    parser.add_argument(
        '--stage',
        help=('Location to write intermediary data to load from from. '
              'Will be --gcs-destination + "/stage" if not supplied.'))

    parser.add_argument(
        '--load_time',
        default=datetime.datetime.now().isoformat(),
        help=('Load time of the data (YYYY-MM-DD[HH:MM:SS])). '
              'Defaults to "now".'))

    parser.add_argument(
        '--num_shards',
        default='*=1',
        help=('Number of shards to use per asset type.'
              'List of asset types and the number '
              'of shards to use for that type with "*" used as a default.'
              ' For example "google.compute.VpnTunnel=1,*=10"'))

    parser.add_argument(
        '--dataset',
        help='BigQuery dataset to load to.',
        required=True,
    )

    parser.add_argument(
        '--skip-export',
        help=('Do not perform asset export to GCS. Imports to bigquery'
              ' what\'s in the --gcs-destination. '),
        action='store_true',
        default=False)

    parser.add_argument(
        '--add-load-date-suffix',
        help='If load date is appended to table name.',
        action='store_true',
        default=False)

    parser.add_argument(
        '--template-job-launch-location',
        help=(
            'The dataflow template to launch to import assets.'
            ' Should be a GCS location like '
            # pylint: disable=line-too-long
            'gs://professional-services-tools-asset-inventory/latest/import_pipeline'))

    parser.add_argument(
        '--template-job-project',
        help=('When launching a template via --template-job-launch-location, '
              'this is the project id to run the job in.'))

    parser.add_argument(
        '--template-job-region',
        default='us-central1',
        help=('When launching a template via --template-job-launch-location, '
              'This is the region to run in. (defaults to us-central1)'))

    def json_value(string_value):
        return json.loads(string_value)

    parser.add_argument(
        '--template-job-runtime-environment-json',
        type=json_value,
        help=('When launching a template via --template-job-launch-location, '
              'this is an optional json dict for '
              'runtime environment for the dataflow template launch request. '
              'See https://cloud.google.com/dataflow/docs/reference/rest/v1b3/RuntimeEnvironment. '
              'For example : \'{"maxWorkers": 10}\''))

    args, beam_args = parser.parse_known_args()

    # If input isn't supplied, we can infer it from the export destination.
    if 'input' not in args or not args.input:
        args.input = '{}/*.json'.format(args.gcs_destination)
    # If stage isn't supplied, we can infer it from export destination.
    if 'stage' not in args or not args.stage:
        args.stage = args.gcs_destination + '/stage'

    return args, beam_args


def main():
    logging.basicConfig()
    logging.getLogger().setLevel(logging.INFO)
    # parse arguments
    args, beam_args = parse_args()

    # Perform the export (unless we are skipping it).
    if not args.skip_export:
        export.export_to_gcs_content_types(args.parent, args.gcs_destination,
                                           args.content_types,
                                           args.asset_types)

    # Perform the import, via template or beam runner.
    launch_location = args.template_job_launch_location
    if launch_location:
        final_state = pipeline_runner.run_pipeline_template(
            args.template_job_project, args.template_job_region,
            launch_location, args.input, args.group_by, args.write_disposition,
            args.dataset, args.stage, args.load_time, args.num_shards,
            args.add_load_date_suffix,
            args.template_job_runtime_environment_json)
    else:
        final_state = pipeline_runner.run_pipeline_beam_runner(
            None, None, args.input, args.group_by, args.write_disposition,
            args.dataset, args.stage, args.load_time, args.num_shards,
            args.add_load_date_suffix, beam_args)

    if not pipeline_runner.is_successful_state(final_state):
        sys.exit(1)


if __name__ == '__main__':
    main()
