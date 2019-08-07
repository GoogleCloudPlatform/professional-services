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
"""Runs AutoML Text classification on the US patents in a given folder."""

import argparse
import logging
import os
import sys
import yaml

from google.cloud import automl_v1beta1
from google.cloud import bigquery
from google.cloud.automl_v1beta1.proto import service_pb2
from google.cloud import storage

from utils import constants
from utils import bq_utils
from utils import gcs_utils


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


def extract_class_document(document_name, document_col_name, bq_table, bq_dataset, bq_service_account):
    """Looks up in a bigquery table the class of a document."""
    client = bigquery.Client.from_service_account_json(bq_service_account)
    job_config = bigquery.QueryJobConfig()
    query = """
        SELECT class
        FROM `{bq_dataset}.{bq_table}`
        WHERE {document_col_name}='{document_name}'
        LIMIT 10""".format(
            bq_dataset=bq_dataset,
            bq_table=bq_table,
            document_col_name=document_col_name,
            document_name=document_name)
    query_results = client.query(query, job_config=job_config).to_dataframe()
    if len(query_results) != 1:
        raise ValueError(
            'Did not find a unique matche in the {} table for the following document: {}'.format(
                bq_table, document_name))
    return query_results['class'].iloc[0]


def _is_us_patents_fn(document_name, bq_dataset, bq_service_account):
    """Filters the document that are US Patents."""
    document_name = os.path.basename(document_name.replace('.txt', '.pdf'))
    _class = extract_class_document(
        document_name, constants.FILENAME, constants.TABLE_DOCUMENT_CLASSIFICATION, bq_dataset, bq_service_account)
    return _class == 'us_patents'


def run_automl_folder(gcs_folder, bq_dataset, gcs_bq_service_account,
                      project_id_automltext, model_id_automltext, automl_text_service_account, compute_region):
    """Runs AutoML Text classifier on a folder and pushes results to BigQuery."""

    storage_client = storage.Client.from_service_account_json(gcs_bq_service_account)
    bucket_name, path = gcs_utils.get_bucket_blob(gcs_folder)
    bucket = storage_client.get_bucket(bucket_name)
    
    results = []
    for document_path in bucket.list_blobs(prefix=path):
        logging.info('Extracting the subject for file: {}'.format(document_path.name))
        document_abs_path = os.path.join('gs://', bucket_name, document_path.name)
        is_us_patents = _is_us_patents_fn(document_abs_path, bq_dataset, gcs_bq_service_account)
        if is_us_patents:
            content = gcs_utils.download_string(document_abs_path, gcs_bq_service_account).read()
            subject, score = run_automl_text(content, project_id_automltext, model_id_automltext, automl_text_service_account, compute_region)
        else:
            subject = constants.VALUE_NULL
            score = 0.
        results.append({
            constants.FILENAME: os.path.basename(document_abs_path.replace('.txt', '.pdf')),
            'subject': subject,
            'score': score
            })

    schema = [
        bigquery.SchemaField(constants.FILENAME, 'STRING', mode='NULLABLE'),
        bigquery.SchemaField('subject', 'STRING', mode='NULLABLE'),
        bigquery.SchemaField('score', 'FLOAT', mode='NULLABLE'),
        ]
    bq_utils.save_to_bq(
        bq_dataset,
        constants.TABLE_DOCUMENT_SUBJECT,
        results,
        gcs_bq_service_account,
        _create_table=True,
        schema=schema)


if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument(
        '--gcs_folder',
        help='Posprocess ocr folder.',
        required=True
    )
    parser.add_argument(
        '--bq_dataset',
        help='BigQuery Dataset.',
        required=True
    )
    parser.add_argument(
        '--config_file',
        help='Path to configuration file.',
        required=True
    )
    parser.add_argument(
        '--compute_region',
        default='us-central1'
    )
    args = parser.parse_args()

    with open(args.config_file, 'r') as stream:
        config = yaml.load(stream, Loader=yaml.FullLoader)

    logging.info('Running AutoML Text to classify the US patents.')
    schema = [
        bigquery.SchemaField(constants.FILENAME, 'STRING', mode='NULLABLE'),
        bigquery.SchemaField('subject', 'STRING', mode='NULLABLE'),
        ]
    run_automl_folder(
        gcs_folder=args.gcs_folder,
        bq_dataset=args.bq_dataset,
        gcs_bq_service_account=config['service_keys']['key_bq_and_gcs'],
        project_id_automltext=config['model_textclassifier']['project_id'],
        model_id_automltext=config['model_textclassifier']['model_id'],
        automl_text_service_account=config['service_keys']['key_bq_and_gcs'],
        compute_region=args.compute_region)
