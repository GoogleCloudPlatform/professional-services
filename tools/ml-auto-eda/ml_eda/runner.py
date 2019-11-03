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

"""Entry point for the tool"""

from __future__ import absolute_import
from __future__ import print_function

import argparse
import logging

from ml_eda.constants import c
from ml_eda.orchestration import analysis_run


def initialise_parameters(args_parser: argparse.ArgumentParser
                          ) -> argparse.ArgumentParser:
  """Initialize the data extraction parameters.

  Define the arguments with the default values and parses the arguments
  passed to the main program.

  Args:
      args_parser: (argparse.ArgumentParser)
  """
  args_parser.add_argument(
      '--key_file',
      help='Key file of the service account used to '
           'authenticate to the BigQuery API.',
      default=None
  )
  args_parser.add_argument(
      '--data_source',
      help='Type of data source containing the training data.',
      default=c.datasources.BIGQUERY
  )
  args_parser.add_argument(
      '--bq_table',
      help='BigQuery table name.',
      default='bigquery-public-data.ml_datasets.census_adult_income'
  )
  args_parser.add_argument(
      '--target_name',
      help='Name of the target attribute.',
      default='Null'
  )
  args_parser.add_argument(
      '--ml_type',
      help='Type of machine learning problem',
      choices=['Regression', 'Classification', 'Null'],
      default='Null'
  )
  args_parser.add_argument(
      '--preprocessing_backend',
      help='Backend computation engine.',
      default=c.preprocessing.BIGQUERY
  )
  args_parser.add_argument(
      '--metadata',
      help='Configurtion file containing the description of the datasource.',
      default='./metadata.ini'
  )
  args_parser.add_argument(
      '--generate_metadata',
      help='Indicates whether the medata file should be '
           'regenerated from the datasource.',
      default=False
  )
  args_parser.add_argument(
      '--report_path',
      default='./report.md',
      help='Path for storing generated report'
  )

  args_params = args_parser.parse_args()
  logging.info('Parameters:')
  logging.info(args_params)
  return args_params


def main():
  """Load parameters and run the main EDA loop."""
  logging.basicConfig(
      format='%(asctime)-15s:%(levelname)s:%(module)s:%(message)s',
      level=logging.INFO)
  args_parser = argparse.ArgumentParser()
  config_params = initialise_parameters(args_parser)
  analysis = analysis_run.Run(config_params)
  analysis.run_exploratory_data_analysis()


if __name__ == '__main__':
  main()
