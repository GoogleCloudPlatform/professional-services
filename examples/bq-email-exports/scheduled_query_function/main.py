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
Cloud Function to run the specified query on a BigQuery anonymous table.
Triggered by Cloud Scheduler.
"""

import os

from google.cloud import bigquery, storage


def main(event, context):
    """Entrypoint for Cloud Function"""

    bq_client = bigquery.Client()
    storage_client = storage.Client()

    query_path = os.environ.get('GCS_QUERY_PATH')
    bucket = storage_client.bucket(query_path.split('/')[2])
    query_blob = bucket.blob(query_path.split('/')[3])
    query = str(query_blob.download_as_string(), 'utf-8')

    job_config = bigquery.QueryJobConfig(
        allow_large_results=os.environ.get('ALLOW_LARGE_RESULTS'),
        use_query_cache=os.environ.get('USE_QUERY_CACHE'),
        flatten_results=os.environ.get('FLATTEN_RESULTS'),
        maximum_bytes_billed=os.environ.get('MAX_BYTES_BILLED'),
        use_legacy_sql=os.environ.get('USE_LEGACY_SQL'))

    query_job = bq_client.query(query,
                                job_config=job_config,
                                job_id_prefix="email_query_")
    print(f"Query job {query_job.job_id} running.")
