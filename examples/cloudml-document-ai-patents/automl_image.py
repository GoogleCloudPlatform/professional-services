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
"""Runs AutoML Image classifier, writes the results to BigQuery and copies doc to GCS."""

import os
import sys
import utils
import logging

from google.cloud import storage, bigquery
from google.cloud import automl_v1beta1 as automl

# TODO: Clean classify write into submodules + handle initialization of the clients better (is it the right place).
# TODO: Rename sample_handler + is it necessary to feed the string to the API (vs path)

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

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
                   input_path,
                   model_full_id
                   ):
    bucket = storage_client.bucket(bucket_name)
    params = {}
    lines = []

    schema = [
        bigquery.SchemaField('file', 'STRING', mode='REQUIRED'),
        bigquery.SchemaField('class', 'STRING', mode='REQUIRED'),
        bigquery.SchemaField('class_confidence', 'STRING', mode='REQUIRED'),
        ]
    table = utils.create_table(bq_client, bq_dataset, bq_table, schema)
    if score_threshold:
        params = {"score_threshold": str(score_threshold)}

    for blob in bucket.list_blobs(prefix=str(prefix + "/")):
        if blob.name.endswith(".png"):
            logger.info(os.path.basename(blob.name))
            content = utils.sample_handler(storage_client, bucket_name, blob.name)
            payload = {"image": {"image_bytes": content}}
            response = prediction_client.predict(model_full_id, payload, params)
            for result in response.payload:
                logger.info("File location: {}".format(os.path.join('gs://',bucket_name, blob.name)))
                logger.info("Predicted class name: {}".format(result.display_name))
                logger.info("Predicted class score: {}\n".format(result.classification.score))

                if result.display_name == "datasheets":
                   pass
                else:
                    # Copy from the pdf folder to the selected_pdf_folder
                    filename = os.path.basename(blob.name).replace('.png', '.pdf')
                    input_pdf_path = os.path.join(input_path, filename)
                    selected_pdf_path = os.path.join(selected_pdf_folder, filename)
                    bucket_input, blob_input = utils.get_bucket_blob(input_pdf_path)
                    bucket_output, blob_output = utils.get_bucket_blob(selected_pdf_path)

                    utils.copy_blob(bucket_input, blob_input, 
                              bucket_output, blob_output,
                              service_account)

                rows_to_insert = [
                    (str(blob.name).replace(".png", ".pdf").replace(prefix,"").replace("/",""), result.display_name, result.classification.score),
                ]
                load_job = bq_client.insert_rows(table, rows_to_insert)


def predict(main_project_id,
            input_path,
            demo_dataset,
            demo_table,
            model_id,
            service_acct,
            compute_region,
            score_threshold=0.5):
    """Reads some PNG, classifies them and copies the non-datasheet ones (PDF version) to new folder.

    Args:
      input_folder_png: Path to the folder containing images.
      input_path: Path to the folder containing pdfs.
      selected_pdf_folder: Folder where to put the valid pdfs.
      main_project_id: Project ID where the model lives.
      model_id: ID of the AutoML classification model.
      bq_dataset: Existing BigQuery dataset that contains the table that the results will be written to.
      bq_table: BigQuery table that the results will be written to.
      service_account: API key needed to access BigQuery.
      score_threshold: The required confidence level for AutoML to make a prediction.
      compute_region: Compute region for AutoML model.
    """
    logger.info("Starting image classification.")
    input_bucket_name = input_path.replace('gs://', '').split('/')[0]
    input_folder_png = f"gs://{input_bucket_name}/{demo_dataset}/png"

    selected_pdf_folder =  f"gs://{input_bucket_name}/{demo_dataset}/valid_pdf"

    # Set up client for the AutoML Vision model
    # Note, you need to give this service account AutoML permission within the pdf-processing-219114 project
    automl_client = automl.AutoMlClient.from_service_account_json(service_acct)
    model_full_id = automl_client.model_path(
        main_project_id, compute_region, model_id)
    prediction_client = automl.PredictionServiceClient.from_service_account_json(
        service_acct)

    # Set up client for BigQuery and GCS.
    storage_client = storage.Client.from_service_account_json(
        service_acct)
    bq_client = bigquery.Client.from_service_account_json(
        service_acct)

    bucket_name, file_name = utils.get_bucket_blob(input_folder_png)
    classify_write(
        bucket_name,
        file_name,
        selected_pdf_folder,
        prediction_client,
        storage_client,
        bq_client,
        demo_dataset,
        demo_table,
        score_threshold,
        service_acct,
        input_path,
        model_full_id,
        )
    logger.info("Image classification finished.\n")
