#!/usr/bin/python2
# Copyright 2018 Google Inc. All Rights Reserved.
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
"""Computes evaluation metrics for field extraction."""

import argparse
from io import BytesIO, StringIO
import math
import numpy as np
import pandas as pd
import re
import yaml

from google.cloud import bigquery
from google.oauth2 import service_account as service_account_utils

import metric_utils
from utils import bq_utils
from utils import constants
from utils import gcs_utils


def load_extracted_values(project_id, bq_dataset, bq_table_results, service_account):
  """Pulls the result table from BigQuery."""
  bq_client = bigquery.Client.from_service_account_json(service_account)
  query = 'SELECT * FROM `{}.{}.{}`'.format(project_id, bq_dataset,
                                            bq_table_results)
  credentials = service_account_utils.Credentials.from_service_account_file(service_account)
  df_results = pd.read_gbq(
      query=query,
      project_id=project_id,
      credentials=credentials,
      dialect='standard')
  return df_results


def load_truth_values(truth_path, service_account):
  """Loads the ground truth CSV from gcs."""
  truth_byte_stream = gcs_utils.download_string(truth_path, service_account)
  df_truth = pd.read_csv(truth_byte_stream, encoding='utf-8')
  return df_truth


def compute_accuracy_per_field(field_name, equality_fn, postproces_fn, 
                               list_truth_values, list_extracted_values):

  is_equal_list = []
  for truth_value, extracted_value in zip(list_truth_values, list_extracted_values):

    if extracted_value == constants.VALUE_NULL:
      if pd.isnull(truth_value):
        is_equal_list.append(True)
      else:
        is_equal_list.append(False)

    else:
      if postproces_fn:
        extracted_value = postproces_fn.process(extracted_value)
      is_equal = equality_fn.is_equal(truth_value, extracted_value)
      is_equal_list.append(is_equal)

  return np.mean(is_equal_list)


def test_against_truth(project_id, truth_path, bq_dataset,
                       bq_table_results, bq_table_write,
                       config_fields_to_extract, service_account):
  """Merges the extracted and truth, compare them and writes results to BigQuery."""
  
  print ('Computing evaluation metrics...')

  # Merge extracted and truth results.
  df_results = load_extracted_values(project_id, bq_dataset, bq_table_results, service_account)
  df_truth = load_truth_values(truth_path, service_account)
  merged_df = pd.merge(
      df_results,
      df_truth,
      on=[constants.FILENAME],
      how='inner',
      suffixes=('_extracted', '_truth'))
  print('{} files that are in the truth record'.format(len(merged_df)))

  # Compute accuracy metrics.
  acc_metrics = {}
  for x in config_fields_to_extract:
    field_name, postprocess_fn, equality_fn = metric_utils.parse_field_config(x)
    field_acc = compute_accuracy_per_field(
      field_name,
      equality_fn,
      postprocess_fn,
      list_truth_values=merged_df[field_name +'_truth'],
      list_extracted_values=merged_df[field_name +'_extracted'])
    acc_metrics[field_name] = round(field_acc, 2)

  # Writes it to BigQuery.
  list_fields = [x['field_name'] for x in config_fields_to_extract]
  schema = [bigquery.SchemaField(field, 'FLOAT', mode='REQUIRED') for field in list_fields]
  bq_utils.save_to_bq(bq_dataset, bq_table_write, [acc_metrics], service_account, schema=schema)
  print ('Evaluation metrics have been pushed to BigQuery.')


if __name__ == '__main__':
  parser = argparse.ArgumentParser()
  parser.add_argument(
      '--bq_dataset',
      help='The BigQuery dataset',
      required=True)
  parser.add_argument(
      '--bq_table_results',
      help='The BigQuery View where the extracted values are.',
      default='all_extracted_info')
  parser.add_argument(
      '--bq_table_output',
      help='The BigQuery table that the results will be written to',
      default='evaluation_metric')
  parser.add_argument(
      '--config_file',
      help='Path to configuration file.',
      required=True
    )
  args = parser.parse_args()

  with open(args.config_file, 'r') as stream:
      config = yaml.load(stream, Loader=yaml.FullLoader)

  test_against_truth(
      project_id=config['main_project']['main_project_id'],
      truth_path=config['truth_csv'],
      bq_dataset=args.bq_dataset,
      bq_table_results=args.bq_table_results,
      bq_table_write=args.bq_table_output,
      config_fields_to_extract=config['fields_to_extract'],
      service_account=config['service_keys']['key_bq_and_gcs'],
  )
