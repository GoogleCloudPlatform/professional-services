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
"""Feature Store Importer module"""
import os
import yaml
from google.cloud import aiplatform_v1
from logging_config import logger

PROJECT_ROOT = os.path.abspath(os.path.dirname(__file__))
CONFIG_FILE = os.path.join(PROJECT_ROOT, 'config', 'config.yaml')


class FeatureStoreImporter:
    """Feature Store Importer module"""

    def __init__(self):
        logger.info("FeatureStoreImporter initialized")
        self.config = self.read_config(CONFIG_FILE)
        self.project_id = self.config.get("project_id")
        self.region = self.config.get("region")

        client_options = {"api_endpoint": f"{self.region}-aiplatform.googleapis.com"}
        self.client = aiplatform_v1.FeaturestoreServiceClient(client_options=client_options)
        self.feature_registry_client = aiplatform_v1.FeatureRegistryServiceClient(client_options=client_options)

    @staticmethod
    def read_config(config_file):
        """
        Reads the configuration file and returns a dictionary.

        Args:
            config_file (str): The path to the configuration file.

        Returns:
            dict: The configuration settings.
        """
        with open(config_file, "r", encoding="utf-8") as stream:
            config = yaml.safe_load(stream)
        return config

    def create_feature_group(self, feature_group_name: str, entity_id_columns: list, bq_uri: str, metadata: dict):
        """
        Creates a feature group and associates it with a BigQuery data source.

        Args:
            feature_group_name (str): The name of the feature group to be created.
            entity_id_columns (list): The list of entity ID columns.
            bq_uri (str): The BigQuery URI of the data source.
            metadata (dict): The metadata for the feature group, including description and labels.

        Returns:
            google.api_core.operation.Operation:
                An object representing a long-running operation.
        """
        logger.info(f"Creating FeatureGroup '{feature_group_name}' from BigQuery URI: {bq_uri}")

        feature_group_config = aiplatform_v1.FeatureGroup(
            big_query=aiplatform_v1.FeatureGroup.BigQuery(
                big_query_source=aiplatform_v1.BigQuerySource(input_uri=bq_uri),
                entity_id_columns=entity_id_columns
            ),
            description=metadata["description"],
            labels=metadata["labels"]
        )

        feature_group_request = aiplatform_v1.CreateFeatureGroupRequest(
            parent=f"projects/{self.project_id}/locations/{self.region}",
            feature_group=feature_group_config,
            feature_group_id=feature_group_name
        )

        feature_group_response = self.feature_registry_client.create_feature_group(request=feature_group_request)
        return feature_group_response

    def create_feature(self, feature_group_name: str, features_list: list):
        """
        Creates features in a feature group.

        Args:
            feature_group_name (str): The name of the feature group.
            features_list (list): A list of dictionaries containing feature information, including name, description, and labels.

        Returns:
            list: A list of created feature objects.
        """
        logger.info(f"Creating Features in the FeatureGroup '{feature_group_name}'")
        create_feature_response = []
        for feature in features_list:
            create_feature_response.append(
                self.feature_registry_client.create_feature(
                    aiplatform_v1.CreateFeatureRequest(
                        parent=f"projects/{self.project_id}/locations/{self.region}/featureGroups/{feature_group_name}",
                        feature_id=feature["name"],
                        feature=aiplatform_v1.Feature(name=feature["name"],
                                                      description=feature["description"],
                                                      labels=feature["labels"]),
                        # Feature Metadata information. Need to check if this needs to be migrated
                    )
                ).result()
            )

        return create_feature_response

    def import_features(self, data: dict) -> None:
        """
        Creates FeatureGroups and respective Features in FS V2.0 pointing to exported data in BigQuery

        Args:
            data (dict): A dictionary containing the details of the feature store migration,
            including feature store ID, entity types, and feature details.

        Returns:
            None
        """
        if not data:
            logger.info('Nothing to process')

        # For a given entity get the respective bq exported table
        for feature_store_id, export_details in data["export_details"].items():
            for entity_type_details in export_details:
                # Feature store 2.0 namespace
                feature_group = entity_type_details.get("entity_type")
                feature_group_name = feature_group.get("name")
                features_list = entity_type_details.get("features")
                entity_id_columns = [entity_type_details.get("entity_id_column")]

                # Create feature group
                feature_group_response = self.create_feature_group(feature_group_name=feature_group_name,
                                                                   entity_id_columns=entity_id_columns,
                                                                   bq_uri=entity_type_details.get("bq_dest"),
                                                                   metadata=feature_group)
                logger.debug(f"Successfully created FeatureGroup for {entity_type_details.get('entity_type')}: "
                             f"{feature_group_response.result()}")

                # Create individual features
                create_feature_response = self.create_feature(feature_group_name=feature_group_name,
                                                              features_list=features_list)
                logger.debug(
                    f"Created new Features in the FeatureGroup '{feature_group_name}': {create_feature_response}")
            logger.info("-" * 100)
        logger.info("Successfully Imported FeatureStore(s).")
