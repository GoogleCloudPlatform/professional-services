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
from google.cloud import aiplatform_v1
from google.cloud.aiplatform_v1.types import feature_view
from google.cloud.aiplatform_v1.types import feature_online_store_admin_service

from logging_config import logger
from utils import poll_operation, make_valid_feature_view_id, make_valid_online_store_id


class FeatureOnlineStore:
    """
    A class to create and manage Feature Online Stores in Google Cloud AI Platform.
    """

    def __init__(self, online_store_config_obj: dict, project_id: str, region: str):
        """
        Initializes the FeatureOnlineStore object.

        Args:
            online_store_config_obj (dict): A dictionary containing the configuration for the online store.
            project_id (str): The Google Cloud project ID.
            region (str): The Google Cloud region.
        """
        self.project_id = project_id
        self.region = region
        self.feature_online_store_name = make_valid_online_store_id(
            identifier=online_store_config_obj["feature_online_store_name"])
        self.online_store_type = online_store_config_obj["online_store_type"]
        self.bigtable_min_node_count = online_store_config_obj["bigtable_min_node_count"]
        self.bigtable_max_node_count = online_store_config_obj["bigtable_max_node_count"]
        if self.bigtable_max_node_count == 0:  # Online serving fixed_node config
            self.bigtable_max_node_count = self.bigtable_min_node_count
            self.bigtable_min_node_count = 1

        self.cpu_utilization_target = online_store_config_obj["cpu_utilization_target"]
        if self.cpu_utilization_target == 0:
            self.cpu_utilization_target = 10  # supported min value 10
        self.labels = online_store_config_obj["labels"]

        self.client = aiplatform_v1.FeatureOnlineStoreAdminServiceClient(
            client_options={"api_endpoint": f"{self.region}-aiplatform.googleapis.com"}
        )
        self.feature_views = online_store_config_obj["features_views"]
        logger.info("FeatureOnlineStore initialized")

    def check_feature_online_store_exists(self):
        """
        Checks if the Feature Online Store already exists.

        Returns:
            bool: True if the Feature Online Store exists, False otherwise.
        """
        logger.info(f"Checking if FeatureOnlineStore {self.feature_online_store_name} exists")
        # Initialize request argument(s)
        request = aiplatform_v1.GetFeatureOnlineStoreRequest(
            name=f"projects/{self.project_id}/locations/{self.region}/featureOnlineStores/{self.feature_online_store_name}",
        )

        try:
            self.client.get_feature_online_store(request=request)
            logger.info(f"FeatureOnlineStore {self.feature_online_store_name} already exists")
            return True
        except Exception:
            logger.info(f"FeatureOnlineStore {self.feature_online_store_name} does not exist")
            return False

    def create_feature_online_store(self):
        """
        Creates a Feature Online Store in the specified project and region.

        Returns:
            None
        """
        if self.check_feature_online_store_exists():
            raise ValueError(f"FeatureOnlineStore {self.feature_online_store_name} already exists")

        logger.info("Creating FeatureOnlineStore")

        # TODO: Handle PSC endpoint for online store

        if self.online_store_type == "optimized":
            feature_online_store = aiplatform_v1.FeatureOnlineStore(
                optimized=aiplatform_v1.FeatureOnlineStore.Optimized(),
                labels=self.labels
            )
        elif self.online_store_type == "bigtable":
            feature_online_store = aiplatform_v1.FeatureOnlineStore(
                bigtable=aiplatform_v1.FeatureOnlineStore.Bigtable(
                    auto_scaling=aiplatform_v1.FeatureOnlineStore.Bigtable.AutoScaling(
                        min_node_count=self.bigtable_min_node_count,
                        max_node_count=self.bigtable_max_node_count,
                        cpu_utilization_target=self.cpu_utilization_target
                    )
                ),
                labels=self.labels
            )
        else:
            raise ValueError("online_store_type must be either 'optimized' or 'bigtable'")

        request = aiplatform_v1.CreateFeatureOnlineStoreRequest(
            parent=f"projects/{self.project_id}/locations/{self.region}",
            feature_online_store=feature_online_store,
            feature_online_store_id=self.feature_online_store_name,
        )

        # Make the request
        try:
            op = self.client.create_feature_online_store(request=request)

        except Exception as exc:
            logger.error(f"Failed to Create online store {self.feature_online_store_name} with Error: {exc}")
            raise exc

        poll_operation(client=self.client, operation_name=op.operation.name)

    def create_feature_views_from_feature_groups(self):
        """
        Creates Feature Views from Feature Groups in the respective Online Feature Store.

        This method takes a list of feature group configurations and creates corresponding Feature Views
        in the Feature Online Store.

        Returns:
            None
        """
        for feature_view_config in self.feature_views:
            feature_groups_obj_list = []
            for feature_group_config in feature_view_config["feature_groups"]:
                feature_group_id = feature_group_config["feature_group_id"]
                feature_ids = [f["name"] for f in feature_group_config["feature_ids"]]
                feature_groups_obj_list.append(
                    feature_view.FeatureView.FeatureRegistrySource.FeatureGroup(
                        feature_group_id=feature_group_id, feature_ids=feature_ids
                    )
                )

            feature_registry_source = feature_view.FeatureView.FeatureRegistrySource(
                feature_groups=feature_groups_obj_list
            )

            sync_config = feature_view.FeatureView.SyncConfig(cron=feature_view_config["cron_schedule"])

            valid_feature_view_id = make_valid_feature_view_id(feature_view_config["feature_view_id"])

            try:
                logger.info(f"Creating FeatureView: `{valid_feature_view_id}`")
                create_feature_view_operation = self.client.create_feature_view(
                    feature_online_store_admin_service.CreateFeatureViewRequest(
                        parent=f"projects/{self.project_id}/locations/{self.region}/featureOnlineStores/{self.feature_online_store_name}",
                        feature_view_id=valid_feature_view_id,
                        feature_view=feature_view.FeatureView(
                            feature_registry_source=feature_registry_source,
                            sync_config=sync_config,
                            labels=feature_view_config["feature_view_labels"]
                        ),
                    )
                )
            except Exception as exc:
                logger.error(f"Failed to Create Feature View {valid_feature_view_id} with Error: {exc}")
                continue

            # Wait for LRO (Long running object) to complete and show result
            logger.info(f"Waiting for CreateFeatureViewRequest operation for {valid_feature_view_id} to complete...")
            response = poll_operation(client=self.client, operation_name=create_feature_view_operation.operation.name)
            if response.done:
                logger.info(f"FeatureView {valid_feature_view_id} created successfully!")

    def create_feature_views_from_bigquery_table(self, bigquery_sources: list):
        """
        Creates Feature Views from BigQuery tables in the respective Online Feature Store.

        This method takes a list of BigQuery table configurations and
        creates corresponding Feature Views in the Feature Online Store.

        Args:
            bigquery_sources (list): A list of dictionaries containing the BigQuery table configurations.

        Returns:
            None
        """
        for bigquery_source in bigquery_sources:
            bigquery_source_obj = feature_view.FeatureView.BigQuerySource(
                uri=bigquery_source["table_uri"],
                entity_id_columns=bigquery_source["entity_id_columns"]
            )

            sync_config = feature_view.FeatureView.SyncConfig(cron={})

            formatted_table_uri = bigquery_source["table_uri"].replace(".", "_").replace("-", "_").lower()
            valid_view_id = make_valid_feature_view_id(f"{formatted_table_uri}_view")

            try:
                create_feature_view_operation = self.client.create_feature_view(
                    feature_online_store_admin_service.CreateFeatureViewRequest(
                        parent=f"projects/{self.project_id}/locations/{self.region}/featureOnlineStores/{self.feature_online_store_name}",
                        feature_view_id=valid_view_id,
                        feature_view=feature_view.FeatureView(
                            big_query_source=bigquery_source_obj,
                            sync_config=sync_config,
                        ),
                    )
                )
            except Exception as exc:
                logger.error(f"Failed to Create Feature View {valid_view_id} with Error: {exc}")
                raise exc

            # Wait for LRO (Long running object) to complete and show result
            logger.info(f"Waiting for CreateFeatureViewRequest operation for {valid_view_id} to complete...")
            poll_operation(client=self.client, operation_name=create_feature_view_operation.operation.name)
