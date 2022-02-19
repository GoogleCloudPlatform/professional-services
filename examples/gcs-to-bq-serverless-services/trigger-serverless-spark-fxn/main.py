# Copyright 2022 Google Inc. All Rights Reserved.
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

import base64
import time
import json
import google.auth
from google.auth.transport.requests import AuthorizedSession
import logging
from google.cloud import pubsub_v1
from concurrent import futures
from typing import Callable


def get_callback(
        publish_future: pubsub_v1.publisher.futures.Future,
        data: str) -> Callable[[pubsub_v1.publisher.futures.Future], None]:

    def callback(publish_future: pubsub_v1.publisher.futures.Future) -> None:
        try:
            # Wait 60 seconds for the publish call to succeed.
            print(publish_future.result(timeout=60))
        except futures.TimeoutError:
            logging.error(f"Publishing {data} timed out.")

    return callback


def invoke_sreverless_spark(event, context):
    bq_temp_bucket = "<<GCS_TEMP_BUCKET>>"
    gcs_artifact_rep = "<<GCS_ARTIFACT_REPO>>"
    dataset = "<<DATASET_NAME>>"
    bq_table = "<<TABLE_NAME>>"
    error_topic = "<<ERROR_TOPIC>>"
    gcs_message = base64.b64decode(event['data']).decode('utf-8')
    gcs_message_json = json.loads(gcs_message)
    credentials, project_id = google.auth.default(
        scopes=['https://www.googleapis.com/auth/cloud-platform'])
    bq_dataset = f"{project_id}:{dataset}"
    jar_location = f"gs://{gcs_artifact_rep}/GCS2BQWithSpark-1.0-SNAPSHOT.jar"
    service_account = f"gcs-to-bq-sa@{project_id}.iam.gserviceaccount.com"
    bucket_object = f"gs://{gcs_message_json['bucket']}/{gcs_message_json['name']}"
    request_json = {
        "sparkBatch": {
            "args": [
                f"--projectId={project_id}", f"--bqTable={bq_table}",
                f"--bqTempBucket={bq_temp_bucket}",
                f"--inputFileLocation={bucket_object}",
                f"--bqDataset={bq_dataset}",
                f"--deadLetterQueue=projects/{project_id}/topics/{error_topic}"
            ],
            "jarFileUris": f"{jar_location}",
            "mainClass": "com.example.GCS2BQ"
        },
        "environmentConfig": {
            "executionConfig": {
                "serviceAccount": service_account,
                "networkTags": ["serverless-spark"]
            }
        }
    }
    date_time_in_ms = str(time.time()).replace(".", "")
    headers = {'Content-type': 'application/json', 'Accept': 'text/plain'}
    request_url = f"https://dataproc.googleapis.com/v1/projects/{project_id}/locations/us-central1/batches?batchId=gcs2bq-{date_time_in_ms}"
    authed_session = AuthorizedSession(credentials)
    response = authed_session.request('POST',
                                      request_url,
                                      json=request_json,
                                      headers=headers)
    if response.status_code == 200:
        logging.info("Submitted job successfully")
    else:
        publisher = pubsub_v1.PublisherClient()
        topic_path = publisher.topic_path(project_id, error_topic)
        dlq_data = {
            "projectId": f"{project_id}",
            "inputFileLocation": f"{bucket_object}",
            "inputFileFormat": "CSV",
            "bqDataset": f"{bq_temp_bucket}",
            "bqTable": f"{bq_table}",
            "deadLetterQueue": f"projects/{project_id}/topics/{error_topic}"
        }
        publish_futures = []
        publish_future = publisher.publish(topic_path,
                                           json.dumps(dlq_data).encode("utf-8"),
                                           oid=gcs_message_json['id'])
        publish_future.add_done_callback(
            get_callback(publish_future, gcs_message))
        publish_futures.append(publish_future)
        futures.wait(publish_futures, return_when=futures.ALL_COMPLETED)
        logging.error('Job submission joiled')
