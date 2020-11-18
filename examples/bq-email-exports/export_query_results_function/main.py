# Copyright 2020 Google LLC
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#     https://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.
"""
Cloud Function for exporting BigQuery results from an anonymous table to GCS.
Triggered after BigQuery query is complete.
"""

import base64
import json
import logging
import os

from google.cloud import bigquery


def main(event, context):
    """Entrypoint for Cloud Function"""

    data = base64.b64decode(event['data'])
    pubsub_message = json.loads(data)
    error = pubsub_message.get('errorStatus')
    if error:
        logging.error(RuntimeError(f"Error in upstream query job:{error}"))
    else:
        project_id = os.environ.get("PROJECT_ID")
        dataset_id = pubsub_message['destinationDatasetId']
        table_name = pubsub_message['params'][
            'destination_table_name_template']

        bq_client = bigquery.Client()

        destination_uri = get_destination_uri()
        dataset_ref = bigquery.DatasetReference(project_id, dataset_id)
        table_ref = dataset_ref.table(table_name)

        extract_config = bigquery.ExtractJobConfig(
            compression=os.environ.get('COMPRESSION'),
            destination_format=os.environ.get('DEST_FMT'),
            field_delimeter=os.environ.get('FIELD_DELIMITER'),
            use_avro_logical_types=os.environ.get('USE_AVRO_TYPES'))
        bq_client.extract_table(table_ref,
                                destination_uri,
                                job_id_prefix="email_export_",
                                job_config=extract_config)
        print(
            f"Exporting {project_id}:{dataset_id}.{table_name} to {destination_uri}"
        )


def get_destination_uri():
    """Returns destination GCS URI for export"""
    return f"gs://{os.environ.get('BUCKET_NAME')}/{os.environ.get('OBJECT_NAME')}"
