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
"""Module to create bq table from the extracted ddl"""


import sys
import argparse
import json
import ast
import datetime
from google.cloud import bigquery
from google.api_core.exceptions import NotFound
from google.cloud import storage


def create_log_table(project_id, target_dataset, client):
    """
    Function to create log table
    """
    table_id = f"{project_id}.{target_dataset}.report_status_log_tbl"
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
    """
    function for logging the overall report
    """
    # Create the table_id in the required format
    try:
        client.insert_rows(table, records)
        print("Table logged Successfully in Log Table")
    except Exception as ex:
        print(f"Found the error when loading the data in table : {str(ex)}")


def log_err_table(
    project_id, target_dataset, log_table_id, target_bucket_name, client, table_name
):
    """
    Function for logging the batch translation report
    """
    table_id = f"{project_id}.{target_dataset}.{table_name}"
    job_config = bigquery.LoadJobConfig(
        schema=[
            bigquery.SchemaField("Timestamp", "STRING"),
            bigquery.SchemaField("FilePath", "STRING"),
            bigquery.SchemaField("FileName", "STRING"),
            bigquery.SchemaField("ScriptLine", "INTEGER"),
            bigquery.SchemaField("ScriptColumn", "INTEGER"),
            bigquery.SchemaField("TranspilerComponent", "STRING"),
            bigquery.SchemaField("Environment", "STRING"),
            bigquery.SchemaField("ObjectName", "STRING"),
            bigquery.SchemaField("Severity", "STRING"),
            bigquery.SchemaField("Category", "STRING"),
            bigquery.SchemaField("Message", "STRING"),
            bigquery.SchemaField("ScriptContext", "STRING"),
            bigquery.SchemaField("Action", "STRING"),
        ],
        skip_leading_rows=1,
        # The source format defaults to CSV, so the line below is optional.
        source_format=bigquery.SourceFormat.CSV,
        write_disposition=bigquery.WriteDisposition.WRITE_TRUNCATE,
        field_delimiter=",",
        ignore_unknown_values=True,
        allow_quoted_newlines=True,
    )
    uri = f"gs://{target_bucket_name}/{log_table_id}"
    try:
        load_job = client.load_table_from_uri(uri, table_id, job_config=job_config)
        # Make an API request.
        load_job.result()  # Waits for the job to complete.
        destination_table = client.get_table(table_id)  # Make an API request.
        print(f"Loaded {destination_table.num_rows} rows.")
    except Exception as ex:
        print(f"Found the error while creating the table : {str(ex)}")


def file_exist(gcs_client, target_bucket_name, log_table_id) -> bool:
    """
    Function to check file exist in gcs bucket
    """
    bucket = gcs_client.bucket(target_bucket_name)
    return storage.Blob(bucket=bucket, name=log_table_id).exists(gcs_client)


def get_cluster_partitioncolumns(
    gcs_client,
    config_source_bucket_name,
    config_source_prefix,
    table_name,
    audit_col_str,
):
    """
    Function to create partion and cluster by column string
    """
    config_string = readgcs_file(
        gcs_client, config_source_bucket_name, config_source_prefix
    )
    migration_config_dict = parse_json(config_string)
    cluster_partition_query = ""
    for input_val in migration_config_dict["table_config"]:
        if input_val["table_name"] == table_name:
            cluster_partition_query = f"{audit_col_str}) \
                PARTITION BY DATE({input_val['partitioning_field']}) \
                CLUSTER BY {input_val['clustering_fields']};"
            return cluster_partition_query
        else:
            pass


def readgcs_file(gcs_client, bucket_name, prefix):
    """
    Function to read gcs file
    """
    bucket = gcs_client.get_bucket(bucket_name)
    blob = bucket.get_blob(prefix)
    contents = blob.download_as_string()
    return contents.decode("utf-8")


# Parse gcs json file to dictionary
def parse_json(raw_string):
    """
    Function to parse json string
    """
    config_parsed_data = ast.literal_eval(raw_string)
    config_intermediate_data = json.dumps(config_parsed_data)
    parsed_json_data = json.loads(config_intermediate_data)
    return parsed_json_data


# Write to Blob
def write_to_blob(gcs_client, bucket_name, file_name, content):
    """
    Function to write to gcs bucket
    """
    bucket = gcs_client.bucket(bucket_name)
    blob = bucket.blob(file_name)
    blob.upload_from_string(content)


# function to update the schema
def schema_update_tbl(gcs_client, target_bucket_name, audit_config_file):
    """
    Create DDL for schema update
    """
    try:
        json_data_string = readgcs_file(
            gcs_client, target_bucket_name, prefix=audit_config_file
        )
        audit_columns = parse_json(json_data_string)
        audit_schema_str = ","
        for json_d in audit_columns:
            audit_schema_str = (
                audit_schema_str + json_d["name"] + " " + json_d["type"] + ","
            )
        return audit_schema_str
    except Exception as ex:
        print(f"Error while creating schema ddl : {str(ex)}")
        sys.exit(1)


def create_ddl(
    source_bucket_name,
    target_bucket_name,
    source_prefix,
    target_prefix,
    target_dataset,
    project_id,
    dataset_location,
    log_table_id,
    audit_config_file,
    target_table_prefix,
    config_source_bucket_name,
    config_source_prefix,
    table_create_flag,
):
    """
    Check table exist or not and create the table if don't exist
    with the DDL converted with migration workflow.
    """
    client = bigquery.Client(project=project_id, location=dataset_location)
    gcs_client = storage.Client(project_id)

    bucket = gcs_client.lookup_bucket(source_bucket_name)
    table_ref = create_log_table(project_id, target_dataset, client)

    error_tbl_name = []

    # Call the function for logging the report
    if file_exist(gcs_client, target_bucket_name, log_table_id):
        log_err_table(
            project_id,
            target_dataset,
            log_table_id,
            target_bucket_name,
            client,
            table_name="report_err_log_tbl",
        )
        query = (
            "SELECT FileName,FilePath,Timestamp,Action,Category,Message,Severity,Category FROM "
            + project_id
            + "."
            + target_dataset
            + ".report_err_log_tbl;"
        )
        job = client.query(query)
        for row in job.result():
            if row[6] == "ERROR" and row[7] == "SyntaxError":
                error_tbl_name.append(row[0])
                failure_record = [
                    (
                        row[2],
                        row[1],
                        target_dataset,
                        row[0][:-4],
                        row[4],
                        row[5],
                        "Failed",
                        row[3],
                    )
                ]
                log_table_data(table_ref, client, failure_record)
            else:
                pass
    else:
        print(
            "Log table is not created since batch_translation_report file doesn't exists"
        )

    for input_tbl_name in bucket.list_blobs(prefix=source_prefix + "/"):
        if input_tbl_name.name.endswith(".sql"):
            if input_tbl_name.name.split("/")[1] not in error_tbl_name:
                input_table = input_tbl_name.name.split("/")[1][:-4]
                tbl_name = f"{input_table.split('-')[0]}.{input_table.split('-')[1]}"
                if target_table_prefix != "":
                    target_table = f"{input_table.split('-')[1]}_{target_table_prefix}"
                else:
                    target_table = f"{input_table.split('-')[1]}{target_table_prefix}"
                target_id = project_id + "." + target_dataset + "." + target_table
                target_path = (
                    f"gs://'{target_bucket_name}/{target_dataset}/{input_tbl_name.name}"
                )

                try:
                    client.get_table(target_id)
                    print(f"Table {target_id} already exist so skipping")
                    failure_record = [
                        (
                            datetime.datetime.now().strftime("%s"),
                            target_path,
                            target_dataset,
                            input_table,
                            "BQ_Generic_Migration",
                            "Table Already Exist",
                            "Failed",
                            None,
                        )
                    ]
                    log_table_data(table_ref, client, failure_record)
                except NotFound:
                    query = (
                        readgcs_file(
                            gcs_client,
                            target_bucket_name,
                            target_prefix + "/" + input_table + ".sql",
                        )
                        .replace(input_table.split("-")[1], target_table)
                        .replace(")\n;", "")
                        .replace("CREATE TABLE ", "CREATE TABLE IF NOT EXISTS ")
                    )
                    audit_column_str = schema_update_tbl(
                        gcs_client, target_bucket_name, audit_config_file
                    )
                    cluster_partition_query = get_cluster_partitioncolumns(
                        gcs_client,
                        config_source_bucket_name,
                        config_source_prefix,
                        tbl_name,
                        audit_column_str,
                    )
                    final_query = "".join([query, cluster_partition_query])
                    if table_create_flag == "true":
                        job = client.query(final_query)
                        job.result()

                        print(
                            f"Created new table \
                            {job.destination.project}. \
                            {job.destination.dataset_id}.\
                            {job.destination.table_id}"
                        )

                        sucess_record = [
                            (
                                datetime.datetime.now().strftime("%s"),
                                target_path,
                                target_dataset,
                                input_table,
                                "BQ_Generic_Migration",
                                "Migration Successfull",
                                "Success",
                                job.error_result,
                            )
                        ]
                        log_table_data(table_ref, client, sucess_record)
                        print("Updated the Schema Succesfully")

                    write_to_blob(
                        gcs_client,
                        bucket_name=source_bucket_name,
                        file_name=f"{target_dataset}_processed/{target_table}.sql",
                        content=final_query,
                    )
            else:
                print(
                    f"Table {target_dataset}.{input_tbl_name.name} contains error in \
                    the script so skipping"
                )
        elif input_tbl_name.name.split("/")[0] == source_prefix:
            input_object = input_tbl_name.name.split("/")[0]
            print(f"Source prefix object {input_object} so skipping")
        else:
            print("No sql file present in the object")


def main(gcs_config_path, project_id):
    """
    Main function to execute the other function call
    """

    # Set the variable value
    config_source_bucket_name = gcs_config_path.split("//")[1].split("/")[0]
    config_source_prefix = gcs_config_path.split(config_source_bucket_name + "/")[1]

    # Read Config File values:
    gcs_client = storage.Client(project_id)

    config_string = readgcs_file(
        gcs_client, config_source_bucket_name, config_source_prefix
    )

    migration_config_dict = parse_json(config_string)

    # Read variable values define in config file
    gcs_source_path = migration_config_dict["gcs_source_path"]
    dataset_location = migration_config_dict["dataset_location"]
    target_dataset = migration_config_dict["target_dataset"]
    audit_config_file = migration_config_dict["audit_column_config_path"]
    target_table_prefix = migration_config_dict["target_table_prefix"]
    table_create_flag = migration_config_dict["table_create_flag"]

    # Derived variable required in the code:
    source_bucket_name = gcs_source_path.split("//")[1].split("/")[0]
    gcs_target_path = f"gs://{source_bucket_name}/{target_dataset}"
    target_bucket_name = gcs_target_path.split("//")[1].split("/")[0]
    source_prefix = gcs_source_path.split("//")[1].split("/")[1]
    target_prefix = gcs_target_path.split("//")[1].split("/")[1]
    log_table_id = f"{target_dataset}/batch_translation_report.csv"

    print("\n-------------------- Running create ddl function --------------------\n")
    # Call the function to create the ddl
    create_ddl(
        source_bucket_name,
        target_bucket_name,
        source_prefix,
        target_prefix,
        target_dataset,
        project_id,
        dataset_location,
        log_table_id,
        audit_config_file,
        target_table_prefix,
        config_source_bucket_name,
        config_source_prefix,
        table_create_flag,
    )


if __name__ == "__main__":

    parser = argparse.ArgumentParser(
        description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter
    )

    parser.add_argument("gcs_config_path", help="GCS Config Path for defined variables")

    parser.add_argument("project_id", help="Project_id required to run the code")

    args = parser.parse_args()

    main(args.gcs_config_path, args.project_id)
# Command to run the script
# python3 bq_table_creator.py <json_config_file_path> <project_name>
# eg) python3 bq_table_creator.py
#           gs://orcl-ddl-migration/orcl-ddl-extraction-config-replica.json helix-poc
# eg) python3 bq_table_creator.py
#       gs://orcl-ddl-migration/orcl-ddl-extraction-config-cdc.json helix-poc
