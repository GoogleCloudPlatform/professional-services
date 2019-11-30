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


def table_exists(bq_client: bigquery.Client,
                 project_id: str,
                 dataset_id: str,
                 table_name: str) -> bool:
    """Determines whether table already exists or not in BigQuery.

    Args:
        bq_client: bigquery.Client object
        project_id: String of GCP project where table should be.
        dataset_id: String of dataset ID in BQ where table should be.
        table_name: String of table name in BQ.

    Returns:
        Boolean indicating if table exists.
    """
    dataset_ref = bq_client.get_dataset(bigquery.DatasetReference(
        project=project_id,
        dataset_id=dataset_id))
    table_list = list(bq_client.list_tables(dataset=dataset_ref))
    return table_name in [table.table_id for table in table_list]


def create_table(bq_client: bigquery.Client,
                 project_id: str,
                 dataset_id: str,
                 table_name: str) -> None:
    """Creates a table in BigQuery with specified name.

    Args:
        bq_client: bigquery.Client object
        project_id: String of GCP project where table should be.
        dataset_id: String of dataset ID in BQ where table should be.
        table_name: String of table name in BQ.

    Returns: None; Logs message in Stackdriver.
    """
    schema = [
        bigquery.SchemaField("last_read_timestamp", "TIMESTAMP"),
        bigquery.SchemaField("days_since_last_read", "INTEGER"),
        bigquery.SchemaField("read_count_30_days", "INTEGER"),
        bigquery.SchemaField("read_count_90_days", "INTEGER"),
        bigquery.SchemaField("project_id", "STRING"),
        bigquery.SchemaField("bucket_name", "STRING"),
        bigquery.SchemaField("export_day", "DATE"),
        bigquery.SchemaField("recommended_OLM", "STRING")
    ]
    try:
        dataset_ref = bq_client.get_dataset(bigquery.DatasetReference(
            project=project_id,
            dataset_id=dataset_id))
        table_ref = dataset_ref.table(table_name)
        table = bigquery.Table(table_ref, schema=schema)
        bq_client.create_table(table)
        logging.info(f"Table {table_name} created in {project_id}.{dataset_id}")

    except Exception as e:
        logging.error(f"Failed to create table {table_name}")
        logging.error(e)


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
        # In case someone does not do the backfill process
        if not table_exists(bq_client,
                            config_vars['OUTPUT_PROJECT_ID'],
                            config_vars['OUTPUT_DATASET_ID'],
                            config_vars['OUTPUT_TABLE_NAME']):
            create_table(bq_client,
                         config_vars['OUTPUT_PROJECT_ID'],
                         config_vars['OUTPUT_DATASET_ID'],
                         config_vars['OUTPUT_TABLE_NAME'])
        execute_query(bq_client, 'audit_log_query.sql')

    except Exception as e:
        logging.error("Failed to create resources.")
        logging.error(e)


if __name__ == "__main__":
    main()