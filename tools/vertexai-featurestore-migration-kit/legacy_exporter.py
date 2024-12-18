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
"""Legacy Feature Store Exporter"""
import os
import csv
from typing import List, Tuple
from datetime import datetime
import yaml
from google.cloud import aiplatform_v1

from logging_config import logger
from utils import create_dataset_if_not_exists, poll_operation, rename_bigquery_column, update_bq_column_descriptions

PROJECT_ROOT = os.path.abspath(os.path.dirname(__file__))
CONFIG_FILE = os.path.join(PROJECT_ROOT, 'config', 'config.yaml')


class LegacyExporter:
    """Legacy Feature Store Exporter"""

    def __init__(self):
        """Initialize the LegacyExporter class."""
        logger.info("LegacyExporter initialized")
        self.config = self.read_config(CONFIG_FILE)

        self.project_id = self.config.get("project_id")
        self.region = self.config.get("region")

        self.dataset_id_prefix = self.config.get("bq_dataset_prefix", "")
        self.table_id_prefix = self.config.get("bq_table_prefix", "")
        self.feature_store_mode = self.config.get("legacy_feature_store").get("feature_store_mode")

        self.client = aiplatform_v1.FeaturestoreServiceClient(
            client_options={"api_endpoint": f"{self.region}-aiplatform.googleapis.com"})

    @staticmethod
    def read_config(config_file):
        """
        Read the configuration file.

        Args:
            config_file (str): The path to the configuration file.

        Returns:
            dict: The configuration loaded from the file.
        """
        with open(config_file, "r", encoding="utf-8") as stream:
            config = yaml.safe_load(stream)
        return config

    def list_features(self, featurestore_id: str, entity_type_id: str) -> List[dict]:
        """
        Lists features in a specific entity type within a Vertex AI Featurestore.

        Args:
            featurestore_id (str): The ID of the Featurestore.
            entity_type_id (str): The ID of the entity type within the Featurestore.

        Returns:
            List[dict]: A list of feature dictionaries, each containing the name, description, and labels of the feature.
        """
        parent = self.client.entity_type_path(
            project=self.project_id, location=self.region, featurestore=featurestore_id, entity_type=entity_type_id
        )

        request = aiplatform_v1.ListFeaturesRequest(
            parent=parent,
        )

        page_result = self.client.list_features(request=request)
        features = []
        for response in page_result:
            features.append(
                dict(name=response.name.split('/')[-1],
                     description=response.description,
                     labels=dict(response.labels))
            )
        return features

    def list_entity_types(self, feature_store_id) -> Tuple[str, List[dict]]:
        """
        Loads the list of entity types specified in the configuration or lists all entity types for
        a given feature store.

        Args:
            feature_store_id (str): The ID of the feature store.

        Returns:
            Tuple[str, List[dict]]: The entity type mode and a list of entity type dictionaries.
        """
        logger.debug(f"Listing entity types for FeatureStore: {feature_store_id}")

        if self.feature_store_mode == 'all':
            entity_type_mode = "all"
        elif self.feature_store_mode == 'list':
            feature_store = next(
                (fs for fs in self.config["legacy_feature_store"]["feature_stores"] if fs["name"] == feature_store_id),
                None
            )
            if not feature_store:
                raise ValueError(f"FeatureStore with name '{feature_store_id}' not found in the configuration.")
            entity_type_mode = feature_store.get("entity_type_mode", "all")
        else:
            raise ValueError("Invalid value specified for `feature_store_mode`. "
                             "Expected one of `all` or `list`")

        # List Entity Types
        list_entity_type_request = aiplatform_v1.ListEntityTypesRequest(
            parent=f"projects/{self.project_id}/locations/{self.region}/featurestores/{feature_store_id}")
        list_entity_type_response = self.client.list_entity_types(request=list_entity_type_request)

        if entity_type_mode == "list":
            filtered_entity_types = [
                entity_type
                for entity_type in list_entity_type_response
                if any(et["name"] == entity_type.name.split('/')[-1] for et in feature_store["entity_types"])
            ]
        elif entity_type_mode == "all":
            filtered_entity_types = list_entity_type_response
        else:
            raise ValueError("Invalid value specified for `entity_type_mode`. "
                             "Expected one of `all` or `list`")

        entity_types = [{
            "name": entity_type.name.split('/')[-1],
            "description": entity_type.description,
            "labels": dict(entity_type.labels)
        } for entity_type in filtered_entity_types]

        logger.info(f"Entity Types to be migrated for '{feature_store_id}': \n{entity_types}")
        return entity_type_mode, entity_types

    def get_feature_mapping(self, feature_store_id, entity_type_name, features_list):
        """
        Retrieves the feature mapping for a given entity type and feature store.

        Args:
            feature_store_id (str): The ID of the feature store.
            entity_type_name (str): The name of the entity type.
            features_list (List[dict]): The list of features.

        Returns:
            dict or None: The feature mapping, or None if not found.
        """
        feature_store = next(
            (fs for fs in self.config["legacy_feature_store"]["feature_stores"] if fs["name"] == feature_store_id),
            None
        )

        if feature_store:
            entity_type = next(
                (et for et in feature_store["entity_types"] if et["name"] == entity_type_name),
                None
            )
            if entity_type:
                mapping_file = entity_type.get("mapping_file")
                if not mapping_file:
                    return {}

                try:
                    with open(os.path.join(PROJECT_ROOT, 'config', mapping_file), 'r') as csvfile:
                        reader = csv.DictReader(csvfile)
                        mapping_dict = {row['original_feature_name']: row['destination_feature_name'] for row in reader}

                        original_feature_names = set(mapping_dict.keys())
                        features_set = set(feature["name"] for feature in features_list)
                        if not original_feature_names.issubset(features_set):
                            missing_features = original_feature_names - features_set
                            raise ValueError(
                                f"The following feature names are not present in the EntityType"
                                f" `{entity_type_name}`: {', '.join(missing_features)}")

                        return mapping_dict
                except FileNotFoundError as e:
                    logger.error(f"Mapping file '{mapping_file}' not found for EntityType '{entity_type['name']}'.")
                    raise e
            else:
                raise ValueError(f"Entity type '{entity_type_name}' not found in FeatureStore '{feature_store_id}'.")
        else:
            raise ValueError(f"FeatureStore '{feature_store_id}' not found in the configuration.")

    def list_feature_stores(self, config_feature_list=None):
        """
        Lists all the feature stores for a given project.

        Args:
            config_feature_list (Optional[List[str]]): A list of feature store IDs to filter the results.

        Returns:
            dict: A dictionary of feature store details, keyed by feature store ID.
        """
        list_feature_stores_request = aiplatform_v1.ListFeaturestoresRequest(
            parent=f"projects/{self.project_id}/locations/{self.region}"
        )
        list_feature_store_response = self.client.list_featurestores(list_feature_stores_request)

        response = {}
        for feature_store in list_feature_store_response:
            fs_name = feature_store.name.split('/')[-1]
            labels = dict(feature_store.labels)
            if config_feature_list and fs_name not in config_feature_list:
                continue

            online_serving_config = getattr(feature_store, "online_serving_config", None)
            if online_serving_config:
                if getattr(online_serving_config, "scaling", None):
                    response[fs_name] = {
                        "online_store_type": "bigtable",
                        "labels": labels,
                        "bigtable_min_node_count": online_serving_config.scaling.min_node_count,
                        "bigtable_max_node_count": online_serving_config.scaling.max_node_count,
                        "cpu_utilization_target": online_serving_config.scaling.cpu_utilization_target,
                    }
                elif getattr(online_serving_config, "fixed_node_count", None):
                    response[fs_name] = {
                        "online_store_type": "bigtable",
                        "labels": labels,
                        "bigtable_min_node_count": online_serving_config.fixed_node_count,
                        "bigtable_max_node_count": 0,
                        "cpu_utilization_target": 0,
                    }
                else:
                    response[fs_name] = {}
            else:
                response[fs_name] = {}
        return response

    def fetch_entity_id_column(self, feature_store_id, entity_type_name) -> str:
        """
        Fetches the entity ID column for the given feature store and entity type.

        Args:
            feature_store_id (str): The ID of the feature store.
            entity_type_name (str): The name of the entity type.

        Returns:
            str: The entity ID column name, or an empty string if not found.
        """
        feature_stores = self.config["legacy_feature_store"].get("feature_stores")
        if not feature_stores:
            return ""

        column_value = ""
        for fs in feature_stores:
            if fs["name"] == feature_store_id and fs.get("entity_types"):
                for et in fs["entity_types"]:
                    if et["name"] == entity_type_name:
                        return et.get("entity_id_column", "")
        return column_value

    def export_feature_value(
            self,
            feature_store_id: str,
            entity_type: str,
            features_list: list[str],
            bq_dest: str,
            feature_mapping: dict
    ):
        """
        Exports feature values to a BigQuery destination.

        Args:
            feature_store_id (str): The ID of the feature store.
            entity_type (str): The name of the entity type.
            features_list (list[str]): The list of feature names to export.
            bq_dest (str): The BigQuery destination URI.
            feature_mapping (dict): The feature mapping dictionary.

        Returns:
            The response from the export operation.
        """
        dest = aiplatform_v1.FeatureValueDestination()
        dest.bigquery_destination.output_uri = bq_dest

        feature_selector = aiplatform_v1.FeatureSelector()
        feature_selector.id_matcher.ids = features_list

        destination_feature_settings = []
        if feature_mapping:
            for feature, destination in feature_mapping.items():
                destination_mapping = aiplatform_v1.DestinationFeatureSetting(feature_id=feature,
                                                                              destination_field=destination)
                destination_feature_settings.append(destination_mapping)

        entity_type = self.client.entity_type_path(
            project=self.project_id,
            location=self.region,
            featurestore=feature_store_id,
            entity_type=entity_type
        )

        request = aiplatform_v1.ExportFeatureValuesRequest(
            entity_type=entity_type,
            destination=dest,
            feature_selector=feature_selector,
            settings=destination_feature_settings)

        request.full_export.end_time = datetime.now().replace(microsecond=0)

        logger.info("Exporting feature values")
        op = self.client.export_feature_values(request=request)
        response = poll_operation(client=self.client, operation_name=op.operation.name)
        return response

    def _export_individual_feature(self, feature_store_id, entity_type, features_list, feature_mapping, fs_detail):
        """
        Exports the features for a given entity type.

        Args:
            feature_store_id (str): The ID of the feature store.
            entity_type (dict): The entity type information.
            features_list (list[dict]): The list of features.
            feature_mapping (dict): The feature mapping.
            fs_detail (dict): The details of the feature store.

        Returns:
            dict: A dictionary containing the exported entity type information.
        """
        entity_type_name = entity_type['name']
        dataset_id = self.dataset_id_prefix + feature_store_id
        table_id = self.table_id_prefix + entity_type_name
        bq_dest_uri = f"bq://{self.project_id}.{dataset_id}.{table_id}"
        logger.debug(f"BQ Export Path for '{entity_type_name}': {bq_dest_uri}")

        feature_names_list = [feature["name"] for feature in features_list]
        self.export_feature_value(feature_store_id=feature_store_id,
                                  entity_type=entity_type_name,
                                  features_list=feature_names_list,
                                  bq_dest=bq_dest_uri,
                                  feature_mapping=feature_mapping)

        reserved_keywords = ["entity_id", "feature_timestamp", "arrival_timestamp"]
        final_features_list = [feature for feature in features_list if
                               feature['name'] not in reserved_keywords]
        if feature_mapping:
            final_features_list = [{**feature, 'name': feature_mapping[feature['name']]}
                                   for feature in final_features_list]

        update_bq_column_descriptions(bq_dest_uri,
                                      final_features_list,
                                      entity_type["description"])

        entity_id_column = f"entity_type_{entity_type_name}"
        dest_column = self.fetch_entity_id_column(feature_store_id, entity_type_name)
        if dest_column:
            logger.info("Processing entity id column renaming")
            rename_bigquery_column(bq_dest_uri, entity_id_column, dest_column)
            entity_id_column = dest_column

        return {
            "entity_type": entity_type,
            "features": final_features_list,
            "entity_id_column": entity_id_column,
            "bq_dest": bq_dest_uri,
            "online_store": fs_detail
        }

    def _export_entity_types(self, feature_store_id, entity_types, entity_type_mode, fs_detail):
        """
        Export the entity types for a given feature store.

        Args:
            feature_store_id (str): The ID of the feature store.
            entity_types (list): The list of entity types.
            entity_type_mode (str): The mode for entity types ('all' or 'list').
            fs_detail (dict): The details of the online feature store config.

        Returns:
            list: A list of exported entity type results.
        """
        exported_entity_type_result = []
        for entity_type in entity_types:
            entity_type_name = entity_type['name']
            logger.info(f"Processing EntityType: {entity_type_name}")

            # Get feature mapping, if exists
            features_list = self.list_features(feature_store_id, entity_type_name)
            if entity_type_mode == "all":
                feature_mapping = None
            else:
                feature_mapping = self.get_feature_mapping(
                    feature_store_id=feature_store_id,
                    entity_type_name=entity_type_name,
                    features_list=features_list)
                if feature_mapping:
                    features_list = [feature for feature in features_list
                                     if feature['name'] in feature_mapping]

            if not features_list:
                logger.info(f"No Features found under EntityType '{entity_type_name}'")
                logger.info(f"Skipping EntityType '{entity_type_name}'")
                continue

            try:
                exported_entity_type_result.append(
                    self._export_individual_feature(feature_store_id, entity_type, features_list,
                                                    feature_mapping, fs_detail)
                )

                logger.info(f"Exported EntityType '{entity_type_name}' successfully!")
                logger.info("-" * 100)
            except Exception as exc:
                logger.error(f"Failed to export entity_type '{entity_type_name}' with error: {exc}")
                raise exc
        return exported_entity_type_result

    def export_feature_store(self):
        """
        Export feature stores from the legacy feature store system.

        Returns:
            dict: A dictionary containing the export details, including the project ID, region, and exported data for each feature store.
        """
        config_feature_store_ids = None
        if self.feature_store_mode != 'all':
            config_feature_store_ids = [fs["name"] for fs in self.config["legacy_feature_store"]["feature_stores"]]

        feature_store_details = self.list_feature_stores(config_feature_list=config_feature_store_ids)

        exported_results = {
            "project_id": self.project_id,
            "region": self.region,
            "export_details": {}
        }
        for feature_store_id, fs_detail in feature_store_details.items():
            logger.info(f"Processing FeatureStore: {feature_store_id}")

            # Create BQ dataset for export
            dataset_id = self.dataset_id_prefix + feature_store_id
            create_dataset_if_not_exists(self.project_id, dataset_id)

            # Entity types to migrate
            entity_type_mode, entity_types = self.list_entity_types(feature_store_id=feature_store_id)
            exported_entity_type_result = self._export_entity_types(
                feature_store_id, entity_types, entity_type_mode, fs_detail)
            exported_results["export_details"][feature_store_id] = exported_entity_type_result

            logger.info(f"Successfully exported all EntityTypes for FeatureStore: {feature_store_id}")
            logger.info("=" * 100)

        logger.info(f"Overall Export Status: \n{exported_results}")
        logger.info("*" * 50 + " Export Completed " + "*" * 50)
        return exported_results
