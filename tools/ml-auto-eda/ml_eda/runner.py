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

import time
import argparse
import logging

from ml_eda.constants import c
from ml_eda.orchestration import analysis_run
from ml_eda.preprocessing import preprocessor_factory


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
      '--preprocessing_backend',
      help='Backend computation engine.',
      default=preprocessor_factory.BIGQUERY
  )
  args_parser.add_argument(
      '--parallel_thread',
      help='Number of parallel jobs run through processing backend.',
      default=10
  )
  args_parser.add_argument(
      '--job_config',
      help='Configuration file containing the description of the datasource.',
      default='./job_config.ini'
  )
  args_parser.add_argument(
      '--generate_job_config',
      help='Indicates whether the job config file should be '
           'regenerated from the datasource.',
      default=False
  )
  args_parser.add_argument(
      '--target_name',
      help='Name of the target attribute. This should only specified if '
           '`generate_job_config` flag is True. Otherwise, the value specified'
           'in `job_config` file will be used.',
      default='Null'
  )
  args_parser.add_argument(
      '--target_type',
      help='Data type of the target attribute. This should only specified if '
           '`generate_job_config` flag is True. Otherwise, the value will'
           'be derived based on `job_config` file configurations.',
      choices=['Categorical', 'Numerical', 'Null'],
      default='Null'
  )
  args_parser.add_argument(
      '--report_path',
      default='./',
      help='Path for storing generated report.'
  )
  args_parser.add_argument(
      '--add_config_to_report',
      default=True,
      help='Indicates whether add job config to the end of generated report.'
  )
  args_parser.add_argument(
      '--export_result',
      default=True,
      help='Indicates whether export analysis results.'
  )
  args_parser.add_argument(
      '--sampling_rate',
      default=0.05,
      help='Sampling rate for statistical test'
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

  s = time.perf_counter()
  analysis = analysis_run.AnalysisRun(config_params)
  analysis.run_exploratory_data_analysis()
  elapsed = time.perf_counter() - s
  logging.info(f"Execution takes {elapsed:0.2f} seconds.")


if __name__ == '__main__':
  main()
