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

"""Executes model training and evaluation."""

import argparse
import logging
import os
import sys

import hypertune
import numpy as np
from sklearn import model_selection

from trainer import constants
from trainer import model
from trainer.util import utils


def _train_and_evaluate(pipeline, dataset, output_dir):
  """Runs model training and evaluation.

  Args:
    pipeline: (pipeline.Pipeline), Pipeline instance, assemble pre-processing
      steps and model training
    dataset: (pandas.DataFrame), DataFrame containing training data
    output_dir: (string), directory that the trained model will be exported

  Returns:
    None
  """
  x_train, y_train, x_val, y_val = utils.data_train_test_split(dataset)
  pipeline.fit(x_train, y_train)

  # Note: for now, use `cross_val_score` defaults (i.e. 3-fold)
  scores = model_selection.cross_val_score(pipeline, x_val, y_val, cv=3)

  logging.info(scores)

  # Write model and eval metrics to `output_dir`
  model_output_path = os.path.join(
      output_dir, 'model', constants.MODEL_FILE_NAME)

  metric_output_path = os.path.join(
      output_dir, 'experiment', constants.METRIC_FILE_NAME)

  utils.dump_object(pipeline, model_output_path)
  utils.dump_object(scores, metric_output_path)

  # The default name of the metric is training/hptuning/metric.
  # We recommend that you assign a custom name
  # The only functional difference is that if you use a custom name,
  # you must set the hyperparameterMetricTag value in the
  # HyperparameterSpec object in your job request to match your chosen name.
  hpt = hypertune.HyperTune()
  hpt.report_hyperparameter_tuning_metric(
      hyperparameter_metric_tag='my_metric_tag',
      metric_value=np.mean(scores),
      global_step=1000)


def run_experiment(flags):
  """Testbed for running model training and evaluation."""
  # Get data for training and evaluation

  # If BigQuery table, specify as as PROJECT_ID.DATASET.TABLE_NAME
  if len(flags.input.split('.')) == 3:
    dataset = utils.read_df_from_bigquery(
      flags.input, num_samples=flags.num_samples)
  else:
    dataset = utils.read_df_from_gcs(
      flags.input
    )

  # Get model
  pipeline = model.get_pipeline(flags)

  # Run training and evaluation
  _train_and_evaluate(pipeline, dataset, flags.job_dir)


def _parse_args(argv):
  """Parses command-line arguments."""

  parser = argparse.ArgumentParser()

  parser.add_argument(
      '--input',
      help='''Dataset to use for training and evaluation.
              Can be BigQuery table or a file (CSV).
              If BigQuery table, specify as as PROJECT_ID.DATASET.TABLE_NAME.
            ''',
      required=True,
  )

  parser.add_argument(
      '--job-dir',
      help='Output directory for exporting model and other metadata.',
      required=True,
  )

  parser.add_argument(
      '--log_level',
      help='Logging level.',
      choices=[
          'DEBUG',
          'ERROR',
          'FATAL',
          'INFO',
          'WARN',
      ],
      default='INFO',
  )

  parser.add_argument(
      '--num_samples',
      help='Number of samples to read from `input`',
      type=int,
      default=None,
  )

  parser.add_argument(
      '--n_estimators',
      help='Number of trees in the forest.',
      default=10,
      type=int,
  )

  parser.add_argument(
      '--max_depth',
      help='The maximum depth of the tree.',
      type=int,
      default=None,
  )

  parser.add_argument(
      '--min_samples_leaf',
      help='The minimum number of samples required to be at a leaf node.',
      default=1,
      type=int,
  )

  return parser.parse_args(argv)


def main():
  """Entry point."""

  flags = _parse_args(sys.argv[1:])
  logging.basicConfig(level=flags.log_level.upper())
  run_experiment(flags)


if __name__ == '__main__':
  main()
