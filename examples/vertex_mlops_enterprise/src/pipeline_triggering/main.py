# Copyright 2023 Google LLC
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
"""Cloud Function to be triggered by Pub/Sub."""

import os
import json
import logging
from google.cloud import aiplatform
from google.cloud import storage
import base64


def trigger_pipeline(event, context):

    project = os.getenv("PROJECT")
    region = os.getenv("REGION")
    sa = os.getenv("SERVICE_ACCOUNT")
    pipeline_name = os.getenv("PIPELINE_NAME")
    gcs_pipeline_file_location = os.getenv("GCS_PIPELINE_FILE_LOCATION")

    if not project:
        raise ValueError("Environment variable PROJECT is not set.")
    if not region:
        raise ValueError("Environment variable REGION is not set.")
    if not gcs_pipeline_file_location:
        raise ValueError("Environment variable GCS_PIPELINE_FILE_LOCATION is not set.")
    if not sa:
        raise ValueError("Environment variable SERVICE_ACCOUNT is not set.")

    storage_client = storage.Client()

    path_parts = gcs_pipeline_file_location.replace("gs://", "").split("/")
    bucket_name = path_parts[0]
    blob_name = "/".join(path_parts[1:])

    bucket = storage_client.bucket(bucket_name)
    blob = storage.Blob(bucket=bucket, name=blob_name)

    if not blob.exists(storage_client):
        raise ValueError(f"{gcs_pipeline_file_location} does not exist.")

    data = base64.b64decode(event["data"]).decode("utf-8")
    logging.info(f"Event data: {data}")
    
    parameter_values = json.loads(data)
    job = aiplatform.PipelineJob(display_name = pipeline_name,
                             template_path = gcs_pipeline_file_location,
                             parameter_values = parameter_values,
                             project = project,
                             location = region)

    response = job.submit(service_account=sa,
           network=None)


    logging.info(response)


