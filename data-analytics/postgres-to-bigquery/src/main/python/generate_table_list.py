#!/usr/bin/python3

import io
import logging
import csv
from google.cloud import storage


def write_table_list(connection, schema_name, gcs_schema_uri, gcs_data_uri, gcs_table_list_uri, project_id=None):
    table_csv_file_header = ['TABLE_NAME', 'SCHEMA_URI', 'DATA_URI']
    list_tables_sql = "SELECT table_name FROM information_schema.tables WHERE table_schema='{0}'".format(schema_name)

    connection = connection.get_conn()
    cur = connection.cursor()
    cur.execute(list_tables_sql)
    table_list = cur.fetchall()
    connection.close()

    table_list_string = io.StringIO()
    csvwriter = csv.writer(table_list_string, delimiter=',')
    csvwriter.writerow(table_csv_file_header)
    for table in table_list:
        table_name = table[0]
        csvwriter.writerow(
            [table_name, gcs_schema_uri + table_name + "_schema.json", gcs_data_uri + table_name + "_data.json"]
        )

    # Validate input URI
    if gcs_table_list_uri == None or len(gcs_table_list_uri) < 1:
        raise ValueError("Table file URI cannot be empty!")
    if gcs_table_list_uri.startswith("gs://") == False:
        raise ValueError("Table file URI format is gs://bucket-name/file-name.")

    storage_client = storage.Client(project_id)

    table_list_gcs_uri = gcs_table_list_uri.split('/')
    bucket_name = table_list_gcs_uri[2]
    blob_name = '/'.join(table_list_gcs_uri[3:])
    logging.info("Table list file URI: {}, Bucketname: {}, Blobname: {}".format(table_list_gcs_uri, bucket_name, blob_name))
    bucket = storage_client.get_bucket(bucket_name)
    blob = storage.blob.Blob(blob_name, bucket)

    blob.upload_from_string(table_list_string.getvalue())

