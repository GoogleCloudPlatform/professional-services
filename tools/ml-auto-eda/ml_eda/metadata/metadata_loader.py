# Copyright 2019 Google Inc. All Rights Reserved.
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#      http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.
# ==============================================================================

"""Module help create MetadataDef from either file or BigQuery table directly"""

from __future__ import absolute_import
from __future__ import print_function

import os
import logging
import configparser
import argparse

from ml_eda.constants import c
from ml_eda.datasources.bigquery import bq_client
from ml_eda.metadata import metadata_definition

def _generate_metadata_from_bq_table(
    config_params: argparse.ArgumentParser):
  """Generate metadata.ini from BigQuery table directly with configurations
  filled with default values

  Args:
      config_params: (argparse.ArgumentParser)

  Returns:
    None
  """
  # pylint: disable-msg=logging-format-interpolation
  logging.info(
      'Reading schema of the BQ table : {}'.format(config_params.bq_table))

  bigquery_client = bq_client.BqClient(key_file=config_params.key_file)
  columns = bigquery_client.get_table_columns(config_params.bq_table)

  # Data source information
  config = configparser.ConfigParser()
  config[c.metadata.DATASOURCE] = dict()
  config[c.metadata.DATASOURCE][
      c.metadata.datasource.TYPE] = c.datasources.BIGQUERY
  config[c.metadata.DATASOURCE][
      c.metadata.datasource.LOCATION] = config_params.bq_table

  # Table schema
  config[c.metadata.SCHEMA] = dict()

  numerical_attributes = list()
  categorical_attributes = list()
  name_type_buffer = dict()
  # Parse numerical and categorical attributes from the schema
  for column in columns:
    name_type_buffer[column.name] = column.field_type
    if column.field_type in c.bigquery.types.NUMERICAL_TYPES:
      numerical_attributes.append(column.name)
    elif column.field_type in c.bigquery.types.CATEGORICAL_TYPES:
      categorical_attributes.append(column.name)
    else:
      logging.warning(
          'BigQuery column {} of type {} not supported! It is excluded '
          'from the analysis'.format(column.name, column.field_type))

  all_attributes = numerical_attributes + categorical_attributes
  if config_params.target_name in all_attributes:
    config[c.metadata.SCHEMA][
        c.metadata.schema.TARGET] = config_params.target_name

    # Adjust for the case of classification on integer target
    if config_params.ml_type == c.metadata.ml_type.CLASSIFICATION \
        and name_type_buffer[
            config_params.target_name] == c.bigquery.type.INTEGER:
      numerical_attributes.remove(config_params.target_name)
      categorical_attributes.append(config_params.target_name)
  else:
    config[c.metadata.SCHEMA][
        c.metadata.schema.TARGET] = c.metadata.schema.NULL

  config[c.metadata.SCHEMA][c.metadata.schema.NUMERICAL_FEATURES] = ','.join(
      numerical_attributes)
  config[c.metadata.SCHEMA][
      c.metadata.schema.CATEGORICAL_FEATURES] = ','.join(
          categorical_attributes)

  # Running configuration with default value
  # Descriptive analysis will always run, for remainings, only correlation
  # and information gain will run by default
  config[c.metadata.ANALYSIS_RUN] = dict()
  config[c.metadata.ANALYSIS_RUN][
      c.metadata.analysis_run.CONTINGENCY_TABLE_RUN] = 'False'
  config[c.metadata.ANALYSIS_RUN][
      c.metadata.analysis_run.TABLE_DESCRIPTIVE_RUN] = 'False'
  config[c.metadata.ANALYSIS_RUN][
      c.metadata.analysis_run.PEARSON_CORRELATION_RUN] = 'True'
  config[c.metadata.ANALYSIS_RUN][
      c.metadata.analysis_run.INFORMATION_GAIN_RUN] = 'True'
  config[c.metadata.ANALYSIS_RUN][
      c.metadata.analysis_run.CHI_SQUARE_RUN] = 'False'
  config[c.metadata.ANALYSIS_RUN][c.metadata.analysis_run.ANOVA_RUN] = 'False'

  # Analysis configuration
  config[c.metadata.ANALYSIS_CONFIG] = dict()
  config[c.metadata.ANALYSIS_CONFIG][
      c.metadata.analysis_config.HISTOGRAM_BIN] = '20'
  config[c.metadata.ANALYSIS_CONFIG][
      c.metadata.analysis_config.VALUE_COUNTS_LIMIT] = '10'
  config[c.metadata.ANALYSIS_CONFIG][
      c.metadata.analysis_config.GENERAL_CARDINALITY_LIMIT] = '15'

  # Write the generated metadata to metadata.ini
  logging.info(
      'Writing BigQuery metadata to file: {}'.format(config_params.metadata))
  with open(config_params.metadata, 'w') as metadata_file:
    config.write(metadata_file)


def _generate_metadata_from_datasource(config_params: argparse.ArgumentParser):
  """Generate metadata file from data source."""
  if config_params.data_source == c.datasources.BIGQUERY:
    _generate_metadata_from_bq_table(config_params)
  else:
    raise ValueError('Data source type {} not supported yet.'.format(
        config_params.data_source))


def _load_metadate_from_ini(
    config_file: str) -> metadata_definition.MetadataDef:
  """Load the datasource definition from the metadata file."""

  # pylint: disable-msg=logging-format-interpolation
  if not os.path.exists(config_file):
    raise FileNotFoundError(
        'The config file: {}, cannot be found'.format(config_file))

  logging.info('Parsing config file: {}'.format(config_file))
  config = configparser.ConfigParser()
  config.read(config_file)

  datasource_type = config[c.metadata.DATASOURCE][c.metadata.datasource.TYPE]
  datasource_location = config[c.metadata.DATASOURCE][
      c.metadata.datasource.LOCATION]
  target_column = config[c.metadata.SCHEMA][c.metadata.schema.TARGET]
  numerical_features = config[c.metadata.SCHEMA][
      c.metadata.schema.NUMERICAL_FEATURES].split(',')
  categorical_features = config[c.metadata.SCHEMA][
      c.metadata.schema.CATEGORICAL_FEATURES].split(',')
  analysis_run_ops = config[c.metadata.ANALYSIS_RUN]
  analysis_run_config = config[c.metadata.ANALYSIS_CONFIG]

  return metadata_definition.MetadataDef(
      datasource_type=datasource_type,
      datasource_location=datasource_location,
      target_column=target_column,
      numerical_attributes=numerical_features,
      categorical_attributes=categorical_features,
      analysis_run_ops=analysis_run_ops,
      analysis_run_config=analysis_run_config)


def load_metadata_def(
    config_params: argparse.ArgumentParser
) -> metadata_definition.MetadataDef:
  """Load the datasource and configurations definition."""
  if config_params.generate_metadata:
    _generate_metadata_from_datasource(config_params)
  return _load_metadate_from_ini(config_params.metadata)
