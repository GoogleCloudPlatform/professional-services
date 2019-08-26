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
import os
import utils

from google.cloud import automl_v1beta1, storage, bigquery
from google.cloud.automl_v1beta1.proto import service_pb2


logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


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
    logger.info("Starting text classification.\n")
    input_bucket_name = input_path.replace('gs://', '').split('/')[0]
    input_txt_folder = f"gs://{input_bucket_name}/{demo_dataset}/txt"

    # Set up storage client
    storage_client = storage.Client.from_service_account_json(service_acct)
    bucket_name, path = utils.get_bucket_blob(input_txt_folder)
    bucket = storage_client.get_bucket(bucket_name)
    
    results = []
    for document_path in bucket.list_blobs(prefix=path):
        logging.info('Extracting the subject for file: {}'.format(document_path.name))
        document_abs_path = os.path.join('gs://', bucket_name, document_path.name)
        content = utils.download_string(document_abs_path, service_acct).read()
        subject, score = run_automl_text(content, main_project_id, model_id, service_acct, compute_region)
        logger.info(f"Predicted subject: {subject}.")
        logger.info(f"Predicted class score: {score}.")
  
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
    utils.save_to_bq(
        demo_dataset,
        demo_table,
        results,
        service_acct,
        _create_table=True,
        schema=schema)
    logger.info('Text classification finished.\n')
