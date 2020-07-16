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

from google.cloud import bigquery


def main(event, context):
    """Entrypoint for Cloud Function"""

    # Set variables
    query = "SELECT CONCAT('https://stackoverflow.com/questions/'," \
    "CAST(id as STRING)) as url, view_count " \
    "FROM `bigquery-public-data.stackoverflow.posts_questions` " \
    "WHERE tags like '%google-bigquery%' ORDER BY view_count DESC LIMIT 10"
    allow_large_results = True
    use_query_cache = True
    flatten_results = False
    max_bytes_billed = "1000000000"
    use_legacy_sql = False

    bq_client = bigquery.Client()

    job_config = bigquery.QueryJobConfig(
        allow_large_results=allow_large_results,
        use_query_cache=use_query_cache,
        flatten_results=flatten_results,
        maximum_bytes_billed=max_bytes_billed,
        use_legacy_sql=use_legacy_sql)

    query_job = bq_client.query(query,
                                job_config=job_config,
                                job_id_prefix="email_query_")
    print(f"Query job {query_job.job_id} running.")
