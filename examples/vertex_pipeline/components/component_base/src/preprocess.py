# Copyright 2021 Google LLC. All Rights Reserved.
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#     http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

"""Custom component for performing data processing with BigQuery."""

from typing import Tuple
import os
import json
import logging
import argparse
from datetime import datetime

from google.cloud import bigquery
from kfp.v2.components import executor
from kfp.v2.dsl import Dataset, Input, Output

# pylint: disable=logging-fstring-interpolation


def _bq_uri_to_fields(uri: str) -> Tuple[str, str, str]:
  uri = uri[5:]
  project, dataset, table = uri.split('.')
  return project, dataset, table


def preprocess_data(
    project_id: str,
    data_region: str,
    gcs_output_folder: str,
    input_dataset: Input[Dataset],
    output_dataset: Output[Dataset],
    gcs_output_format: str = bigquery.DestinationFormat.NEWLINE_DELIMITED_JSON
):
  """Extract a BQ table to an output Dataset artifact.

  Args:
    project_id: The project ID.
    data_region: The region for the BQ extraction job.
    gcs_output_folder: The GCS location to store the resulting CSV file.
    input_dataset: The output artifact of the resulting dataset.
    output_dataset: The output artifact of the resulting dataset.
    gcs_output_format: The output format.

  Raises:
    RuntimeError: If the BigQuery job fails.
  """

  # Parse the source table
  logging.info(f'Input dataset URI: {input_dataset.uri}')
  input_project, input_dataset, input_table = _bq_uri_to_fields(
    input_dataset.uri)
  dataset_ref = bigquery.DatasetReference(input_project, input_dataset)
  table_ref = dataset_ref.table(input_table)

  # Construct a GCS destination location
  timestamp = datetime.now().strftime('%Y%m%d%H%M%S')
  destination_uri = os.path.join(gcs_output_folder,
                                 f'processed_data-{timestamp}.csv')
  logging.info(f'Extract data to GCS URI: {destination_uri}')

  # Construct a BigQuery client object.
  client = bigquery.Client(project=project_id, location=data_region)

  # In future, more preprocessing logics can be put here
  # Currently it only exports the table directly to GCS
  job_config = bigquery.job.ExtractJobConfig()
  job_config.destination_format = gcs_output_format
  job_config.print_header = False

  extract_job = client.extract_table(
    table_ref,
    destination_uri,
    location=data_region,
    job_config=job_config)
  extract_job.result()  # Waits for job to complete.

  if extract_job.state == 'DONE':
    logging.info('Table export completed')
    output_dataset.uri = destination_uri
  else:
    raise RuntimeError(extract_job.errors)


def executor_main():
  """Main executor."""

  parser = argparse.ArgumentParser()
  parser.add_argument('--executor_input', type=str)
  parser.add_argument('--function_to_execute', type=str)

  args, _ = parser.parse_known_args()
  executor_input = json.loads(args.executor_input)
  function_to_execute = globals()[args.function_to_execute]

  executor.Executor(
      executor_input=executor_input,
      function_to_execute=function_to_execute).execute()


if __name__ == '__main__':
  logging.getLogger().setLevel(logging.INFO)
  executor_main()
