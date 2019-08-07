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
"""Runs AutoML Image classifier, writes the results to BigQuery and copies doc to GCS."""

import argparse
import json
import os
import sys
import re
from google.cloud import storage
from google.cloud import bigquery
from google.cloud import automl_v1beta1 as automl
import yaml

from utils import constants
from utils import gcs_utils


# TODO: Change approach (messy) 'bucket name images that are not patents are moved to so that the NER model does not classify them'
# TODO: Clean classify write into submodules + handle initialization of the clients better (is it the right place).
# TODO: Rename sample_handler + is it necessary to feed the string to the API (vs path)


def sample_handler(bucket, filein, service_account):
    client = storage.Client.from_service_account_json(service_account)
    bucket = client.get_bucket(bucket)
    blob = bucket.get_blob(filein)
    blob.download_as_string(client=client)
    return blob.download_as_string(client=client)


def create_table(bq_client, dataset, table_name, schema):
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

def copy_blob(bucket_name, blob_name, new_bucket_name, new_blob_name, service_account):
    """Copies a blob from one bucket to another with a new name."""
    storage_client = storage.Client.from_service_account_json(service_account)
    source_bucket = storage_client.get_bucket(bucket_name)
    source_blob = source_bucket.blob(blob_name)
    destination_bucket = storage_client.get_bucket(new_bucket_name)

    new_blob = source_bucket.copy_blob(
        source_blob, destination_bucket, new_blob_name)

    print('Blob {} in bucket {} copied to blob {} in bucket {}.'.format(
        source_blob.name, source_bucket.name, new_blob.name,
        destination_bucket.name))


def classify_write(bucket_name,
                   prefix,
                   selected_pdf_folder,
                   prediction_client,
                   storage_client,
                   bq_client,
                   bq_dataset,
                   bq_table,
                   score_threshold,
                   service_account,
                   input_folder_pdf,
                   model_full_id
                   ):
    bucket = storage_client.bucket(bucket_name)
    params = {}
    lines = []

    schema = [
        bigquery.SchemaField(constants.FILENAME, 'STRING', mode='REQUIRED'),
        bigquery.SchemaField('class', 'STRING', mode='REQUIRED'),
        bigquery.SchemaField('class_confidence', 'STRING', mode='REQUIRED'),
        ]
    table = create_table(bq_client, bq_dataset, bq_table, schema)
    if score_threshold:
        params = {"score_threshold": str(score_threshold)}
    print(prefix)
    for blob in bucket.list_blobs(prefix=str(prefix + "/")):
        if blob.name.endswith(".png"):
            content = sample_handler(bucket_name, blob.name, service_account)
            payload = {"image": {"image_bytes": content}}
            response = prediction_client.predict(model_full_id, payload, params)
            for result in response.payload:
                print("Location: {}".format(os.path.join('gs://',bucket_name, blob.name)))
                print("Predicted class name: {}".format(result.display_name))
                print("Predicted class score: {}".format(result.classification.score))

                if result.display_name == "datasheets":
                   pass
                else:
                    # Copy from the pdf folder to the selected_pdf_folder
                    filename = os.path.basename(blob.name).replace('.png', '.pdf')
                    input_pdf_path = os.path.join(input_folder_pdf, filename)
                    selected_pdf_path = os.path.join(selected_pdf_folder, filename)
                    bucket_input, blob_input = gcs_utils.get_bucket_blob(input_pdf_path)
                    bucket_output, blob_output = gcs_utils.get_bucket_blob(selected_pdf_path)

                    copy_blob(bucket_input, blob_input, 
                              bucket_output, blob_output,
                              service_account)

                rows_to_insert = [
                    (str(blob.name).replace(".png", ".pdf").replace(prefix,"").replace("/",""), result.display_name, result.classification.score),
                ]
                load_job = bq_client.insert_rows(table, rows_to_insert)

    print('Step 2 finished.')


def main(input_folder_png,
         input_folder_pdf,
         selected_pdf_folder,
         model_project_id,
         model_id,
         bq_dataset,
         bq_table,
         service_account,
         score_threshold,
         compute_region):
    """Reads some PNG, classifies them and copies the non-datasheet ones (PDF version) to new folder.

    Args:
      input_folder_png: Path to the folder containing images.
      input_folder_pdf: Path to the folder containing pdfs.
      selected_pdf_folder: Folder where to put the valid pdfs.
      model_project_id: Project ID where the model lives.
      model_id: ID of the AutoML classification model.
      bq_dataset: Existing BigQuery dataset that contains the table that the results will be written to.
      bq_table: BigQuery table that the results will be written to.
      service_account: API key needed to access BigQuery.
      score_threshold: The required confidence level for AutoML to make a prediction.
      compute_region: Compute region for AutoML model.
    """

    # Set up client for the AutoML Vision model
    # Note, you need to give this service account AutoML permission within the pdf-processing-219114 project
    automl_client = automl.AutoMlClient.from_service_account_json(service_account)
    model_full_id = automl_client.model_path(
        model_project_id, compute_region, model_id)
    prediction_client = automl.PredictionServiceClient.from_service_account_json(
        service_account)

    # Set up client for BigQuery and GCS.
    storage_client = storage.Client.from_service_account_json(
        service_account)
    bq_client = bigquery.Client.from_service_account_json(
        service_account)

    print ('Starting classification')
    bucket_name, file_name = gcs_utils.get_bucket_blob(input_folder_png)
    classify_write(
        bucket_name,
        file_name,
        args.selected_pdf_folder,
        prediction_client,
        storage_client,
        bq_client,
        bq_dataset,
        bq_table,
        score_threshold,
        service_account,
        input_folder_pdf,
        model_full_id,
        )


if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument(
        '--input_folder_png',
        help='Path to the folder containing images.',
        required=True
    )
    parser.add_argument(
        '--input_folder_pdf',
        help='Path to the folder containing pdfs.',
        required=True
    )
    parser.add_argument(
        '--selected_pdf_folder',
        help='Folder where to put the valid pdfs.',
        required=True
    )
    parser.add_argument(
        '--bq_dataset',
        help='existing BigQuery dataset that contains the table that the results will be written to.',
        required=True
    )
    parser.add_argument(
        '--bq_table',
        help='BigQuery table that the results will be written to.',
        default='document_classification'
    )
    parser.add_argument(
        '--score_threshold',
        help='The required confidence level for AutoML to make a prediction',
        default=0.5,
    )
    parser.add_argument(
        '--compute_region',
        default='us-central1',
    )
    parser.add_argument(
        '--config_file',
        help='Path to configuration file.',
        required=True
    )
    args = parser.parse_args()

    with open(args.config_file, 'r') as stream:
        config = yaml.load(stream, Loader=yaml.FullLoader)

    main(args.input_folder_png,
         args.input_folder_pdf,
         args.selected_pdf_folder,
         config['model_imgclassifier']['project_id'],
         config['model_imgclassifier']['model_id'],
         args.bq_dataset,
         args.bq_table,
         config['service_keys']['key_bq_and_gcs'],
         args.score_threshold,
         args.compute_region
        )