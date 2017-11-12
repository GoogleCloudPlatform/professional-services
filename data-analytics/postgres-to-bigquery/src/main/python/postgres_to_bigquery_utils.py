from google.cloud import bigquery
from google.cloud import storage

import subprocess
import json
import uuid
import enum
import sys
import logging
import psycopg2


class BQTableFormat(enum.Enum):
    JSON = "NEWLINE_DELIMITED_JSON"
    CSV = "CSV"
    AVRO = "AVRO"
    DATASTORE_BACKUP = "DATASTORE_BACKUP"


def download_JSON_schema_as_string(schema_uri, project=None):
        """Download the JSON schema file exported to a string.
        If arguments are empty or not in the format of gs://bucket-name/file-name, exception will be thrown.
        :param schema_uri: The URI of the schema file in GCS in the format of gs://bucket-name/folder/file-name
        :param project: GCP project name or None if you use default authentication
        :return: A string that contains schema from the schema file with "fields" header to fit BigQuery format
        example:
            {"fields": [
                    {
                        "name": "name",
                        "type": "string"
                    }.
                    {
                        "name": "full_address",
                        "type": "string"
                    },
                    {
                        "name": "schools",
                        "type": "string",
                        "mode": "repeated"
                    }
                ]
            }
        """
        # Validate input schema URI
        if schema_uri == None or len(schema_uri) < 1:
            raise ValueError("Schema file URI cannot be empty!")
        if schema_uri.startswith("gs://") == False:
            raise ValueError("Schema file URI format is gs://bucket-name/file-name.")

        storage_client = storage.Client(project)

        schema_uri = schema_uri.split('/')
        bucket_name = schema_uri[2]
        blob_name = '/'.join(schema_uri[3:])
        logging.info("Schema URI: {}, Bucketname: {}, Blobname: {}".format(schema_uri, bucket_name, blob_name))

        bucket = storage_client.get_bucket(bucket_name)
        blob = storage.blob.Blob(blob_name, bucket)

        # Validate existence on GCS
        if bucket.exists() == False:
            raise IOError("Schema file bucket does not exist!")
        if blob.exists() == False:
            raise IOError("Schema file object does not exist!")

        # Add fields to make it compatible with BigQuery schema format
        bq_schema_header = '{ \n "fields": %s \n}'
        schema_string = blob.download_as_string().decode("utf-8")
        schema_string = bq_schema_header % schema_string

        return schema_string


def download_table_list(table_list_gcs_uri, local_table_list_file, project=None):
    # Validate input URI
    if table_list_gcs_uri == None or len(table_list_gcs_uri) < 1:
        raise ValueError("Table file URI cannot be empty!")
    if table_list_gcs_uri.startswith("gs://") == False:
        raise ValueError("Table file URI format is gs://bucket-name/file-name.")

    storage_client = storage.Client(project)

    table_list_gcs_uri = table_list_gcs_uri.split('/')
    bucket_name = table_list_gcs_uri[2]
    blob_name = '/'.join(table_list_gcs_uri[3:])
    logging.info("Table list file URI: {}, Bucketname: {}, Blobname: {}".format(table_list_gcs_uri, bucket_name, blob_name))
    bucket = storage_client.get_bucket(bucket_name)
    blob = storage.blob.Blob(blob_name, bucket)

    # Validate existence on GCS
    if bucket.exists() == False:
        raise IOError("Table file bucket does not exist!")
    if blob.exists() == False:
        raise IOError("Schema file object does not exist!")

    blob.download_to_filename(local_table_list_file)


def load_to_bigquery(project_name, dataset_name, table_name, schema_url, data_url):
        """
        Interface method to load data from GCS to BigQuery
        :param project_name: ProjectID of the project
        :param dataset_name: name of the dataset which will hold tables
        :param table_name: name of the table to be created. It has format of <TABLE_NAME>_YYYY_MM_DD_HH_MM.
        :param schema_url: GCS URL of the table's schema file starts with gs://
        :param data_url: GCS URL of the table's data starts with gs://
        :return: None
        """
        bigquery_client = bigquery.Client(project=project_name)
        data_uris = list()
        data_uris.append(data_url)

        schema_string = download_JSON_schema_as_string(schema_url, project=project_name)
        load_job = create_load_table_job(
            dataset_name, table_name, data_uris, BQTableFormat.JSON.value, schema_string, bigquery_client, False)
        load_job.result()

        logging.info("Table " + table_name + " import has finished!")


def parse_table_schema_from_json(schema_string):
        """Parse the Table Schema provided as string.
        Args:
          schema_string: String serialized table schema, should be a valid JSON.
        Returns:
          A TableSchema of the BigQuery export from either the Query or the Table.
        """
        json_schema = json.loads(schema_string)
        schema = list()

        def _parse_schema_field(field):
            """Parse a single schema field from dictionary.
            Args:
              field: Dictionary object containing serialized schema.
            Returns:
              A TableFieldSchema for a single column in BigQuery.
            """
            if 'mode' in field:
                schema_mode = field['mode']
            else:
                schema_mode = 'NULLABLE'
            if 'description' in field:
                schema_description = field['description']
            else:
                schema_description = None
            if 'fields' in field:
                schema_fields = [_parse_schema_field(x) for x in field['fields']]
            else:
                schema_fields = ()
                schema_field = bigquery.SchemaField(
                    field['name'], field['type'], schema_mode, schema_description, schema_fields
                )

            return schema_field

        for f in json_schema['fields']:
            schema.append(_parse_schema_field(f))
        return schema


def create_load_table_job(dest_dataset_name, table_name, data_uris, load_table_format, schema_string,
                          big_query_client=None, is_append_table=True):
    """Create a BigQuery load table job but not start it yet.
    :param dest_dataset_name: Destination BigQuery dataset name
    :param table_name: Destination BigQuery table name
    :param data_uris: a list of string of source data file URI on GCS
    :param load_table_format: A string value from the LoadTableFormat item
    :param schema_string: BigQuery schema in string
    :param big_query_client: BigQuery client object. None if already using default authentication
    :param is_append_table: Boolean value represent if data should be append to if the destination table exists.
    :return: A BigQuery Load job object
    """
    schema = parse_table_schema_from_json(schema_string)
    job_name = 'Load_Table_' + table_name + str(uuid.uuid4())
    dest_bq_dataset = bigquery.dataset.Dataset(dest_dataset_name, big_query_client)
    dest_bq_table = bigquery.table.Table(table_name, dest_bq_dataset, schema)

    if dest_bq_dataset.exists() is False:
        dest_bq_dataset.create()

    if is_append_table is False and dest_bq_table.exists() is True:
        dest_bq_table.delete()

    load_job = bigquery.job.LoadTableFromStorageJob(job_name, dest_bq_table, data_uris, big_query_client, schema)
    load_job.source_format = load_table_format

    return load_job


def update_view_table(project_name, src_dataset_name, dest_dataset_name, view_name, table_name_new):
        """
        Update the BigQuery View to read data from the new table which has new data. Good practice is
        to put all Views into a different dataset to help manage views and tables separately.
        :param project_name: GCP ProjectID which holds the data
        :param src_dataset_name: The name of the BQ dataset that contains the new tables
        :param dest_dataset_name: The name of the BQ dataset that contains all the Views.
        :param view_name: The name of the View. It should be the original table's name which will not
        change. BQ Clients will read from this view instead of the actual table that holds the data.
        :param table_name_new: The name of the table which has newly ingest data. Format is
        <TABLE_NAME>_YYYY_MM_DD_HH_MM.
        :return: None
        """
        bigquery_client = bigquery.Client(project=project_name)
        dataset = bigquery.dataset.Dataset(name=dest_dataset_name, client=bigquery_client, project=project_name)
        table = dataset.table(view_name)
        new_view_query = "SELECT * FROM " + src_dataset_name + "." + table_name_new
        table.view_query = new_view_query
        logging.info("Updating View: " + view_name)

        if table.exists() is False:
            table.create()
        else:
            table.update()


def download_schema_and_data(connection, schema_name, table_name, gcs_schema_uri, gcs_data_uri,
                                 local_schema_dir, local_data_dir):
        """
        This method dumps the table's schema and data into separate JSON files. They will then be uploaded
         to GCS bucket. The local JSON files will be removed after they are uploaded to GCS.
         The SCHEMA file will be named like <TABLE_NAME>_schema.json. The DATA file will be named like
         <TABLE_NAME>_data.json.

         This method calls 'sed' command to remove extra characters from the files to ensure compliance
         with BigQuery requirement.

         Postgres data type will also be matched to BigQuery data types. The exception is that it does not
         handle nested data type.

        :param table_name: Source table's name
        :return: None
        """
        get_json_schema_sql = "COPY (SELECT row_to_json(table_json) || ',' " \
                              "FROM " \
                              "(select column_name as name, " \
                              "CASE " \
                              "WHEN is_nullable::boolean='t' THEN 'NULLABLE' " \
                              "WHEN is_nullable::boolean='f' THEN 'REQUIRED' " \
                              "END as mode ," \
                              "CASE " \
                              "WHEN (data_type = 'text' OR data_type='varchar' " \
                              "OR data_type ='character varying' OR data_type = 'unknown' " \
                              "OR data_type='char' OR data_type='character') THEN 'STRING' " \
                              "WHEN (data_type = 'integer' OR data_type='smallint' " \
                              "OR data_type='bigint') THEN 'INTEGER' " \
                              "WHEN (data_type = 'boolean') THEN 'BOOLEAN' " \
                              "WHEN (data_type = 'real' OR data_type = 'double precision' " \
                              "OR data_type='numeric' OR data_type='decimal') THEN 'FLOAT' " \
                              "WHEN (data_type='date') THEN 'DATE' " \
                              "WHEN (data_type='time' OR data_type='time without time zone' " \
                              "OR data_type='time with time zone') THEN 'TIME' " \
                              "WHEN (data_type='timestamp' OR data_type='timestamp without time zone' " \
                              "OR data_type='timestamp with time zone') THEN 'TIMESTAMP' " \
                              "END AS type " \
                              "FROM information_schema.columns " \
                              "WHERE table_schema = '{0}' and table_name ='{1}' " \
                              "ORDER BY ordinal_position) table_json) TO STDOUT".format(schema_name, table_name)
        get_json_data_sql_raw = "COPY (SELECT row_to_json(data_result) FROM (SELECT {} FROM {}.{}) data_result) TO STDOUT"
        get_all_columns_sql = "SELECT column_name,data_type FROM information_schema.columns " \
                              "WHERE table_schema = '{0}' AND table_name='{1}' ORDER BY ordinal_position" \
            .format(schema_name, table_name)

        connection = connection.get_conn()
        cur = connection.cursor()
        cur.execute(get_all_columns_sql)
        columns_list = cur.fetchall()
        columns_list_string = ""
        for column in columns_list:
            if column[1] != 'timestamp with time zone':
                columns_list_string += ('"' + column[0] + '",')
            else:
                columns_list_string += ("EXTRACT(EPOCH FROM " + column[0] + ") AS " + column[0] + ",")

        # Remove last comma
        columns_list_string = columns_list_string[:-1]
        get_json_data_sql = get_json_data_sql_raw.format(columns_list_string, schema_name, table_name)

        schema_file_name = local_schema_dir + table_name + "_schema.json"
        data_file_name = local_data_dir + table_name + "_data.json"

        # Write Schema file
        f = open(schema_file_name, 'wb')
        f.write(bytes("[\n", "UTF-8"))
        cur.copy_expert(get_json_schema_sql, f)
        f.seek(-2, 2)  # remove last comma
        f.write(bytes("]\n", "UTF-8"))
        f.close()
        logging.info("Write JSON schema to file " + schema_file_name)
        # Remove extra \ character
        ret = subprocess.call(['sed', '-i', '-e', r"s/\\\\/\\/g", schema_file_name])
        if (ret == 0):
            logging.info("Writing schema file " + schema_file_name + " successfully!")
        else:
            logging.error("Having trouble removing extra characters in file: " + schema_file_name)

        # Write data file
        df = open(data_file_name, "wb")
        cur.copy_expert(get_json_data_sql, df)
        df.close()

        connection.close()

        ret = subprocess.call(['sed', '-i', '-e', r"s/\\\\/\\/g", data_file_name])
        if (ret == 0):
            logging.info("Writing data file " + data_file_name + " successfully!")
        else:
            logging.error("Having trouble removing extra characters in file: " + data_file_name)

        # Upload to GCS and remove from local
        subprocess.call(['gsutil', '-m', 'cp', schema_file_name, gcs_schema_uri])
        logging.info("Write to GCS bucket: " + schema_file_name + " successfully!")
        subprocess.call(
            ['gsutil', '-o GSUtil:parallel_composite_upload_threshold=150M', '-m', 'cp', data_file_name, gcs_data_uri])
        logging.info("Write to GCS bucket: " + data_file_name + " successfully!")

        subprocess.call(['rm', '-f', data_file_name])
        logging.info("Remove DATA file: " + data_file_name)
        subprocess.call(['rm', '-f', schema_file_name])
        logging.info("Remove SCHEMA file: " + schema_file_name)


def clean_gcs_bucket(gcs_schema_uri, gcs_data_uri):
        """
        Remove schema and data files from the GCS bucket. This method is called after data has been ingested.
        :return: None
        """
        ret = subprocess.call(['gsutil', '-m', 'rm', '-f', gcs_schema_uri + "*.*"])
        if ret == 0:
            logging.info("Delete SCHEMA files from GCS: " + gcs_schema_uri + " successfully!")
        else:
            logging.error("Having trouble delete schema files from GCS: " + gcs_schema_uri)

        ret = subprocess.call(['gsutil', '-m', 'rm', '-f', gcs_data_uri + "*.*"])
        if ret == 0:
            logging.info("Delete DATA files from GCS bucket: " + gcs_data_uri + " successfully!")
        else:
            logging.error("Having trouble delete data files from GCS: " + gcs_data_uri)


def delete_lastrun_dataset(dataset_name, project_name=None):
    bigquery_client = bigquery.Client(project=project_name)
    dataset = bigquery.dataset.Dataset(name=dataset_name, client=bigquery_client, project=project_name)
    if dataset.exists() is True:
        for table in dataset.list_tables():
            table.delete()
        dataset.delete(bigquery_client)
