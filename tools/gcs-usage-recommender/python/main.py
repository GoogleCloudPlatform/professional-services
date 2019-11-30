# Copyright 2019 Google Inc.
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

from python.config import config_vars
from google.cloud import bigquery
import logging


def get_bq_client() -> bigquery.Client:
    """Retrieves BQ client.

    Returns:
        bigquery.Client object
    """
    return bigquery.Client()


def file_to_string(sql_path: str) -> str:
    """Converts a SQL file holding a SQL query to a string.

    Args:
        sql_path: String in the form of a file path

    Returns:
        String representation of a file
    """
    with open(sql_path, 'r') as sql_file:
        return sql_file.read()


def execute_query(bq_client: bigquery.Client, query_path: str) -> None:
    """Executes transformation query.

    Args:
        bq_client: bigquery.Client object
        query_path: String of path  to file holding SQL query to execute
    """
    try:
        dataset_ref = bq_client.get_dataset(bigquery.DatasetReference(
            project=config_vars['OUTPUT_PROJECT_ID'],
            dataset_id=config_vars['OUTPUT_DATASET_ID']))
        table_ref = dataset_ref.table(config_vars['OUTPUT_TABLE_NAME'])
        job_config = bigquery.QueryJobConfig()
        job_config.write_disposition = bigquery.WriteDisposition().WRITE_TRUNCATE
        job_config.destination = table_ref
        sql = file_to_string(query_path)
        sql = sql.format(**config_vars)
        logging.info('Attempting query...')

        # Execute Query
        query_job = bq_client.query(
            query=sql,
            job_config=job_config)

        return query_job.result()  # Waits for the query to finish

    except Exception as e:
        logging.error("Query failed to execute.")
        logging.error(e)


def main():
    try:
        bq_client = get_bq_client()
        execute_query(bq_client, 'audit_log_query.sql')

    except Exception as e:
        logging.error("Failed to create resources.")
        logging.error(e)


if __name__ == "__main__":
    main()