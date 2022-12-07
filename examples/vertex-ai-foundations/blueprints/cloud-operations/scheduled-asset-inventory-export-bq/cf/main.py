# Copyright 2022 Google LLC
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

'''Cloud Function module to export data for a given day.

This module is designed to be plugged in a Cloud Function, attached to Cloud
Scheduler trigger to create a Cloud Asset Inventory Export to BigQuery.

'''

import base64
import datetime
import json
import logging
import os
import warnings

import click

from google.api_core.exceptions import GoogleAPIError
from google.cloud import asset_v1

import googleapiclient.discovery
import googleapiclient.errors


def _configure_logging(verbose=True):
  '''Basic logging configuration.
  Args:
    verbose: enable verbose logging
  '''
  level = logging.DEBUG if verbose else logging.INFO
  logging.basicConfig(level=level)
  warnings.filterwarnings('ignore', r'.*end user credentials.*', UserWarning)


@click.command()
@click.option('--project', required=True, help='Project ID')
@click.option('--bq-project', required=True, help='Bigquery project to use.')
@click.option('--bq-dataset', required=True, help='Bigquery dataset to use.')
@click.option('--bq-table', required=True, help='Bigquery table name to use.')
@click.option('--bq-table-overwrite', required=True, help='Overwrite existing BQ table or create new datetime() one.')
@click.option('--target-node', required=True, help='Node in Google Cloud resource hierarchy.')
@click.option('--read-time', required=False, help=(
    'Day to take an asset snapshot in \'YYYYMMDD\' format, uses current day '
    ' as default. Export will run at midnight of the specified day.'))
@click.option('--verbose', is_flag=True, help='Verbose output')
def main_cli(project=None, bq_project=None, bq_dataset=None, bq_table=None, bq_table_overwrite=None, target_node=None,
             read_time=None, verbose=False):
  '''Trigger Cloud Asset inventory export to Bigquery. Data will be stored in
  the dataset specified on a dated table with the name specified.
  '''
  try:
    _main(project, bq_project, bq_dataset, bq_table,
          bq_table_overwrite, target_node, read_time, verbose)
  except RuntimeError:
    logging.exception('exception raised')


def main(event, context):
  'Cloud Function entry point.'
  try:
    data = json.loads(base64.b64decode(event['data']).decode('utf-8'))
    print(data)
    _main(**data)
  # uncomment once https://issuetracker.google.com/issues/155215191 is fixed
  # except RuntimeError:
  #  raise
  except Exception:
    logging.exception('exception in cloud function entry point')


def _main(project=None, bq_project=None, bq_dataset=None, bq_table=None, bq_table_overwrite=None, target_node=None, read_time=None, verbose=False):
  'Module entry point used by cli and cloud function wrappers.'

  _configure_logging(verbose)
  output_config = asset_v1.OutputConfig()
  client = asset_v1.AssetServiceClient()
  if bq_table_overwrite == False:
    read_time = datetime.datetime.now()
    output_config.bigquery_destination.table = '%s_%s' % (
        bq_table, read_time.strftime('%Y%m%d'))
  else:
    output_config.bigquery_destination.table = '%s_latest' % (
        bq_table)
  content_type = asset_v1.ContentType.RESOURCE
  output_config.bigquery_destination.dataset = 'projects/%s/datasets/%s' % (
      bq_project, bq_dataset)
  output_config.bigquery_destination.separate_tables_per_asset_type = True
  output_config.bigquery_destination.force = True
  try:
    response = client.export_assets(
        request={
            'parent': target_node,
            'read_time': read_time,
            'content_type': content_type,
            'output_config': output_config
        }
    )
  except (GoogleAPIError, googleapiclient.errors.HttpError) as e:
    logging.debug('API Error: %s', e, exc_info=True)
    raise RuntimeError(
        'Error fetching Asset Inventory entries (resource manager node: %s)' % target_node, e)


if __name__ == '__main__':
  main_cli()
