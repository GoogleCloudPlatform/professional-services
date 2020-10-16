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
    log_entry = json.loads(data)
    status = log_entry['severity']
    if status == "ERROR":
        code = log_entry['protoPayload']['status']['code']
        message = log_entry['protoPayload']['status']['message']
        logging.error(
            RuntimeError(
                f"Error in upstream query job. Code {code}: {message}"))
    else:
        project_id = log_entry['protoPayload']['serviceData'][
            'jobCompletedEvent']['job']['jobName']['projectId']
        dataset_id = log_entry['protoPayload']['serviceData'][
            'jobCompletedEvent']['job']['jobConfiguration']['query'][
                'destinationTable']['datasetId']
        table_name = log_entry['protoPayload']['serviceData'][
            'jobCompletedEvent']['job']['jobConfiguration']['query'][
                'destinationTable']['tableId']

        bq_client = bigquery.Client()

        destination_uri = f"gs://{os.environ.get('BUCKET_NAME')}/{os.environ.get('OBJECT_NAME')}"
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
