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

"""Module help create JobConfig from either file or BigQuery table directly"""

from __future__ import absolute_import
from __future__ import print_function

import os
import logging
import configparser
import argparse

from ml_eda.constants import c
from ml_eda.preprocessing.preprocessors.bigquery import bq_client
from ml_eda.preprocessing.preprocessors.bigquery import bq_constants
from ml_eda.job_config_util import job_config


def _generate_job_config_from_bq_table(
    config_params: argparse.ArgumentParser):
  """Generate job_config.ini from BigQuery table directly with configurations
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
  config[c.DATASOURCE] = dict()
  config[c.DATASOURCE][c.datasource.TYPE] = c.datasources.BIGQUERY
  config[c.DATASOURCE][c.datasource.LOCATION] = config_params.bq_table

  # Table schema
  config[c.SCHEMA] = dict()

  numerical_attributes = list()
  categorical_attributes = list()
  name_type_buffer = dict()
  # Parse numerical and categorical attributes from the schema
  for column in columns:
    name_type_buffer[column.name] = column.field_type
    if column.field_type in bq_constants.NUMERICAL_TYPES:
      numerical_attributes.append(column.name)
    elif column.field_type in bq_constants.CATEGORICAL_TYPES:
      categorical_attributes.append(column.name)
    else:
      logging.warning(
          'BigQuery column {} of type {} not supported! It is excluded '
          'from the analysis'.format(column.name, column.field_type))

  all_attributes = numerical_attributes + categorical_attributes
  target_name = config_params.target_name
  if target_name in all_attributes:
    config[c.SCHEMA][c.schema.TARGET] = target_name

    # Adjust for the case of classification on integer target
    if (config_params.target_type == c.datasource.TYPE_CATEGORICAL
        and name_type_buffer[target_name] == bq_constants.INTEGER):
      numerical_attributes.remove(target_name)
      categorical_attributes.append(target_name)
  else:
    if target_name != c.schema.NULL:
      logging.warning('The specified target name {} can not be found '
                      'in the table.'.format(target_name))
    config[c.SCHEMA][c.schema.TARGET] = c.schema.NULL

  config[c.SCHEMA][c.schema.NUMERICAL_FEATURES] = ','.join(
      numerical_attributes)
  config[c.SCHEMA][c.schema.CATEGORICAL_FEATURES] = ','.join(
      categorical_attributes)

  # Running configuration with default value
  # Descriptive analysis will always run, for remainings, only correlation
  # and information gain will run by default
  config[c.ANALYSIS_RUN] = dict()
  config[c.ANALYSIS_RUN][c.analysis_run.CONTINGENCY_TABLE_RUN] = 'False'
  config[c.ANALYSIS_RUN][c.analysis_run.TABLE_DESCRIPTIVE_RUN] = 'False'
  config[c.ANALYSIS_RUN][c.analysis_run.PEARSON_CORRELATION_RUN] = 'True'
  config[c.ANALYSIS_RUN][c.analysis_run.INFORMATION_GAIN_RUN] = 'True'
  config[c.ANALYSIS_RUN][c.analysis_run.CHI_SQUARE_RUN] = 'False'
  config[c.ANALYSIS_RUN][c.analysis_run.ANOVA_RUN] = 'False'

  # Analysis configuration
  config[c.ANALYSIS_CONFIG] = dict()
  config[c.ANALYSIS_CONFIG][c.analysis_config.HISTOGRAM_BIN] = '20'
  config[c.ANALYSIS_CONFIG][c.analysis_config.VALUE_COUNTS_LIMIT] = '10'
  config[c.ANALYSIS_CONFIG][c.analysis_config.GENERAL_CARDINALITY_LIMIT] = '15'

  # Write the generated metadata to job_config.ini
  logging.info(
      'Writing BigQuery bootstrapped job configuration to file: {}'
        .format(config_params.job_config))
  with open(config_params.job_config, 'w') as job_config_file:
    config.write(job_config_file)


def _generate_job_config_from_datasource(
    config_params: argparse.ArgumentParser):
  """Generate job config file from data source."""
  if config_params.data_source == c.datasources.BIGQUERY:
    _generate_job_config_from_bq_table(config_params)
  else:
    raise ValueError('Data source type {} not supported yet.'.format(
        config_params.data_source))


def _load_job_config_from_ini(
    config_file: str) -> job_config.JobConfig:
  """Load the datasource definition from the job config file."""

  # pylint: disable-msg=logging-format-interpolation
  if not os.path.exists(config_file):
    raise FileNotFoundError(
        'The config file: {}, cannot be found'.format(config_file))

  logging.info('Parsing config file: {}'.format(config_file))
  config = configparser.ConfigParser()
  config.read(config_file)
  logging.info(config.__dict__)

  # parse data source section
  datasource_type = config[c.DATASOURCE][
    c.datasource.TYPE]
  datasource_location = config[c.DATASOURCE][
    c.datasource.LOCATION]

  # parse schema section
  target_column = config[c.SCHEMA][c.schema.TARGET]
  numerical_features = config[c.SCHEMA][
    c.schema.NUMERICAL_FEATURES].split(',')
  categorical_features = config[c.SCHEMA][
    c.schema.CATEGORICAL_FEATURES].split(',')

  # parse analysis configuration sections
  analysis_run_ops = config[c.ANALYSIS_RUN]
  analysis_run_config = config[c.ANALYSIS_CONFIG]

  return job_config.JobConfig(
      datasource_type=datasource_type,
      datasource_location=datasource_location,
      target_column=target_column,
      numerical_attributes=numerical_features,
      categorical_attributes=categorical_features,
      analysis_run_ops=analysis_run_ops,
      analysis_run_config=analysis_run_config)


def load_job_config(
    config_params: argparse.ArgumentParser
) -> job_config.JobConfig:
  """Load the datasource and configurations definition."""
  if config_params.generate_job_config:
    _generate_job_config_from_datasource(config_params)
  return _load_job_config_from_ini(config_params.job_config)
