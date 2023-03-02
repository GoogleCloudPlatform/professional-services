# Copyright 2022 Google LLC

#    Licensed under the Apache License, Version 2.0 (the "License");
#    you may not use this file except in compliance with the License.
#    You may obtain a copy of the License at

#        http://www.apache.org/licenses/LICENSE-2.0

#    Unless required by applicable law or agreed to in writing, software
#    distributed under the License is distributed on an "AS IS" BASIS,
#    WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
#    See the License for the specific language governing permissions and
#    limitations under the License.
"""Module for DDL Extraction from snowflake db"""


import argparse
import json
import datetime
import ast
import snowflake.connector
from snowflake.connector.errors import DatabaseError
from google.cloud import bigquery, storage, secretmanager


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


def main(gcs_config_path, project_id):
    """Main function to call the ddl extraction modules"""

    config_source_bucket_name = gcs_config_path.split("//")[1].split("/")[0]

    config_source_prefix = gcs_config_path.split(config_source_bucket_name + "/")[1]

    print(config_source_bucket_name)

    print(config_source_prefix)

    print(project_id)

    # Read Config File values:
    gcs_client = storage.Client(project_id)

    config_string = readgcs_file(
        gcs_client, config_source_bucket_name, config_source_prefix
    )

    migration_config_dict = parse_json(config_string)

    # Read variable values define in config file
    gcs_source_path = migration_config_dict["gcs_source_path"]
    dataset_location = migration_config_dict["dataset_location"]
    source_bucket_name = migration_config_dict["source_bucket_name"]
    source_dataset = gcs_source_path.split("//")[1].split("/")[1]
    target_dataset = migration_config_dict["target_dataset"]
    secret_resource_id = migration_config_dict["secret_resource_id"]

    client = bigquery.Client(project=project_id, location=dataset_location)

    table_ref = create_log_table(project_id, target_dataset, client)
    try:
        client_secret = secretmanager.SecretManagerServiceClient()
        response = client_secret.access_secret_version(name=secret_resource_id)
        secret_val = response.payload.data.decode("UTF-8")
        credentials = json.loads(secret_val)
        ctx = snowflake.connector.connect(
            user=credentials['user'],
            password=credentials['password'],
            account=credentials['account'],
            warehouse=credentials['warehouse'],
            database=credentials['database'],
            schema=credentials['schema']
                                        )
        cursor = ctx.cursor()
    except DatabaseError as ex:
        print(f"Connection to snowflake failed: {str(ex)}")
        failure_record = [
            (
                datetime.datetime.now().strftime("%s"),
                None,
                None,
                None,
                "DatabaseError",
                str(ex),
                "Failed",
                "Check the connection credentials",
            )
        ]
        log_table_data(table_ref, client, failure_record)
        raise Exception(str(ex)) from ex
    else:
        for row in migration_config_dict["table_config"]:
            try:
                query = """ SELECT GET_DDL('TABLE',upper('{1}'),true) """.format(row['table_name'].split('.')[0].strip(),row['table_name'].split('.')[1].strip())
                cursor.execute(query)
                output = cursor.fetchall()
                output_str = str(output[0][0])
                write_to_blob(
                    gcs_client,
                    bucket_name=source_bucket_name,
                    file_name=f"{source_dataset}/{row['table_name'].split('.')[0].strip()}-\
                        {row['table_name'].split('.')[1].strip()}.sql",
                    content=output_str,
                )
            except Exception as ex:
                failure_record = [
                    (
                        datetime.datetime.now().strftime("%s"),
                        None,
                        row["table_name"].split(".")[0].strip(),
                        row["table_name"].split(".")[1].strip(),
                        "Excecution Error",
                        str(ex),
                        "Failed",
                        "Check the query",
                    )
                ]
                log_table_data(table_ref, client, failure_record)
            else:
                print(
                    f"DDL Generated Successfully for table \
                        {row['table_name'].split('.')[1].strip()}"
                )
                file_path = f"gs://{source_bucket_name}/{source_dataset}/\
                    {row['table_name'].split('.')[0].strip()}-{row['table_name'].split('.')[1].strip()}.sql"
                success_record = [
                    (
                        datetime.datetime.now().strftime("%s"),
                        file_path,
                        row["table_name"].split(".")[0].strip(),
                        row["table_name"].split(".")[1].strip(),
                        "DDL Extraction",
                        "DDL Generated Successfully",
                        "Success",
                        None,
                    )
                ]
                log_table_data(table_ref, client, success_record)
        
            
        cursor.close()
        ctx.close()


if __name__ == "__main__":

    parser = argparse.ArgumentParser(
        description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter
    )

    parser.add_argument("gcs_config_path", help="GCS Config Path for defined variables")

    parser.add_argument("project_id", help="Project_id required to run the code")

    args = parser.parse_args()

    main(args.gcs_config_path, args.project_id)

# Command to run the script
# python3 snowflake_ddl_extraction.py <json_config_file_path> <project_name> 
# eg) python3 snowflake_ddl_extraction.py gs://snowflake-ddl-extraction/sf-ddl-extraction-config.json poc-env-aks
