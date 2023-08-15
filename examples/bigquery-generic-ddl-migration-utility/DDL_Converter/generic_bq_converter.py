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
"""Module to create ddl in bq table"""

import argparse
import json
import ast
import time as t
from google.cloud import bigquery_migration_v2
from google.cloud import storage


def file_exist(gcs_client, target_bucket_name, log_table_id) -> bool:
    """
    Function to check file exist in gcs bucket
    """
    bucket = gcs_client.bucket(target_bucket_name)
    return storage.Blob(bucket=bucket, name=log_table_id).exists(gcs_client)


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


# Create migration workflow:
def create_migration_workflow(
    gcs_client,
    gcs_source_path,
    gcs_target_path,
    project_id,
    db_type,
    target_bucket_name,
    log_table_id,
    object_name_config_file,
    default_db,
):
    """
    Check if batch report file already exist then delete before running the migration:
    """
    print("Starting Migration workflow")

    parent = f"projects/{project_id}/locations/us"

    # Construct a BigQuery Migration client object.
    service_client = bigquery_migration_v2.MigrationServiceClient()
    source_dialect = bigquery_migration_v2.Dialect()

    # Set the source dialect to Generic SQL.
    if db_type == 'oracle':
        source_dialect.oracle_dialect = bigquery_migration_v2.OracleDialect()
    elif db_type == 'snowflake':
        source_dialect.snowflake_dialect = bigquery_migration_v2.SnowflakeDialect()
    elif db_type == 'netezza':
        source_dialect.netezza_dialect = bigquery_migration_v2.NetezzaDialect()
    elif db_type == 'vertica':
        source_dialect.vertica_dialect = bigquery_migration_v2.VerticaDialect()
    elif db_type == "mssql":
        source_dialect.sqlserver_dialect = bigquery_migration_v2.SQLServerDialect()
    else:
        raise Exception("Invalid DB Type")
                
    # Set the target dialect to BigQuery dialect.
    target_dialect = bigquery_migration_v2.Dialect()
    target_dialect.bigquery_dialect = bigquery_migration_v2.BigQueryDialect()

    # Source env
    source_env = bigquery_migration_v2.SourceEnv(default_database=default_db)
    json_data_string = readgcs_file(
        gcs_client, target_bucket_name, prefix=object_name_config_file
    )
    object_name_mapping_list = parse_json(json_data_string)

    # Prepare the config proto.
    translation_config = bigquery_migration_v2.TranslationConfigDetails(
        gcs_source_path=gcs_source_path,
        gcs_target_path=gcs_target_path,
        source_dialect=source_dialect,
        target_dialect=target_dialect,
        source_env=source_env,
        name_mapping_list=object_name_mapping_list,
    )

    # Prepare the task.
    migration_task = bigquery_migration_v2.MigrationTask(
        type_="Translation_Generic2BQ", translation_config_details=translation_config
    )

    # Prepare the workflow.
    workflow = bigquery_migration_v2.MigrationWorkflow(
        display_name="Demo_Generic2BQ_Migration"
    )
    workflow.tasks["translation-task"] = migration_task

    # Prepare the API request to create a migration workflow.
    request = bigquery_migration_v2.CreateMigrationWorkflowRequest(
        parent=parent,
        migration_workflow=workflow,
    )
    response = service_client.create_migration_workflow(request=request)

    # code to check the migration completed succesfully or not:
    starttime = t.time()
    while True:
        if file_exist(gcs_client, target_bucket_name, log_table_id):
            break
        else:
            t.sleep(60.0 - ((t.time() - starttime) % 60.0))
    print("Created workflow:")
    print(response.display_name)
    print("Current state:")
    print(response.State(response.state))
    print("Migration completed succesfully")


def main(gcs_config_path, project_id, db_type):
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
    target_dataset = migration_config_dict["target_dataset"]
    object_name_config_file = migration_config_dict["object_name_mapping_path"]
    default_db = migration_config_dict["default_database"]

    # Derived variable required in the code:
    source_bucket_name = gcs_source_path.split("//")[1].split("/")[0]
    gcs_target_path = f"gs://{source_bucket_name}/{target_dataset}"
    target_bucket_name = gcs_target_path.split("//")[1].split("/")[0]
    log_table_id = f"{target_dataset}/batch_translation_report.csv"

    print(
        "-------------------- Running Migration workflow function --------------------\n"
    )
    # Call the migration workflow function
    create_migration_workflow(
        gcs_client,
        gcs_source_path,
        gcs_target_path,
        project_id,
        db_type,
        target_bucket_name,
        log_table_id,
        object_name_config_file,
        default_db,
    )


if __name__ == "__main__":

    parser = argparse.ArgumentParser(
        description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter
    )

    parser.add_argument("gcs_config_path", help="GCS Config Path for defined variables")

    parser.add_argument("project_id", help="Project_id required to run the code")

    parser.add_argument("db_type", help="GCS Config Path for defined variables")

    args = parser.parse_args()

    main(args.gcs_config_path, args.project_id, args.db_type)

