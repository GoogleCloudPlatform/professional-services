#!/usr/bin/env python3
# -*- coding: utf-8 -*-

# Copyright 2023 Google. This software is provided as-is, without warranty or
# representation for any use or purpose. Your use of it is subject to your
# agreement with Google.
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
"""
The script is created to ease the bulk query translation with dwh migration tool
and also validates the generated configuration json/yaml files
"""

import argparse
import logging
from config_generator.util.csv_yaml_parser import CsvToYaml
from config_generator.util.csv_json_parser import CsvToJson
from config_generator.util.utils import read_yaml

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("ConfigGenerator")


def get_args() -> argparse.Namespace:
    """
    Parse the command-line arguments

    Raises:
        argparse.ArgumentError: If the required argument `conf_prep_path` is not provided
    """
    parser = argparse.ArgumentParser(description='Configuration Processor')
    parser.add_argument('-c', '--conf_prep_path', help='conf_prep_path', required=True)

    return parser.parse_args()


def main() -> None:
    """
    This function generates atr conf or object name mapping json based on the input provided
    """
    args = get_args()
    conf = read_yaml(args.conf_prep_path)
    logger.info("Input arguments: %s %s", args, conf)

    # Create a mapping of configuration types to objects and their methods
    conf_generator = {
        "object_mapping": (CsvToJson, "generate_object_mapping", "json"),
        "ATR_mapping": (CsvToYaml, "generate_atr_conf", "yaml")
    }

    # Source type validation
    source = conf.get('source')
    if not source:
        raise ValueError("Invalid or missing `source` attribute in the provided input config. "
                         "Supported values are [hive, teradata, redshift]")

    # Loop through the input configurations
    for conf_type, input_file_path in conf['input'].items():
        # Get the corresponding object and method for generating the configuration
        obj_class, method_name, output_extension = conf_generator[conf_type]

        # Generate the output file path based on the configuration type and output extension
        output_file_path = f"{conf['output']}{conf_type}.{output_extension}"

        # Instantiate the object with required params
        obj = obj_class(source=source,
                        input_file_path=input_file_path,
                        output_file_path=output_file_path)

        # Call the method
        getattr(obj, method_name)()
