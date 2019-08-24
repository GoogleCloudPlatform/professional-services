# Copyright 2019 Google Inc. All Rights Reserved.
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
"""Runs AutoML Text classification on the US patents in a given folder."""
import logging
import sys
import os
import re
from io import BytesIO, StringIO

from google.cloud import automl_v1beta1, storage, bigquery
from google.cloud.automl_v1beta1.proto import service_pb2


logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def get_bucket_blob(full_path):
  match = re.match(r'gs://([^/]+)/(.+)', full_path)
  bucket_name = match.group(1)
  blob_name = match.group(2)
  return bucket_name, blob_name

def create_table(bq_client, dataset, table_name, schema):
  """Creates a BigQuery table."""
  dataset_ref = bq_client.dataset(dataset)
  table_ref = dataset_ref.table(table_name)

  try:
      table = bq_client.get_table(table_ref)
      raise ValueError('Table should not exist: {}'.format(table_name))
  except:
      pass

  table = bigquery.Table(table_ref, schema=schema)
  table = bq_client.create_table(table)
  return table

def save_to_bq(bq_dataset, bq_table, rows_to_insert, service_account, _create_table=True, schema=None):
  """Writes data to a BigQuery dataset.
  
  Args:
    bq_dataset: Name of the BigQuery dataset (string).
    bq_table: Name of the BigQuery table (string).
    rows_to_insert: One of: list of tuples/list of dictionaries). Row data to be inserted.
      If a list of tuples is given, each tuple should contain data for each schema field on the current table
      and in the same order as the schema fields. If a list of dictionaries is given, the keys must include all
      required fields in the schema. Keys which do not correspond to a field in the schema are ignored.
    service_account: Service account of BigQuery
    _create_table: Whether to create the table (default = True).
    schema: Schema of the data (list of `SchemaField`). Required if we create_table=True.
  """
  bq_client = bigquery.Client.from_service_account_json(service_account)

  if _create_table:
    if not schema:
      raise ValueError('Schema is required when creating the table')
    table = create_table(bq_client, bq_dataset, bq_table, schema)
    print ('Table created')

  dataset_ref = bq_client.dataset(bq_dataset)
  table_ref = dataset_ref.table(bq_table)
  try:
    table = bq_client.get_table(table_ref)
  except:
    raise ValueError('Table {} does not exist.'.format(bq_table))

  load_job = bq_client.insert_rows(table, rows_to_insert)

def download_string(full_path, service_account):
  """Downloads the content of a gcs file."""
  storage_client = storage.Client.from_service_account_json(service_account)
  bucket_name, path = get_bucket_blob(full_path)
  bucket = storage_client.get_bucket(bucket_name)
  blob = bucket.blob(path)
  byte_stream = BytesIO()
  blob.download_to_file(byte_stream)
  byte_stream.seek(0)
  return byte_stream


def run_automl_text(content, project_id, model_id, service_account, compute_region='us-central1'):
    """Runs AutoML prediction on 1 document."""
    prediction_client = automl_v1beta1.PredictionServiceClient.from_service_account_json(service_account)
    name = 'projects/{}/locations/{}/models/{}'.format(project_id, compute_region, model_id)
    payload = {'text_snippet': {'content': content, 'mime_type': 'text/plain' }}
    params = {}
    response = prediction_client.predict(name, payload, params)
    
    max_score = - 1.0
    argmax = None
    for result in response.payload:
        if result.classification.score >= max_score:
            argmax = result.display_name
            max_score = result.classification.score
    if not argmax:
        raise ValueError('Auto ML Text did not return any result. Check the API')
    return argmax, max_score


def predict(main_project_id,
            input_path,
            demo_dataset,
            demo_table,
            model_id,
            service_acct,
            compute_region):
    """Runs AutoML Text classifier on a GCS folder and pushes results to BigQuery."""
    print('Starting text classification.')
    input_bucket_name = input_path.replace('gs://', '').split('/')[0]
    input_txt_folder = f"gs://{input_bucket_name}/{demo_dataset}/txt"

    # Set up storage client
    storage_client = storage.Client.from_service_account_json(service_acct)
    bucket_name, path = get_bucket_blob(input_txt_folder)
    bucket = storage_client.get_bucket(bucket_name)
    
    results = []
    for document_path in bucket.list_blobs(prefix=path):
        logging.info('Extracting the subject for file: {}'.format(document_path.name))
        document_abs_path = os.path.join('gs://', bucket_name, document_path.name)
        content = download_string(document_abs_path, service_acct).read()
        subject, score = run_automl_text(content, main_project_id, model_id, service_acct, compute_region)
  
        results.append({
            'file': os.path.basename(document_abs_path.replace('.txt', '.pdf')),
            'subject': subject,
            'score': score
            })

    schema = [
        bigquery.SchemaField('file', 'STRING', mode='NULLABLE'),
        bigquery.SchemaField('subject', 'STRING', mode='NULLABLE'),
        bigquery.SchemaField('score', 'FLOAT', mode='NULLABLE'),
        ]
    save_to_bq(
        demo_dataset,
        demo_table,
        results,
        service_acct,
        _create_table=True,
        schema=schema)
    print('Text classification finished.')
