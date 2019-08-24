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
# Runs AutoML Object detection.

import argparse
import json
import logging
import os
import sys
import re
from google.cloud import bigquery
from google.cloud import storage, vision
from google.cloud import automl_v1beta1 as automl
from google.cloud.automl_v1beta1.proto import service_pb2
from google.oauth2 import service_account
import tempfile
import io
import yaml

from google.cloud.vision import types
from PIL import Image, ImageDraw

# TODO: Clean function detect_object

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


def get_bucket_blob(full_path):
    match = re.match(r'gs://([^/]+)/(.+)', full_path)
    bucket_name = match.group(1)
    blob_name = match.group(2)
    return bucket_name, blob_name

def sample_handler(storage_client, bucket, filein):
    bucket = storage_client.get_bucket(bucket)
    blob = bucket.get_blob(filein)
    blob.download_as_string(client=storage_client)
    return blob.download_as_string(client=storage_client)

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

def detect_object(gcs_image_folder,
                  gcs_cropped_image_folder,
                  main_project_id,
                  model_id,
                  bq_dataset_output,
                  bq_table_output,
                  prediction_client,
                  storage_client,
                  bq_client):

    match = re.match(r'gs://([^/]+)/(.+)', gcs_image_folder)
    bucket_name = match.group(1)
    prefix = match.group(2)
    dataset_ref = bq_client.dataset(bq_dataset_output)
    table_ref = dataset_ref.table(bq_table_output)
    bucket = storage_client.bucket(bucket_name)
    params = {"timeout":"60.0s"}
    lines = []

    schema = [
        bigquery.SchemaField('file', 'STRING', mode='REQUIRED'),
        bigquery.SchemaField('object', 'STRING', mode='REQUIRED'),
        bigquery.SchemaField('confidence', 'STRING', mode='REQUIRED'),
        bigquery.SchemaField('x_min', 'STRING', mode='REQUIRED'),
        bigquery.SchemaField('x_max', 'STRING', mode='REQUIRED'),
        bigquery.SchemaField('y_min', 'STRING', mode='REQUIRED'),
        bigquery.SchemaField('y_max', 'STRING', mode='REQUIRED'),
        ]
    table = create_table(bq_client, bq_dataset_output, bq_table_output, schema)
    
    for blob in bucket.list_blobs(prefix=str(prefix + "/")):
        if blob.name.endswith(".png"):
            logger.info(os.path.basename(blob.name))
            content = sample_handler(storage_client, bucket_name, blob.name)
            name = 'projects/{}/locations/us-central1/models/{}'.format(main_project_id, model_id)
            payload = {'image': {'image_bytes': content }}
            params = {}
            request = prediction_client.predict(name, payload, params)

            for result in request.payload:
                rows_to_insert = [
                    (str(blob.name).replace(".png", ".pdf").replace(prefix,"").replace("/",""), \
                     result.display_name, \
                     result.image_object_detection.score, \
                     result.image_object_detection.bounding_box.normalized_vertices[0].x, result.image_object_detection.bounding_box.normalized_vertices[1].x, \
                     result.image_object_detection.bounding_box.normalized_vertices[0].y, result.image_object_detection.bounding_box.normalized_vertices[1].y),
                ]
                load_job = bq_client.insert_rows(table, rows_to_insert)

                # As below,  crop the object and save the cropped part as a separated image file 
                file_name = blob.name
                _, temp_local_filename = tempfile.mkstemp() 
                blob.download_to_filename(temp_local_filename)
                im = Image.open(temp_local_filename)
                width, height = im.size
                r_xmin=width*result.image_object_detection.bounding_box.normalized_vertices[0].x
                r_ymin=height*result.image_object_detection.bounding_box.normalized_vertices[0].y
                r_xmax=width*result.image_object_detection.bounding_box.normalized_vertices[1].x
                r_ymax=height*result.image_object_detection.bounding_box.normalized_vertices[1].y
                box = (r_xmin, r_ymin, r_xmax, r_ymax)
                im = Image.open(temp_local_filename)
                im2 = im.crop(box)
                im2.save(temp_local_filename.replace('.png', '-crop.png'), 'png')

                # Upload cropped image to gcs bucket
                new_file_name = os.path.join(gcs_cropped_image_folder,os.path.basename(blob.name).replace('.png', '-crop.png'))
                new_file_bucket, new_file_name = get_bucket_blob(new_file_name)
                new_blob = blob.bucket.blob(new_file_name)
                new_blob.upload_from_filename(temp_local_filename)
                os.remove(temp_local_filename)
        else:
            pass

def predict(main_project_id,
			input_path,
         	demo_dataset,
			demo_table,
			model_id,
			service_acct,
			compute_region):
  """Initializes the client and calls `detect_object`.
  
  Args:
    input_image_folder: Path to the folder containing images.
    bq_dataset_output: Existing BigQuery dataset that contains the table that the results will be written to
    bq_table_output: BigQuery table that the results will be written to.
    compute_region: Compute region for AutoML.
    main_project_id: Project ID where AutoML lives.
    model_id: ID of AutoML model.
    service_acct: API key needed to access AutoML object detection.
    service_acct: API key needed to access BigQuery and GCS.
  """
  print("Starting object detection.")

  input_bucket_name = input_path.replace('gs://', '').split('/')[0]
  input_folder_png = f"gs://{input_bucket_name}/{demo_dataset}/png"
  output_cropped_images_folder = f"gs://{input_bucket_name}/{demo_dataset}/cropped_images"

  automl_client = automl.AutoMlClient.from_service_account_json(service_acct)
  model_full_id = automl_client.model_path(
      main_project_id,
      compute_region,
      model_id)
  prediction_client = automl.PredictionServiceClient.from_service_account_json(service_acct)

  # Create other clients
  storage_client = storage.Client.from_service_account_json(service_acct) 
  bq_client = bigquery.Client.from_service_account_json(service_acct)

  detect_object(
      input_folder_png,
      output_cropped_images_folder,
      main_project_id,
      model_id,
      demo_dataset,
      demo_table,
      prediction_client,
      storage_client,
      bq_client,
      )
  print("Object detection finished.")

