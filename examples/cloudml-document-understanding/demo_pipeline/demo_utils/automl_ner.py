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
"""Runs AutoML NER on the text and writes results to BigQuery."""

import argparse
import logging
import os
import re
import yaml

from google.cloud import storage
from google.cloud import bigquery
from google.cloud import automl_v1beta1 as automl

from utils import bq_utils
from utils import constants
from utils import gcs_utils


logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


def extract_field_from_payload(text, payload, field_name, default_value=constants.VALUE_NULL):
  """Parses a payload to extract the value of the given field.

  Args
    text: text analyzed by AutoML NER.
    payload: payload returned by AutoML NER.
    field_name: Name of the field to extract.
    default_value: Value to return if the field can not be found.

  Returns:
    extracted value.

  In case the payload contains several times the given field, we take the occurence
    with the highest score.
  """
  value_found = default_value
  score_found = -1
  for result in payload:
    extracted_field_name = result.display_name
    extracted_value_start = result.text_extraction.text_segment.start_offset
    extracted_value_end = result.text_extraction.text_segment.end_offset
    
    extracted_value = text[extracted_value_start:extracted_value_end]

    score = result.text_extraction.score
    
    if (extracted_field_name == field_name) and (score > score_found):
      score_found = score
      value_found = extracted_value
  return value_found


def run_automl_single(ocr_path,
                      list_fields,
                      service_account_ner,
                      service_account_gcs,
                      ner_model_id,
                      project_id_ner,
                      compute_region):
  """Runs AutoML NER on a single document and returns the dictionary of results."""

  # Set up client for AutoML NER model
  automl_client = automl.AutoMlClient.from_service_account_json(service_account_ner)
  model_full_id = automl_client.model_path(
      project_id_ner, compute_region, ner_model_id)
  prediction_client = automl.PredictionServiceClient.from_service_account_json(service_account_ner)

  # Load json
  text = gcs_utils.download_string(ocr_path, service_account_gcs).read().decode('utf-8')

  # Call AutoML
  payload = {"text_snippet": {"content": text, "mime_type": "text/plain"}}
  params = {}
  response = prediction_client.predict(model_full_id, payload, params)
  
  # Parse results
  results = {constants.FILENAME: os.path.basename(ocr_path).replace('.txt', '.pdf')}
  for field in list_fields:
      value_field = extract_field_from_payload(text, response.payload, field)
      results[field] = value_field
  return results


def run_automl_folder(gcs_ocr_text_folder,
                      dataset_bq,
                      table_bq_output,
                      project_id_ner,
                      project_id_bq,
                      ner_model_id,
                      list_fields,
                      service_account_ner,
                      service_account_gcs_bq,
                      compute_region):
  """Runs AutoML NER on a folder and writes results to BigQuery.

  Args:
    gcs_ocr_text_folder: JSON folder (outputs of OCR).    
    dataset_bq: BiqQuery dataset name.
    table_bq_output: BigQuery table where the ner results are written to.
    project_id_ner: Project ID for AutoML Ner.
    project_id_bq: Project ID for BigQuery Table.
    ner_model_id: AutoML Model ID (NER).
    list_fields: List of field_names to extract (list of string).
    service_account_ner: Location of service account key to access the NER model.
    service_account_gcs_bq: Location of service account key to access BQ and Storage.
    compute_region: Compute Region for NER model.
  """
  logger.info('Running AutoML NER...')

  storage_client = storage.Client.from_service_account_json(service_account_gcs_bq)
  bucket_name, path = gcs_utils.get_bucket_blob(gcs_ocr_text_folder)
  bucket = storage_client.get_bucket(bucket_name)

  list_results = []
  for file in bucket.list_blobs(prefix=path):
    full_filename = os.path.join(gcs_ocr_text_folder, os.path.basename(file.name))
    logger.info(full_filename)
    result = run_automl_single(
        full_filename,
        list_fields,
        service_account_ner,
        service_account_gcs_bq,
        ner_model_id,
        project_id_ner,
        compute_region)
    list_results.append(result)

  schema = [bigquery.SchemaField(constants.FILENAME, 'STRING', mode='NULLABLE')]
  for field in list_fields:
      schema.append(bigquery.SchemaField(field, 'STRING', mode='NULLABLE'))
  
  bq_utils.save_to_bq(
    dataset_bq,
    table_bq_output,
    list_results,
    service_account_gcs_bq,
    _create_table=True,
    schema=schema)

  logger.info('NER results saved to BigQuery.')


if __name__ == '__main__':
  parser = argparse.ArgumentParser()
  parser.add_argument(
      '--gcs_json_path',
      help='JSON folder (outputs of OCR).',
      required=True
  )
  parser.add_argument(
      '--dataset_bq',
      help='BiqQuery dataset name',
      required=True
  )
  parser.add_argument(
      '--compute_region',
      default='us-central1'
  )
  parser.add_argument(
      '--config_file',
      help='Path to configuration file.',
      required=True
  )
  args = parser.parse_args()

  with open(args.config_file, 'r') as stream:
      config = yaml.load(stream, Loader=yaml.FullLoader)
  list_fields = [x['field_name'] for x in config['fields_to_extract']]

  run_automl_folder(
    args.gcs_json_path,
    args.dataset_bq,
    constants.TABLE_NER_RESULTS,  
    config['model_ner']['project_id'],
    config['main_project']['main_project_id'],
    config['model_ner']['model_id'],
    list_fields,
    config['service_keys']['key_ner'],
    config['service_keys']['key_bq_and_gcs'],
    args.compute_region)