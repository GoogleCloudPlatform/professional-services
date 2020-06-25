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
"""Runs SQL queries to create BigQuery tables for training and prediction."""

import logging
import os
import sys
import utils


logging.basicConfig(level=logging.DEBUG)


def main():
  """Runs queries to create training and prediction tables from clean data."""

  # Load config shared by all steps of feature creation.
  config_path = utils.parse_arguments(sys.argv).config_path
  config = utils.read_config(config_path)
  # Project-wide config.
  global_config = config['global']
  # Path to SQL files.
  queries_path = config['file_paths']['queries']
  # SQL files for different pipeline steps.
  query_files = config['query_files']
  # Parameters unique to individual pipeline steps.
  query_params = config['query_params']

  # Create the dataset to hold data for the pipeline run.
  utils.create_dataset(
      destination_project=global_config['destination_project_id'],
      destination_dataset=global_config['destination_dataset'],
  )

  # Query to remove nulls from the target column (company_response_to_consumer)
  # and from complaint_narrative column.
  remove_nulls_params = utils.merge_dicts(global_config,
                                          query_params['remove_nulls'])

  utils.create_table(
      query_path=os.path.join(queries_path, query_files['remove_nulls']),
      query_params=remove_nulls_params,
      destination_project=global_config['destination_project_id'],
      destination_dataset=global_config['destination_dataset'],
      destination_table=global_config['nulls_removed_table'],
      partition_field=None,
  )

  # Query to cleanup the categories of issue, subissue, product, subproduct.
  utils.create_table(
      query_path=os.path.join(queries_path, query_files['clean_categories']),
      query_params=global_config,
      destination_project=global_config['destination_project_id'],
      destination_dataset=global_config['destination_dataset'],
      destination_table=global_config['cleaned_features_table'],
      partition_field=None,
  )

  # Query to merge the cleaned features and the table with nulls removed.
  utils.create_table(
      query_path=os.path.join(queries_path, query_files['combine_tables']),
      query_params=global_config,
      destination_project=global_config['destination_project_id'],
      destination_dataset=global_config['destination_dataset'],
      destination_table=global_config['clean_table'],
      partition_field=None,
  )

  # Query to split the clean dataset into training and prediction datasets.
  # The training dataset will be fed to the AutoML Tables for training and
  # the prediction dataset will be used for batch prediction.
  features_split_params = utils.merge_dicts(global_config,
                                            query_params['train_predict_split'])

  utils.create_table(
      query_path=os.path.join(queries_path, query_files['train_predict_split']),
      query_params=features_split_params,
      destination_project=global_config['destination_project_id'],
      destination_dataset=global_config['destination_dataset'],
      destination_table=global_config['train_predict_split'],
      partition_field=None,
  )

  # Query to create the prediction table.
  features_split_params = utils.merge_dicts(global_config,
                                            query_params['train_predict_split'])

  utils.create_table(
      query_path=os.path.join(queries_path, query_files['prediction_features']),
      query_params=features_split_params,
      destination_project=global_config['destination_project_id'],
      destination_dataset=global_config['destination_dataset'],
      destination_table=global_config['features_predict_table'],
      partition_field=None,
  )

  # Query to create the training table along with the manual split into train,
  # validation and test rows for the AutoML tables.
  features_split_params = utils.merge_dicts(global_config,
                                            query_params['train_predict_split'])

  utils.create_table(
      query_path=os.path.join(queries_path, query_files['training_features']),
      query_params=features_split_params,
      destination_project=global_config['destination_project_id'],
      destination_dataset=global_config['destination_dataset'],
      destination_table=global_config['features_train_table'],
      partition_field=None,
  )

if __name__ == '__main__':
  main()
