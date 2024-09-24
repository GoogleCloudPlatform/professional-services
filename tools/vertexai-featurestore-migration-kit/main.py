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
import os
import json

from legacy_exporter import LegacyExporter
from feature_store_importer import FeatureStoreImporter
from online_store_creator import FeatureOnlineStore
from logging_config import configure_logging
from logging_config import logger
from utils import transform_json

PROJECT_ROOT = os.path.abspath(os.path.dirname(__file__))
ONLINE_STORE_CONFIG_FILE = os.path.join(PROJECT_ROOT, 'config', 'online_store_config.json')


def read_json_config(config_file):
    """
    Reads a JSON configuration file.

    Args:
        config_file (str): Path to the JSON configuration file.

    Returns:
        dict: The configuration data loaded from the file.
    """
    with open(config_file, 'r', encoding="utf-8") as f:
        data = json.load(f)
    return data


def main():
    """
    Main function to orchestrate the Vertex AI Feature Store migration process.
    """

    # Initialize logger
    configure_logging()

    # Export legacy feature store
    legacy_exporter = LegacyExporter()
    export_response = legacy_exporter.export_feature_store()

    # Import into feature store 2.0
    feature_store_importer = FeatureStoreImporter()
    feature_store_importer.import_features(data=export_response)

    # Generate Intermediate Online FS serving config file
    transformed_config = transform_json(export_response)
    with open(ONLINE_STORE_CONFIG_FILE, "w", encoding="utf-8") as f:
        json.dump(transformed_config, f)

    # Read Online Store config File
    online_store_config = read_json_config(ONLINE_STORE_CONFIG_FILE)

    # Create Online Stores & Feature Views
    for online_store_config_obj in online_store_config["online_stores"]:
        online_store_obj = FeatureOnlineStore(online_store_config_obj=online_store_config_obj,
                                              project_id=online_store_config["project_id"],
                                              region=online_store_config["region"])
        try:
            online_store_obj.create_feature_online_store()
        except ValueError as e:
            logger.error(f"Error creating online store: {e}")
            continue
        online_store_obj.create_feature_views_from_feature_groups()


if __name__ == "__main__":
    main()
