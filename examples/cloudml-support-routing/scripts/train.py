# Copyright 2019 Google Inc. All Rights Reserved.
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
Trains a model with AutoML Tables using parameters specified in the
config. Training typically completes in one hour more than that specified
in the train budget, though compute is only charged for the budgeted time.
See https://cloud.google.com/automl-tables/docs/train for details.
"""

import logging
import sys

from google.cloud import automl_v1beta1 as automl

import utils


logging.basicConfig(level=logging.DEBUG)


def main():
  """Executes training for a model using the AutoML Tables.

  Uses parameters specified in the configuration file, including definitions
  of feature (ex. data type as categorical or numeric) as well as the
  optimization objective. See the configuration file for more details.
  """
  config_path = utils.parse_arguments(sys.argv).config_path
  config = utils.read_config(config_path)

  # Defining subconfigs explicitly for readability.
  global_config = config['global']
  model_config = config['model']

  # Create the AutoML client
  client = automl.TablesClient(
      project=global_config['destination_project_id'],
      region=global_config['automl_compute_region'],
  )

  # Specify the BigQuery dataset and training features table.
  bigquery_uri_train_table = 'bq://{}.{}.{}'.format(
      global_config['destination_project_id'],
      global_config['destination_dataset'],
      global_config['features_train_table'],
  )

  # Create the AutoML dataset for training.
  dataset = client.create_dataset(global_config['dataset_display_name'])

  # Import operation is a Long Running Operation, .result() performs a
  # synchronous wait for the import to complete before progressing.
  import_data_operation = client.import_data(
      dataset=dataset,
      bigquery_input_uri=bigquery_uri_train_table,
  )
  import_data_operation.result()

  # Update the data type and nullability.
  # Assumes fields are defined for every column.
  for column_spec_display_name, column in model_config['columns'].items():
    client.update_column_spec(
        dataset=dataset,
        column_spec_display_name=column_spec_display_name,
        type_code=column['type_code'],
        nullable=column['nullable'],
    )

  # Target column to predict, historical values will be used for prediction.
  client.set_target_column(
      dataset=dataset,
      column_spec_display_name=model_config['target_column'],
  )

  # Column to define a manual split of the dataset into "TEST" and
  # "UNASSIGNED". If value of the data split column is "UNASSIGNED",
  # AutoML Tables automatically assigns that row to the training or
  # validation set.
  client.set_test_train_column(
      dataset=dataset,
      column_spec_display_name=model_config['split_column'],
  )

  # Tunes and trains model, expect a ~ 1 hour overhead in addition to the time
  # allowed by the training budget. Stops tuning early if no further
  # improvements are made.
  create_model_response = client.create_model(
      model_display_name=global_config['model_display_name'],
      dataset=dataset,
      train_budget_milli_node_hours=(
          1000 * model_config['train_budget_hours']),
      exclude_column_spec_names=model_config['exclude_columns'],
  )
  create_model_response.result()


if __name__ == '__main__':
  main()
