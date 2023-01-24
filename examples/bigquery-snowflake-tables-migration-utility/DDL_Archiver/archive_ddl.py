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
"""Module the Archive the DDL"""


import argparse
import json
import ast
from google.cloud import storage


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


def mv_blob(source_bucket_name, archive_bucket_name, source_prefix, project_id):
    """
    Function to move the file from one bucket to another bucket
    """
    gcs_client = storage.Client(project_id)

    source_bucket = gcs_client.get_bucket(source_bucket_name)

    archive_bucket = gcs_client.get_bucket(archive_bucket_name)

    for input_tbl_name in source_bucket.list_blobs(prefix=source_prefix + "/"):
        source_blob = source_bucket.blob(input_tbl_name.name)
        new_blob = source_bucket.copy_blob(source_blob, archive_bucket)
        print(f"File copied from {source_blob} to {new_blob}")
        source_blob.delete()
    print(
        f"Files inside object {source_prefix} deleted successfully from bucket {source_bucket_name}"
    )


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
    archive_bucket_name = migration_config_dict["archive_bucket_name"]
    target_dataset = migration_config_dict["target_dataset"]

    # Derived variable required in the code:
    source_bucket_name = gcs_source_path.split("//")[1].split("/")[0]
    gcs_target_path = f"gs://{source_bucket_name}/{target_dataset}"
    source_prefix = gcs_source_path.split("//")[1].split("/")[1]
    target_prefix = gcs_target_path.split("//")[1].split("/")[1]

    # move the Snowflake DDL to archive storage:
    print("\n-------------------- Archive Snowflake DDL --------------------\n")
    mv_blob(source_bucket_name, archive_bucket_name, source_prefix, project_id)

    print(
        "\n-------------------- Archive Converted Bigquery DDL --------------------\n"
    )
    # move the Bigquery Converted DDL to archive storage:
    mv_blob(source_bucket_name, archive_bucket_name, target_prefix, project_id)

    print("\n-------------------- Archive Final Bigquery DDL--------------------\n")
    # move the Bigquery Converted DDL to archive storage:
    mv_blob(
        source_bucket_name,
        archive_bucket_name,
        target_prefix + "_processed",
        project_id,
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
# python3 archive_ddl.py <json_config_file_path> <project_name>
# python3 archive_ddl.py gs://snowflake-ddl-extraction/sf-ddl-extraction-config.json poc-env-aks