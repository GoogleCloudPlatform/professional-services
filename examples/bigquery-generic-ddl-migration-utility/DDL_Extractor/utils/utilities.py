# Copyright 2023 Google LLC
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
"""Utility for the function used in generic ddl extractor utility modules"""
from utils.setup_logger import logger
from google.cloud import bigquery, storage
import ast
import json
import oracledb

def write_to_blob_from_file(gcs_client, bucket_name, destination_file_name, source_file_name):
    """Function to write data in gcs bucket"""
    bucket = gcs_client.bucket(bucket_name)
    if bucket.exists():
        blob = bucket.blob(destination_file_name)
        blob.upload_from_filename(source_file_name, "text/csv")
    else:
        logger.info("Bucket doesn't exist")


def create_log_table(project_id, target_dataset, client):
    """Function to create log table for storing the job fopailure"""
    table_id = project_id + "." + target_dataset + ".report_status_log_tbl"
    schema = [
        bigquery.SchemaField("Timestamp", "STRING"),
        bigquery.SchemaField("FilePath", "STRING"),
        bigquery.SchemaField("Schemaname", "STRING"),
        bigquery.SchemaField("TableName", "STRING"),
        bigquery.SchemaField("Category", "STRING"),
        bigquery.SchemaField("Message", "STRING"),
        bigquery.SchemaField("Status", "STRING"),
        bigquery.SchemaField("Action", "STRING"),
    ]
    table_address = bigquery.Table(table_id, schema=schema)
    table_ref = client.create_table(table_address, exists_ok=True)
    return table_ref


def log_table_data(table, client, records):
    """Function to log the table data"""
    try:
        client.insert_rows(table, records)
        print(f"Table : {table} logged Successfully in Log Table")
    except ValueError as ex:
        print(f"Found the error when loading the data in table : {ex}")


def write_to_blob(gcs_client, bucket_name, file_name, content):
    """Function to write the data to gcs bucket"""
    bucket = gcs_client.bucket(bucket_name)
    blob = bucket.blob(file_name)
    blob.upload_from_string(content)


def readgcs_file(gcs_client, bucket_name, prefix):
    """Function to read the gcs file"""
    bucket = gcs_client.get_bucket(bucket_name)
    blob = bucket.get_blob(prefix)
    contents = blob.download_as_string()
    return contents.decode("utf-8")


def parse_json(raw_string):
    """Function to parse the json"""
    config_parsed_data = ast.literal_eval(raw_string)
    config_intermediate_data = json.dumps(config_parsed_data)
    parsed_json_data = json.loads(config_intermediate_data)
    return parsed_json_data


#def output_type_handler(cursor, default_type):
#    """Function to Convert CLOB to String"""
#    if default_type == oracledb.DB_TYPE_CLOB:
#        return cursor.var(oracledb.DB_TYPE_LONG, arraysize=cursor.arraysize)
#    if default_type == oracledb.DB_TYPE_BLOB:
#        return cursor.var(oracledb.DB_TYPE_LONG_RAW, arraysize=cursor.arraysize)
#def output_type_handler(cursor, name, default_type, size, precision, scale):
#    if default_type == cx_Oracle.DB_TYPE_CLOB:
#        return cursor.var(cx_Oracle.DB_TYPE_LONG, arraysize=cursor.arraysize)
#    if default_type == cx_Oracle.DB_TYPE_BLOB:
#        return cursor.var(cx_Oracle.DB_TYPE_LONG_RAW, arraysize=cursor.arraysize)


def read_config(gcs_client, config_source_bucket_name, config_source_prefix):
    # Read Config File values:
    config_string = readgcs_file(
        gcs_client, config_source_bucket_name, config_source_prefix
    )
    migration_config_dict = parse_json(config_string)
    return migration_config_dict

