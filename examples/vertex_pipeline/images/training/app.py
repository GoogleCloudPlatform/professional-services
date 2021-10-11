# Copyright 2021 Google LLC. All Rights Reserved.
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

"""Model training program."""

from typing import Dict, Tuple, Optional, List, Iterable

import argparse
import datetime
import json
import logging
import os

import yaml
import tensorflow as tf
import numpy as np
import lightgbm as lgb
import pandas as pd
from google.cloud import aiplatform_v1beta1 as aip
from sklearn import metrics as sk_metrics
from sklearn import model_selection

logging.getLogger().setLevel(logging.INFO)

################################################################################
# Model serialization code
################################################################################

MODEL_FILENAME = 'model.txt'
FEATURE_IMPORTANCE_FILENAME = 'feature_importance.csv'
INSTANCE_SCHEMA_FILENAME = 'instance_schema.yaml'
PROB_THRESHOLD = 0.5


def _save_lgb_model(model: lgb.Booster, model_store: str):
  """Export trained lgb model."""
  file_path = os.path.join(model_store, MODEL_FILENAME)
  model.save_model(MODEL_FILENAME)
  tf.io.gfile.copy(MODEL_FILENAME, file_path, overwrite=True)


def _save_lgb_feature_importance(model: lgb.Booster, model_store: str):
  """Export feature importance info of trained lgb model."""
  file_path = os.path.join(model_store, FEATURE_IMPORTANCE_FILENAME)
  # Pandas can save to GCS directly
  pd.DataFrame(
      {
          'feature': model.feature_name(),
          'importance': model.feature_importance()
      }
  ).to_csv(file_path, index=False)


def _save_metrics(metrics: dict, output_path: str):
  """Export the metrics of trained lgb model."""
  with tf.io.gfile.GFile(output_path, 'w') as eval_file:
    eval_file.write(json.dumps(metrics))


def _save_analysis_schema(df: pd.DataFrame, model_store: str):
  """Export instance schema for model monitoring service."""
  file_path = os.path.join(model_store, INSTANCE_SCHEMA_FILENAME)
  # create feature schema
  properties = {}
  types_info = df.dtypes

  for i in range(len(types_info)):
    if types_info.values[i] == object:
      properties[types_info.index[i]] = {'type': 'string', 'nullable': True}
    else:
      properties[types_info.index[i]] = {'type': 'number', 'nullable': True}

  spec = {
      'type': 'object',
      'properties': properties,
      'required': df.columns.tolist()
  }

  with tf.io.gfile.GFile(file_path, 'w') as file:
    yaml.dump(spec, file)


################################################################################
# Data loading
################################################################################

def _split_features_label_columns(df: pd.DataFrame,
                                  target_label: str
                                  ) -> Tuple[pd.DataFrame, pd.DataFrame]:
  """Split dataset into features and target."""
  y = df[target_label]
  x = df.drop(target_label, axis=1)

  return x, y


def load_csv_dataset(data_uri_pattern: str,
                     target_label: str,
                     features: List[str],
                     data_schema: Optional[str] = None
                     ) -> Tuple[pd.DataFrame, pd.DataFrame]:
  """Load CSV data into features and label DataFrame."""
  all_files = tf.io.gfile.glob(data_uri_pattern)

  if data_schema:
    # [[name, dtype],]
    fields = dict(field.split(':') for field in data_schema.split(';'))
    field_names = fields.keys()
    df = pd.concat((pd.read_csv('gs://' + f, names=field_names, dtype=fields)
                    for f in all_files), ignore_index=True)
  else:
    df = pd.concat((pd.read_csv('gs://' + f)
                    for f in all_files), ignore_index=True)
  # Shuffle
  df = df.sample(frac=1).reset_index(drop=True)

  logging.info(df.head(2))

  x, y = _split_features_label_columns(df, target_label)
  if features:
    x = x[features.split(',')]

  return x, y


################################################################################
# Model training
################################################################################


def _evaluate_binary_classification(model: lgb.Booster,
                                    x: pd.DataFrame,
                                    y: pd.DataFrame) -> Dict[str, object]:
  """Perform evaluation of binary classification model."""
  # get roc curve metrics, down sample to avoid hitting MLMD 64k size limit
  roc_size = int(x.shape[0] * 1 / 3)
  y_hat = model.predict(x)
  pred = (y_hat > PROB_THRESHOLD).astype(int)

  fpr, tpr, thresholds = sk_metrics.roc_curve(
      y_true=y[:roc_size], y_score=y_hat[:roc_size], pos_label=True)

  # get classification metrics
  au_roc = sk_metrics.roc_auc_score(y, y_hat)
  au_prc = sk_metrics.average_precision_score(y, y_hat)
  classification_metrics = sk_metrics.classification_report(
      y, pred, output_dict=True)
  confusion_matrix = sk_metrics.confusion_matrix(y, pred, labels=[0, 1])

  metrics = {
      'classification_report': classification_metrics,
      'confusion_matrix': confusion_matrix.tolist(),
      'au_roc': au_roc,
      'au_prc': au_prc,
      'fpr': fpr.tolist(),
      'tpr': tpr.tolist(),
      'thresholds': thresholds.tolist()
  }

  logging.info('The evaluation report: {}'.format(metrics))

  return metrics


def lgb_training(lgb_train: lgb.Dataset,
                 lgb_val: lgb.Dataset,
                 num_boost_round: int,
                 num_leaves: int,
                 max_depth: int,
                 min_data_in_leaf: int) -> lgb.Booster:
  """Train lgb model given datasets and parameters."""
  # train the model
  params = {
      'objective': 'binary',
      'is_unbalance': True,
      'boosting_type': 'gbdt',
      'metric': ['auc'],
      'num_leaves': num_leaves,
      'max_depth': max_depth,
      'min_data_in_leaf': min_data_in_leaf
  }

  eval_results = {}  # to record eval results
  model = lgb.train(params=params,
                    num_boost_round=num_boost_round,
                    train_set=lgb_train,
                    valid_sets=[lgb_val, lgb_train],
                    valid_names=["test", "train"],
                    evals_result=eval_results,
                    verbose_eval=True)

  return model


################################################################################
# Hyperparameter tuning using Vertex Vizier.
################################################################################

def _get_trial_parameters(trial: aip.Trial,
                          target_parameters: Iterable[str]
                          ) -> Dict[str, int]:
  """Extract vizier trial id."""
  target_params = set(target_parameters)
  param_values = {}

  for param in trial.parameters:
    if param.parameter_id in target_params:
      param_values[param.parameter_id] = int(param.value)

  return param_values


def _create_lgb_study(vizier_client: aip.VizierServiceClient,
                      args: argparse.Namespace,
                      metric: str = 'auc',
                      goal: str = 'MAXIMIZE') -> aip.Study:
  """Creat a vizier study."""
  study_display_name = '{}_study_{}'.format(
      args.hp_config_gcp_project_id.replace('-', ''),
      datetime.datetime.now().strftime('%Y%m%d_%H%M%S'))
  parent = 'projects/{}/locations/{}'.format(args.hp_config_gcp_project_id,
                                             args.hp_config_gcp_region)

  param_num_leaves = {
      'parameter_id': 'num_leaves',
      'integer_value_spec': {
          'min_value': int(args.num_leaves_hp_param_min),
          'max_value': int(args.num_leaves_hp_param_max)
      }
  }

  param_max_depth = {
      'parameter_id': 'max_depth',
      'integer_value_spec': {
          'min_value': int(args.max_depth_hp_param_min),
          'max_value': int(args.max_depth_hp_param_max)
      }
  }

  # Objective Metric
  obj_metric = {
      'metric_id': metric,
      'goal': goal
  }

  # Create study using define parameter and metric
  study_spec = {
      'display_name': study_display_name,
      'study_spec': {
          'parameters': [
              param_num_leaves,
              param_max_depth,
          ],
          'metrics': [obj_metric],
      }
  }

  logging.info(f'Vizier study spec {study_spec}')

  # Create study
  return vizier_client.create_study(parent=parent, study=study_spec)


def conduct_vizier_trials(
    args: argparse.Namespace,
    lgb_train: lgb.Dataset,
    lgb_val: lgb.Dataset,
    x_test: pd.DataFrame,
    y_test: pd.DataFrame,
    target_parameters: Iterable[str] = ('num_leaves', 'max_depth')
) -> Dict[str, int]:
  """Execute a vizier study."""
  logging.info(f'Commencing Vizier study')

  endpoint = args.hp_config_gcp_region + '-aiplatform.googleapis.com'
  # Define Vizier client
  vizier_client = aip.VizierServiceClient(
      client_options=dict(api_endpoint=endpoint))

  vizier_study = _create_lgb_study(vizier_client, args)
  vizier_study_id = vizier_study.name

  logging.info(f'Vizier study name: {vizier_study_id}')

  # Conduct training trials using Vizier generated params
  client_id = "shareholder_training_job"
  suggestion_count_per_request = int(args.hp_config_suggestions_per_request)
  max_trial_id_to_stop = int(args.hp_config_max_trials)

  trial_id = 0
  while int(trial_id) < max_trial_id_to_stop:
    suggest_response = vizier_client.suggest_trials(
        {
            "parent": vizier_study_id,
            "suggestion_count": suggestion_count_per_request,
            "client_id": client_id,
        }
    )

    for suggested_trial in suggest_response.result().trials:
      trial_id = suggested_trial.name.split("/")[-1]
      trial = vizier_client.get_trial({"name": suggested_trial.name})

      logging.info(f'Vizier trial start {trial_id}')

      if trial.state in ["COMPLETED", "INFEASIBLE"]:
        continue

      param_values = _get_trial_parameters(
          trial, target_parameters=target_parameters)

      model = lgb_training(
          lgb_train, lgb_val,
          num_boost_round=int(args.num_boost_round),
          min_data_in_leaf=int(args.min_data_in_leaf),
          **param_values)

      # Get model evaluation metrics
      metrics = _evaluate_binary_classification(model, x_test, y_test)

      # Log measurements back to vizier
      vizier_client.add_trial_measurement(
          {
              "trial_name": suggested_trial.name,
              "measurement": {
                  'metrics': [{'metric_id': 'auc', 'value': metrics['au_roc']}]
              },
          }
      )

      # Complete the Vizier trial
      vizier_client.complete_trial(
          {"name": suggested_trial.name, "trial_infeasible": False}
      )

      logging.info(f'Vizier trial completed {trial_id}')

  # Get the optimal trail with the best ROC AUC
  optimal_trials = vizier_client.list_optimal_trials(
      {"parent": vizier_study_id})

  # Extract best hyperparams from best trial
  best_param_values = _get_trial_parameters(
      optimal_trials.optimal_trials[0],
      target_parameters=target_parameters)

  return best_param_values


################################################################################
# Main Logic.
################################################################################

def train(args: argparse.Namespace):
  """The main training logic."""

  if 'AIP_MODEL_DIR' not in os.environ:
    raise KeyError(
        'The `AIP_MODEL_DIR` environment variable has not been set. '
        'See https://cloud.google.com/ai-platform-unified/docs/tutorials/image-recognition-custom/training'
    )
  output_model_directory = os.environ['AIP_MODEL_DIR']

  logging.info(f'AIP_MODEL_DIR: {output_model_directory}')
  logging.info(f'training_data_uri: {args.training_data_uri}')
  logging.info(f'metrics_output_uri: {args.metrics_output_uri}')

  # prepare the data
  x_train, y_train = load_csv_dataset(
      data_uri_pattern=args.training_data_uri,
      data_schema=args.training_data_schema,
      target_label=args.label,
      features=args.features)

  # validation data
  x_train, x_val, y_train, y_val = model_selection.train_test_split(
      x_train,
      y_train,
      test_size=0.2,
      random_state=np.random.RandomState(42))

  # test data
  x_val, x_test, y_val, y_test = model_selection.train_test_split(
      x_val,
      y_val,
      test_size=0.5,
      random_state=np.random.RandomState(42))

  lgb_train = lgb.Dataset(x_train, y_train, categorical_feature="auto")
  lgb_val = lgb.Dataset(x_val, y_val, categorical_feature="auto")

  if args.perform_hp:
    # Conduct Vizier trials a.k.a. hyperparameter tuning
    # prior to main training activity
    best_param_values = conduct_vizier_trials(
        args=args,
        lgb_train=lgb_train,
        lgb_val=lgb_val,
        x_test=x_test,
        y_test=y_test)
    logging.info(f'Vizier returned params: {best_param_values}')
  else:
    best_param_values = {
        'num_leaves': int(args.num_leaves_hp_param_min +
                       args.num_leaves_hp_param_max) // 2,
        'max_depth': int(args.max_depth_hp_param_min +
                      args.max_depth_hp_param_max) // 2
    }

  model = lgb_training(
      lgb_train=lgb_train,
      lgb_val=lgb_val,
      num_boost_round=int(args.num_boost_round),
      min_data_in_leaf=int(args.min_data_in_leaf),
      **best_param_values)

  # save the generated model
  _save_lgb_model(model, output_model_directory)
  _save_lgb_feature_importance(model, output_model_directory)
  _save_analysis_schema(x_train, output_model_directory)

  # save eval metrics
  metrics = _evaluate_binary_classification(model, x_test, y_test)
  if args.metrics_output_uri:
    _save_metrics(metrics, args.metrics_output_uri)


if __name__ == '__main__':
  parser = argparse.ArgumentParser()
  # For training data
  parser.add_argument('--training_data_uri', type=str,
                      help='The training dataset location in GCS.')
  parser.add_argument('--training_data_schema', type=str, default='',
                      help='The schema of the training dataset. The'
                           'example schema: name:type;')
  parser.add_argument('--features', type=str, default='',
                      help='The column names of features to be used.')
  parser.add_argument('--label', type=str, default='',
                      help='The column name of label in the dataset.')

  parser.add_argument('--metrics_output_uri', type=str,
                      help='The GCS artifact URI to write model metrics.')
  # For model hyperparameter
  parser.add_argument('--min_data_in_leaf', default=5, type=float,
                      help='Minimum number of observations that must '
                           'fall into a tree node for it to be added.')
  parser.add_argument('--num_boost_round', default=300, type=float,
                      help='Number of boosting iterations.')
  parser.add_argument('--max_depth_hp_param_min', default=-1, type=float,
                      help='Max tree depth for base learners, <=0 means no '
                           'limit. Min value for hyperparam param')
  parser.add_argument('--max_depth_hp_param_max', default=4, type=float,
                      help='Max tree depth for base learners, <=0 means no '
                           'limit.  Max value for hyperparam param')
  parser.add_argument('--num_leaves_hp_param_min', default=6, type=float,
                      help='Maximum tree leaves for base learners. '
                           'Min value for hyperparam param.')
  parser.add_argument('--num_leaves_hp_param_max', default=10, type=float,
                      help='Maximum tree leaves for base learners. '
                           'Max value for hyperparam param.')
  # For hyperparameter tuning with Vizer
  parser.add_argument('--perform_hp', action='store_true', default=False,
                      help='Specify whether to perform hyperparameter tuning.')
  parser.add_argument('--hp_config_max_trials', default=20, type=float,
                      help='Maximum number of hyperparam tuning trials.')
  parser.add_argument('--hp_config_suggestions_per_request',
                      default=5, type=float,
                      help='Suggestions per vizier request')
  parser.add_argument('--hp_config_gcp_region', default='asia-east1', type=str,
                      help='Vizier GCP Region. Data or model no passed to '
                           'vizier. Simply tuning config.')
  parser.add_argument('--hp_config_gcp_project_id',
                      default='woven-rush-197905', type=str,
                      help='GCP project id.')

  logging.info(parser.parse_args())
  args, _ = parser.parse_known_args()
  train(args)
