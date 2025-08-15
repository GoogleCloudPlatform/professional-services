import functions_framework
import json
import os
import traceback
import logging
from dataclasses import dataclass
from datetime import datetime, timedelta
from typing import Dict, Any, List, Optional

from google.api_core.exceptions import GoogleAPICallError
from google.cloud import bigquery, storage, logging as cloud_logging
from google.cloud.bigquery.schema import SchemaField, PolicyTagList

# Setup structured logging
logging_client = cloud_logging.Client()
logging_client.setup_logging()


@dataclass
class Config:
    """Loads and validates all environment variables."""
    policy_tag_taxonomy: Dict[str, Any]
    bucket_name: str
    file_prefix: str
    success_path: str
    failure_path: str
    date_limit_enabled: bool
    date_limit_days: int

    @classmethod
    def from_env(cls):
        """Factory method to create a Config instance from environment variables."""
        try:
            return cls(
                policy_tag_taxonomy=json.loads(
                    os.environ["POLICY_TAG_TAXONOMY"]),
                bucket_name=os.environ["BUCKET_NAME"],
                file_prefix=os.environ["FILE_PREFIX"],
                success_path=os.environ["SUCCESS_PATH"],
                failure_path=os.environ["FAILURE_PATH"],
                date_limit_enabled=os.environ.get("DATE_LIMIT_ENABLED",
                                                  "false").lower() == "true",
                date_limit_days=int(os.environ.get("DATE_LIMIT_DAYS", "0")),
            )
        except (KeyError, json.JSONDecodeError) as e:
            logging.critical(
                f"FATAL: Missing or invalid environment variable: {e}")
            raise


def move_gcs_file(storage_client: storage.Client, bucket_name: str,
                  source_blob_name: str, dest_folder: str):
    """Moves a blob to a specified destination folder within the same bucket."""
    try:
        source_bucket = storage_client.bucket(bucket_name)
        source_blob = source_bucket.blob(source_blob_name)
        if not source_blob.exists():
            logging.warning(
                f"Source file {source_blob_name} not found. Cannot move.")
            return

        dest_folder = dest_folder.strip('/')
        destination_blob_name = f"{dest_folder}/{source_blob_name}"

        logging.info(
            f"Moving '{source_blob_name}' to '{destination_blob_name}'")
        source_bucket.rename_blob(source_blob, destination_blob_name)
    except GoogleAPICallError as e:
        logging.error(
            f"Error moving file {source_blob_name} to {dest_folder}: {e}")


# Helper function to find the corresponding column details from the JSON input.
# This logic is restored from your original code to handle nested fields correctly.
def get_json_field_detail(json_column_list: List[Dict[str, Any]],
                          field: SchemaField) -> Optional[Dict[str, Any]]:
    """
    Gets json file details for a table field, supporting simple and nested field names.
    """
    field_name_lower = field.name.lower()
    for json_column in json_column_list:
        json_column_name = json_column.get("columnName", "")
        # Direct match for top-level fields
        if json_column_name.lower() == field_name_lower:
            return json_column
        # Match for nested fields (e.g., 'address.city' in JSON matches 'city' field in schema)
        if '.' in json_column_name and json_column_name.split(
                '.')[-1].lower() == field_name_lower:
            return json_column
    return None


# Helper function to determine the policy tag string from the classification.
def get_new_policy_tag_string(column_details: Dict[str, Any],
                              policy_map: Dict[str, Any]) -> Optional[str]:
    """Determines the correct policy tag resource string based on column classification."""
    is_pii = column_details.get("PII", False)
    classification = column_details.get("securityClassification")

    if classification is None:
        return None

    pii_key = "personalInformation" if is_pii else "nonPersonalInformation"
    # Make classification key mapping more robust
    class_key = "highlyConfidential" if classification and "Highly" in classification else "confidential"

    try:
        return policy_map[pii_key][class_key]
    except KeyError:
        logging.warning(
            f"No policy tag mapping found for pii_key='{pii_key}' and class_key='{class_key}'"
        )
        return None


def update_bq_schema_with_policy_tags(
    bq_client: bigquery.Client,
    table_ref: bigquery.TableReference,
    column_configs: List[Dict[str, Any]],
    config: Config,
):
    """
    Updates a BigQuery table's schema, applying policy tags ONLY to columns that do not already have one.
    """
    try:
        table = bq_client.get_table(table_ref)
    except GoogleAPICallError as e:
        logging.error(f"Could not get table {table_ref}. Skipping. Error: {e}")
        return

    original_schema = table.schema
    date_limit = datetime.now() - timedelta(days=config.date_limit_days)

    def recurse_schema(schema_fields: List[SchemaField]) -> List[SchemaField]:
        new_schema_fields = []
        for field in schema_fields:
            new_fields = None
            if field.field_type == "RECORD" and field.fields:
                new_fields = recurse_schema(field.fields)

            # Default to the existing policy tags. This is the crucial part.
            final_policy_tags = field.policy_tags

            # Check if the field already has a policy tag applied.
            has_existing_tags = field.policy_tags and field.policy_tags.names

            # Find the corresponding configuration for this field from the JSON file.
            json_column_details = get_json_field_detail(column_configs, field)

            # CORE LOGIC: Only proceed if the column does NOT have a tag and is mentioned in the JSON.
            if not has_existing_tags and json_column_details:
                logging.info(
                    f"Column '{field.name}' has no policy tag. Checking if one should be applied."
                )

                # Check if an update is allowed based on the last modified date
                update_allowed = not config.date_limit_enabled
                if config.date_limit_enabled:
                    try:
                        last_modified_str = json_column_details.get(
                            "last_modified", "")
                        last_modified_date = datetime.fromisoformat(
                            last_modified_str.replace('Z', '+00:00'))
                        if last_modified_date >= date_limit:
                            update_allowed = True
                        else:
                            logging.info(
                                f"Skipping tag for '{field.name}' because its last_modified date is before the limit."
                            )
                    except (ValueError, TypeError):
                        logging.warning(
                            f"Could not parse last_modified date '{json_column_details.get('last_modified')}' for column {field.name}. Skipping date check."
                        )

                if update_allowed:
                    new_tag_str = get_new_policy_tag_string(
                        json_column_details, config.policy_tag_taxonomy)
                    if new_tag_str:
                        logging.info(
                            f"Applying new policy tag to {table_ref.table_id}.{field.name}"
                        )
                        final_policy_tags = PolicyTagList(names=[new_tag_str])

            new_schema_fields.append(
                SchemaField(
                    name=field.name,
                    field_type=field.field_type,
                    mode=field.mode,
                    description=field.description,
                    fields=new_fields if new_fields else field.fields,
                    policy_tags=final_policy_tags,
                ))
        return new_schema_fields

    new_schema = recurse_schema(original_schema)

    if new_schema != original_schema:
        logging.info(
            f"Updating schema for table {table_ref.project}.{table_ref.dataset_id}.{table_ref.table_id}"
        )
        table.schema = new_schema
        bq_client.update_table(table, ["schema"])
    else:
        logging.info(
            f"No schema changes required for table {table_ref.table_id}")


@functions_framework.cloud_event
def main(cloud_event: "functions_framework.CloudEvent"):
    """
    Main entry point for the Cloud Function.
    Triggered by a file upload to GCS, it applies column-level policy tags to BigQuery tables.
    """
    try:
        config = Config.from_env()
        bq_client = bigquery.Client()
        storage_client = storage.Client()
    except Exception as e:
        logging.error(f"Error during initialization: {e}")
        return

    file_name = cloud_event.data.get("name")
    bucket_name = cloud_event.data.get("bucket")

    if not file_name or not bucket_name or config.bucket_name != bucket_name:
        logging.warning(
            f"Event for incorrect bucket '{bucket_name}' or missing file name. Ignoring."
        )
        return

    if file_name.startswith(config.success_path) or file_name.startswith(
            config.failure_path):
        logging.info(
            f"File '{file_name}' is already in a processed folder. Ignoring.")
        return

    if not os.path.basename(file_name).startswith(config.file_prefix):
        logging.error(
            f"File '{file_name}' does not have the required prefix '{config.file_prefix}'. Moving to failure path."
        )
        move_gcs_file(storage_client, config.bucket_name, file_name,
                      config.failure_path)
        return

    logging.info(f"Starting Policy Tag assignment for file: {file_name}")

    try:
        blob = storage_client.bucket(config.bucket_name).blob(file_name)
        json_data = json.loads(blob.download_as_string())

        for resource in json_data.get("resources", []):
            for project in resource.get("projects", []):
                project_name = project["projectName"]
                for dataset in project.get("datasets", []):
                    dataset_name = dataset["datasetName"]
                    for table in dataset.get("tables", []):
                        table_name = table["tableName"]
                        table_ref = bigquery.TableReference.from_string(
                            f"{project_name}.{dataset_name}.{table_name}")

                        update_bq_schema_with_policy_tags(
                            bq_client, table_ref, table["columns"], config)

        move_gcs_file(storage_client, config.bucket_name, file_name,
                      config.success_path)
        logging.info(f"Successfully processed file {file_name}")

    except Exception as e:
        logging.error(
            f"An unexpected error occurred: {e}\nTrace: {traceback.format_exc()}"
        )
        move_gcs_file(storage_client, config.bucket_name, file_name,
                      config.failure_path)
