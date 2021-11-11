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
"""Provide utility functions to load exported analysis results.

Can also test the function by running from the top level folder
python3 -m ml_eda.result_loader --result_file <file_path>

"""

from __future__ import absolute_import
from __future__ import print_function

from typing import Text, Dict
import logging
import argparse
import pickle

from google.protobuf.json_format import ParseDict

from ml_eda.proto import analysis_entity_pb2

Analysis = analysis_entity_pb2.Analysis


def load_analysis_result(result_path: Text) -> Dict[Text, Analysis]:
  """Utility function to load exported analysis result back to the format of
  {analysis_name: analysis_protobuf_object}

  This function can be potentially used individually for people want to play
  with the analysis result.

  Args:
    result_path: path of the export file

  Returns:
    Restored result.
  """
  with open(result_path, 'rb') as f:
    result = pickle.load(f)

  for analysis_name in result:
    analysis = Analysis()
    result[analysis_name] = ParseDict(result[analysis_name], analysis)

  return result


def initialise_parameters(args_parser: argparse.ArgumentParser
                          ) -> argparse.ArgumentParser:
  """Initialize the data extraction parameters.

  Define the arguments with the default values and parses the arguments
  passed to the main program.

  Args:
      args_parser: (argparse.ArgumentParser)
  """
  args_parser.add_argument(
      '--result_file',
      default=None
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
  result = load_analysis_result(config_params.result_file)
  print(result)


if __name__ == '__main__':
  main()
