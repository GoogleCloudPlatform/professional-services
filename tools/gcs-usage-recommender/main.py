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

from config import config_vars
from google.cloud import storage
from google.cloud import bigquery
from typing import Dict, List, Tuple, Union
import logging
import io
import json


def get_storage_client() -> storage.Client:
    """Retrieves GCS client.

    Returns:
      storage.Client object
    """
    return storage.Client()


def get_bq_client() -> bigquery.Client:
    """Retrieves BQ client.

    Returns:
      bigquery.Client object
    """
    return bigquery.Client()


def parse_bucket_object(resource_name: str) -> Tuple[str, str]:
    """

    :param resource_name:
    :return:
    """
    try:
        full_path = resource_name.split("buckets/", 1)[1].split("/", 1)
        bucket_name = full_path[0]
        object_name = full_path[1]
        if object_name.endswith("/"):
            object_name = None
        return bucket_name, object_name

    except Exception as e:
        logging.error("Parsing bucket and object failed.")
        logging.error(e)


def recommend_storage_class(days_since_last_read: int,
                            access_count_30_days: int) -> str:
    """

    :param days_since_last_read:
    :param access_count_30_days:
    :return:
    """
    if days_since_last_read < 30:
        if access_count_30_days > 2:
            recommended_class = "STANDARD"
        else:
            recommended_class = "NEARLINE"
    elif 30 < days_since_last_read <= 90:
        recommended_class = "NEARLINE"
    else:
        recommended_class = "COLDLINE"
    return recommended_class


def get_storage_class(gcs_client: storage.Client,
                      query_result: bigquery.job.QueryJob) -> List[Dict[str, str]]:
    """

    :param gcs_client:
    :param query_result:
    :return:
    """
    object_info_list = []
    for row in query_result:
        bucket_name, object_name = parse_bucket_object(row.object_path)
        bucket = storage.bucket.Bucket(client=gcs_client, name=bucket_name)
        object_info = bucket.get_blob(blob_name=object_name)
        object_info_list.append({
            'path': row.resourceName,
            'current_class': object_info.storage_class,
            'recommended_class': recommend_storage_class(row.days_since_last_read,
                                                         row.read_count_30_days),
            'days_since_last_read': row.days_since_last_read,
            'read_count_previous_30_days': row.read_count_30_days,
            'read_count_previous_90_days': row.read_count_90_days,
            'last_read_timestamp': row.last_read_timestamp,
            'size': object_info.size,
            'creation_time': object_info.time_created
        })
    return object_info


def file_to_string(sql_path: str) -> str:
    """Converts a SQL file holding a SQL query to a string.

    Args:
        sql_path: String in the form of a file path

    Returns:
        String representation of a file
    """
    with open(sql_path, 'r') as sql_file:
        return sql_file.read()


def execute_query(bq_client: bigquery.Client,
                  query_path: object) -> None:
    """Executes transformation query.

    Args:
        bq_client: bigquery.Client object
        query_path: Object representing location of SQL query to execute
    """
    try:
        job_config = bigquery.QueryJobConfig()
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


def create_table(bq_client: bigquery.Client,
                 output_project_id: str,
                 output_dataset_id: str,
                 output_table_name: str,
                 data: List[Dict[str, str]]) -> None:
    """

    :param bq_client:
    :param output_project_id:
    :param output_dataset_id:
    :param output_table_name:
    :param data:
    :return:
    """
    try:
        json = json.stringify(data)
        job_config = bigquery.LoadJobConfig()
        job_config.source_format = bigquery.SourceFormat.NEWLINE_DELIMITED_JSON
        job_config.write_disposition = bigquery.WriteDisposition().WRITE_TRUNCATE
        dataset_ref = bq_client.get_dataset(bigquery.DatasetReference(
                                            project=output_project_id,
                                            dataset_id=output_dataset_id))
        destination_table = dataset_ref.table(output_table_name)

        job = bq_client.load_table_from_json(io.StringIO(json),
                                             destination=destination_table,
                                             job_config=job_config)

        job.result() # Wait to finish
        logging.info("Recommendations table created successfully.")

    except Exception as e:
        logging.error("Creating table with recommendations failed.")
        logging.error(e)



def main():
    try:
        gcs_client = get_storage_client()
        bq_client = get_bq_client()
        query_result = execute_query(bq_client, 'usage_query.sql')
        object_info_list = get_storage_class(gcs_client, query_result)
        create_table(bq_client,
                     config_vars['output_project_id'],
                     config_vars['output_dataset_id'],
                     config_vars['output_table_name'],
                     object_info_list)

    except Exception as e:
        logging.error("Failed to create resources.")
        logging.error(e)


if __name__ == "__main__":
    main()