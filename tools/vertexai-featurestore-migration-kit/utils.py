# -*- coding: utf-8 -*-
# Copyright 2024 Google LLC
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
import re
import time
from typing import Union

from google.cloud import bigquery
from logging_config import logger
from google.longrunning import operations_pb2
from google.cloud.aiplatform_v1 import FeaturestoreServiceClient, FeatureOnlineStoreAdminServiceClient


def create_dataset_if_not_exists(project_id, dataset_id):
    """Checks if a dataset exists in BigQuery and creates it if it doesn't.

    Args:
        project_id (str): Your Google Cloud project ID.
        dataset_id (str): The ID of the dataset you want to create (e.g., "my_dataset").
    """

    client = bigquery.Client(project=project_id)
    dataset_id = f"{project_id}.{dataset_id}"

    try:
        dataset = client.create_dataset(dataset=dataset_id, exists_ok=True)
        logger.info(f"Created dataset '{dataset.dataset_id}'")
    except Exception:
        logger.error("BigQuery error occurred while creating dataset.")
        raise


def list_exported_features(project_id, dataset_id, table_id):
    """
    Lists the features exported to a BigQuery table, excluding reserved keywords.

    Args:
        project_id (str): Your Google Cloud project ID.
        dataset_id (str): The ID of the BigQuery dataset.
        table_id (str): The ID of the BigQuery table.

    Returns:
        list: A list of feature names excluding reserved keywords.
    """
    client = bigquery.Client(project=project_id)
    table_ref = client.dataset(dataset_id).table(table_id)
    try:
        # Get table information
        table = client.get_table(table_ref)
        features_list = [field.name for field in table.schema]

        reserved_keywords = ["entity_id", "feature_timestamp", "arrival_timestamp"]
        final_features_list = list(set(features_list) - set(reserved_keywords))
        return final_features_list
    except Exception as e:
        logger.error(f"Error occurred while fetching the table. Exception is: {e}")
        raise e


def rename_bigquery_column(bq_uri, column_name, dest_column_name):
    """Renames a column within a BigQuery table.

    Args:
        bq_uri (str): URI of the BigQuery table (e.g., 'project.dataset.table')
        column_name (str): Name of the column to duplicate
        dest_column_name (str): Name of the new duplicated column

    Raises:
        ValueError: If column_name or dest_column_name is not provided
        google.api_core.exceptions.BadRequest: If there's an issue with the BigQuery request
    """

    if not column_name or not dest_column_name:
        raise ValueError("Both column_name and dest_column_name must be provided")

    # BigQuery client
    client = bigquery.Client()
    table_id = bq_uri.replace("bq://", "").replace("/", ".")
    table_ref = client.get_table(table_id)

    ddl = f"""
        ALTER TABLE `{table_ref.project}.{table_ref.dataset_id}.{table_ref.table_id}`
        RENAME COLUMN `{column_name}` TO `{dest_column_name}`;
        """

    # Update the table schema
    job = client.query(ddl)
    job.result()

    logger.info(f"Column '{column_name}' successfully renamed to '{dest_column_name}' in '{bq_uri}'")


def update_bq_column_descriptions(
        bq_dest_uri, features_list, table_description=None, dataset_description=None):
    """
    Updates BigQuery column descriptions and optionally table/dataset descriptions.

    Args:
        bq_dest_uri (str): BigQuery destination URI.
        features_list (list): List of dictionaries containing feature names and descriptions.
        table_description (str, optional): New table description.
        dataset_description (str, optional): New dataset description.
    """

    # Extract project_id, dataset_id, and table_id from bq_dest_uri
    project_id, dataset_id, table_id = bq_dest_uri.replace("bq://", "").split(".")

    client = bigquery.Client(project=project_id)
    table_ref = client.dataset(dataset_id).table(table_id)
    table = client.get_table(table_ref)
    dataset = client.get_dataset(dataset_id)

    # Create a dictionary for faster lookup
    features_dict = {feature['name']: feature['description'] for feature in features_list}

    # Convert Table object to dict
    table_def = table.to_api_repr()

    # Update dataset description if provided
    if dataset_description:
        dataset.description = dataset_description
        client.update_dataset(dataset, ["description"])

    # Update table description if provided
    if table_description:
        table_def['description'] = table_description

    # Update column descriptions in the dictionary representation
    for field in table_def['schema']['fields']:
        if field['name'] in features_dict:
            field['description'] = features_dict[field['name']]

    # Apply the changes to the table
    updated_table = bigquery.Table.from_api_repr(table_def)
    client.update_table(updated_table, ["schema", "description"])

    logger.info(f"Updated column descriptions in BigQuery table: {bq_dest_uri}")


def format_to_feature_view_request(data: dict):
    """
    Formats input data into a structure suitable for a Feature View request.

    Args:
        data (dict): Input data containing feature store and entity details

    Returns:
        list: A list of dictionaries representing Feature View requests
    """
    logger.debug(f"Formatting data to feature view request : {data}")
    response = []
    for _, entity_details in data.items():
        for item in entity_details:
            response.append({
                "feature_group_id": item["entity_type"],
                "features": item["features"]
            })

    return response


def poll_operation(client: Union[FeaturestoreServiceClient, FeatureOnlineStoreAdminServiceClient],
                   operation_name: str,
                   polling_interval: int = 10,
                   timeout: int = 60 * 15) -> operations_pb2.Operation:
    """Polls an operation for a fixed duration, then informs the user if it's still running in the background.

    Args:
        client: FeaturestoreServiceClient
        operation_name (str): The name of the operation to poll.
        polling_interval (int): Polling interval in seconds (default: 10).
        timeout (int): The maximum time to poll in seconds (default: 60*15).

    Returns:
        operations_pb2.Operation: The final operation status.
    """

    request = operations_pb2.GetOperationRequest(name=operation_name)
    start_time = time.time()

    while True:
        operation = client.get_operation(request=request)
        logger.info("operation is in progress...")

        if operation.done:
            if operation.error.message:
                try:
                    error_response = operation.error.message
                    logger.error(f"Operation failed: {error_response}")
                    raise RuntimeError
                except AttributeError:
                    logger.info("Operations Status: ", operation.response)

            logger.info("Operation completed!")
            return operation

        elapsed_time = time.time() - start_time
        if elapsed_time >= timeout:
            logger.info("Reached timeout limit. Checking the status...")
            if operation.done:
                try:
                    error_response = operation.error.message
                    logger.error(f"Operation failed: {error_response}")
                    raise RuntimeError
                except AttributeError:
                    logger.info("Operations Status: ", operation.response)
            else:
                logger.info(f"Operation '{operation_name}' is still running in the background.")
            break

        time.sleep(polling_interval)

    return operation


def transform_json(input_data):
    """
    Transforms the input JSON data into a format suitable for creating online stores and feature views.

    Args:
        input_data (dict): Input JSON data.

    Returns:
        dict: Transformed data with online stores and feature views.
    """
    output_data = {
        "project_id": input_data["project_id"],
        "region": input_data["region"],
        "online_stores": []
    }

    for feature_store_name, entity_list in input_data["export_details"].items():
        online_store = {
            "feature_online_store_name": feature_store_name,
            "features_views": []
        }
        for entity in entity_list:
            if entity["online_store"]:
                online_store.update(entity["online_store"])
                features_view = {
                    "feature_view_id": f"{entity['entity_type']['name']}_feature_view",
                    "feature_view_description": entity['entity_type']['description'],
                    "feature_view_labels": entity['entity_type']['labels'],
                    "cron_schedule": None,
                    "feature_groups": [
                        {
                            "feature_group_id": entity['entity_type']['name'],
                            "feature_ids": entity['features']
                        }
                    ]
                }
                online_store["features_views"].append(features_view)
        output_data["online_stores"].append(online_store)

    return output_data


def make_valid_online_store_id(identifier):
    """Makes a valid Feature Online Store ID from a given string."""
    return re.sub(r"[^a-z0-9_-]", "", identifier.lower())


def make_valid_feature_view_id(identifier):
    """Makes a valid Feature View ID from a given string."""
    return re.sub(r"[^a-z0-9_]", "", identifier.lower())
