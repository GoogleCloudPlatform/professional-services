# Copyright 2020 Google Inc. All Rights Reserved.
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
"""Supporting methods for the classification pipeline."""

import argparse
from typing import Any, Dict, List
import yaml

from google.cloud import bigquery


def parse_arguments(argv):
  """Parses command line arguments common across scripts."""
  parser = argparse.ArgumentParser(description='Configuration options..')
  parser.add_argument(
      '--config_path',
      required=True,
      type=str,
      help='YAML file with project configuration.')
  args, _ = parser.parse_known_args(args=argv[1:])
  return args


def merge_dicts(a: Dict[str, Any], b: Dict[str, Any]) -> Dict[str, Any]:
  """Return the union of two dicts, raise an error if keys are non-unique."""
  # Resolve None types.
  if a is None:
    if b is None:
      return {}
    return b
  if b is None:
    return a

  duplicate_keys = set(a.keys()).intersection(set(b.keys()))
  if duplicate_keys:
    duplicate_keys_string = ", ".join(duplicate_keys)
    raise KeyError("The following keys are non-unique: {}".format(
        duplicate_keys_string))

  return {**a, **b}


def read_config(config_path: str,
                subconfig_keys: List[str] = None) -> Dict[str, Any]:
  """Reads from a YAML config file to generate a dict of parameters.

  Args:
    config_path: Path to YAML config file.
    subconfig_keys: List of keys for subconfigs (second level) to extract.
        None will return the top level.

  Returns:
    Dict of parameters, which may have a nested structure if
        subconfig_keys is None.

  Raises:
    KeyError if any keys are repeated across the subconfigs when merging.
    KeyError if any of the subconfig keys are not in the config.
  """

  with open(config_path, 'r') as f:
    config = yaml.safe_load(f)

  # Return full nested config if no subconfigs are specified.
  if not subconfig_keys:
    return config

  # Merge all specified subconfigs into a single config.
  merged_config = {}
  for subconfig_key in subconfig_keys:
    subconfig = config.get(subconfig_key)
    if not subconfig:
      raise KeyError('Key "{}" does not exist.'.format(subconfig_key))
    merged_config = merge_dicts(merged_config, subconfig)

  return merged_config


def create_dataset(destination_project: str, destination_dataset: str) -> str:
  """Creates a Bigquery dataset.

  Args:
    destination_project: GCS project to create the dataset in.
    destination_dataset: Bigquery dataset to create.

  Uses application default credentials.
  Raises google.api_core.exceptions.Conflict if the dataset already exists.
  """

  # Create dataset in Bigquery.
  client = bigquery.Client()
  dataset_id = '{}.{}'.format(destination_project,
                              destination_dataset)
  dataset_ref = bigquery.Dataset(dataset_id)
  result = client.create_dataset(dataset_ref)

  return result


def create_table(
    query_path: str,
    query_params: Dict[str, Any],
    destination_project: str,
    destination_dataset: str,
    destination_table: str,
    partition_field: str) -> str:
  """Creates a Bigquery table from a parameterized .sql file.

  This method executes sql files with {named} parameters and writes the
  query output to a new BigQuery table. The parameters are passed in a
  dict (query_params) where a key is the name of the parameter and
  the value is substituted in place of the named parameter.

  In this project, we create the parameter dict by combining different
  different sections of the config file. This eliminates the need to
  specify reused parameters for each query that needs that parameter, but
  means that most parameter dicts passed to this method have parameters
  available that are unused. Additionally, there is a risk of key collisons,
  which is handled by merge_dicts.

  Uses application default credentials.

  Args:
    query_path: Path to .sql query file with optional {format}-style parameters.
    query_params: Dict of parmas to substitute into query.
    destination_project: GCS project to write to.
    destination_dataset: Bigquery dataset to write to.
    destination_table: Bigquery table to write to.
    partition_field: Field to partition table by, no partitioning if none.

  Raises:
    google.api_core.exceptions.Conflict if the table already exists.
  """

  # Read parameterized query string.
  with open(query_path, 'r') as f:
    query = f.read()

  # Separate the positional and keyword params
  query_list_params = []
  for key in query_params.keys():
    if isinstance(query_params[key], list):
      query_list_params.extend(query_params[key])

  # Formats SQL query string with query args.
  query = query.format(*query_list_params, **query_params)

  # Create table in Bigquery.
  client = bigquery.Client()
  table_id = '{}.{}.{}'.format(destination_project,
                               destination_dataset,
                               destination_table)
  table_ref = bigquery.Table(table_id)
  job_config = bigquery.QueryJobConfig()
  job_config.destination = table_ref

  if partition_field:
    job_config.time_partitioning = bigquery.TimePartitioning(
        field=partition_field)

  query_job = client.query(query, job_config=job_config)

  return query_job.result()
