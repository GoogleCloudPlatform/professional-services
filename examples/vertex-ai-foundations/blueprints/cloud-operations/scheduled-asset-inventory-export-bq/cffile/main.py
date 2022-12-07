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

'''Cloud Function module to export BQ table as JSON.

This module is designed to be plugged in a Cloud Function, attached to Cloud
Scheduler trigger to create a JSON of IP to hostname mappings from BigQuery.

'''

import base64
import datetime
import json
import logging
import os
import warnings

from google.api_core.exceptions import GoogleAPIError
from google.cloud import bigquery

import click

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
@click.option('--bucket', required=True, help='GCS bucket for export')
@click.option('--filename', required=True, help='Path and filename with extension to export e.g. folder/export.json .')
@click.option('--format', required=True, help='The exported file format, e.g. NEWLINE_DELIMITED_JSON or CSV.')
@click.option('--bq-dataset', required=True, help='Bigquery dataset where table for export is located.')
@click.option('--bq-table', required=True, help='Bigquery table to export.')
@click.option('--verbose', is_flag=True, help='Verbose output')
def main_cli(bucket=None, filename=None, format=None, bq_dataset=None, bq_table=None, verbose=False):
  '''Trigger Cloud Asset inventory export from Bigquery to file. Data will be stored in
  the dataset specified on a dated table with the name specified.
  '''
  try:
    _main(bucket, filename, format, bq_dataset, bq_table, verbose)
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


def _main(bucket=None, filename=None, format=None, bq_dataset=None, bq_table=None, verbose=False):
  'Module entry point used by cli and cloud function wrappers.'

  _configure_logging(verbose)
  client = bigquery.Client()
  destination_uri = 'gs://{}/{}'.format(bucket, filename)
  dataset_ref = client.dataset(bq_dataset)
  table_ref = dataset_ref.table(bq_table)
  job_config = bigquery.job.ExtractJobConfig()
  job_config.destination_format = (
      getattr(bigquery.DestinationFormat, format))
  extract_job = client.extract_table(
      table_ref, destination_uri, job_config=job_config
  )
  try:
    extract_job.result()
  except (GoogleAPIError, googleapiclient.errors.HttpError) as e:
    logging.debug('API Error: %s', e, exc_info=True)
    raise RuntimeError(
        'Error exporting BQ table %s as a file' % bq_table, e)


if __name__ == '__main__':
  main_cli()
