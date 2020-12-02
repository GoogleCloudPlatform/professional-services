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

import google.api_core.client_info
from google.cloud import bigquery

CLIENT_INFO = google.api_core.client_info.ClientInfo(
    user_agent="google-pso-example/bq-email-exports")


def main(event, context):
    """Entrypoint for Cloud Function"""

    data = base64.b64decode(event['data'])
    upstream_bq_dts_obj = json.loads(data)
    error = upstream_bq_dts_obj.get('errorStatus')
    if error:
        logging.error(
            RuntimeError(f"Error in upstream query job: {error['message']}."))
    else:
        project_id = get_env('PROJECT_ID')
        dataset_id = upstream_bq_dts_obj['destinationDatasetId']
        table_name = upstream_bq_dts_obj['params'][
            'destination_table_name_template']
        schedule_time = upstream_bq_dts_obj['scheduleTime']

        bq_client = bigquery.Client(client_info=CLIENT_INFO)

        dataset_ref = bigquery.DatasetReference.from_string(
            dataset_id, default_project=project_id)
        table_ref = dataset_ref.table(table_name)
        destination_uri = get_destination_uri(schedule_time)
        extract_config = bigquery.ExtractJobConfig(
            compression=get_env('COMPRESSION'),
            destination_format=get_env('DEST_FMT'),
            field_delimeter=get_env('FIELD_DELIMITER'),
            use_avro_logical_types=get_env('USE_AVRO_TYPES'))
        bq_client.extract_table(table_ref,
                                destination_uri,
                                job_id_prefix="email_export_",
                                job_config=extract_config)
        print(
            f"Exporting {project_id}:{dataset_id}.{table_name} to {destination_uri}"
        )


def get_destination_uri(schedule_time):
    """Returns destination GCS URI for export"""
    return (f"gs://{get_env('BUCKET_NAME')}/"
            f"{schedule_time}/{get_env('OBJECT_NAME')}")


def get_env(name):
    """Returns environment variable"""
    return os.environ[name]
