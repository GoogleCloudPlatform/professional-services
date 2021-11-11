# Copyright 2020 Google LLC
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

import json
from typing import Dict
from typing import List
from google.cloud import bigquery
from google.cloud import storage


def table_to_csv_in_gcs(bucket_name: str, object_name: str,
                        table_id: str) -> None:
    """Save the table in GCS.

    Args:
        bucket_name: String of bucket name for string the object
        object_name: String of name of object to be uploaded
        table_id: String holding id of table
    """
    destination_uri = "gs://{}/{}".format(bucket_name, object_name)
    client = bigquery.Client()
    table_ref = bigquery.TableReference.from_string(table_id)
    extract_job = client.extract_table(table_ref, destination_uri)
    extract_job.result()


def csv_in_gcs_to_table(bucket_name: str, object_name: str, dataset_id: str,
                        table_id: str,
                        schema: List[bigquery.SchemaField]) -> None:
    """Upload CSV to BigQuery table.
        If the table already exists, it overwrites the table data.

    Args:
        bucket_name: Bucket name for holding the object
        object_name: Name of object to be uploaded
        dataset_id: Dataset id where the table is located.
        table_id: String holding id of hte table.
        schema: Schema of the table_id
    """
    client = bigquery.Client()
    dataset_ref = client.dataset(dataset_id)
    job_config = bigquery.LoadJobConfig()
    job_config.schema = schema
    job_config.source_format = bigquery.SourceFormat.CSV
    job_config.write_disposition = bigquery.WriteDisposition().WRITE_TRUNCATE
    uri = "gs://{}/{}".format(bucket_name, object_name)
    load_job = client.load_table_from_uri(uri,
                                          dataset_ref.table(table_id),
                                          job_config=job_config)
    load_job.result()


def delete_table(bq_client: bigquery.Client, dataset_id: str,
                 table_name: str) -> None:
    """Deletes a specified table in BigQuery.

    Args:
        bq_client: bigquery.Client object.
        dataset_id: String holding ID of dataset
        table_name: String of table name to delete

    Returns:
        None; Deletes a table in BigQuery
    """
    dataset_ref = bq_client.dataset(dataset_id)
    table_ref = dataset_ref.table(table_name)
    bq_client.delete_table(table=table_ref)


def gcs_to_local(bucket_name: str, object_name: str, output_file: str) -> None:
    """Download the GCS object as output file

    Args:
        bucket_name: String of bucket name
        object_name: Name of object to be uploaded
        output_file: Local file name to save the object from the bucket
    """
    client = storage.Client()
    bucket = client.get_bucket(bucket_name)
    blob = bucket.get_blob(object_name)
    with open(output_file, "wb") as file_obj:
        blob.download_to_file(file_obj)


def local_to_gcs(bucket_name: str, object_name: str, input_file: str) -> None:
    """Uploads a local file to the GCS object as output file.

    Args:
        bucket_name: String of bucket name for holding the object.
        object_name: String of name of object to be uploaded.
        input_file: Local file name to upload.

    Returns:
        None.
    """
    client = storage.Client()
    bucket = client.get_bucket(bucket_name)
    blob = bucket.blob(object_name)
    with open(input_file, "rb") as file_obj:
        blob.upload_from_file(file_obj)


def convert_to_schema(schema: List[Dict[str, str]]) -> List[bigquery.SchemaField]:
    """Read the schema as a JSON and reformats as an array.

    Args:
        schema: list of dicts to convert to list of SchemaField

    Returns:
        List of bigquery.SchemaField objects holding the schema.
    """
    input_fields = schema
    schema = []
    for input_field in input_fields:
        schema.append(
            bigquery.SchemaField(input_field['name'],
                                 input_field['type'],
                                 mode=input_field['mode']))
    return schema
