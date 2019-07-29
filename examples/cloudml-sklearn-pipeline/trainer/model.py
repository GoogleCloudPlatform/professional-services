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

"""ML model definitions."""

from sklearn import ensemble
from sklearn import pipeline

from trainer import metadata
from trainer import transform_config
from trainer.util import preprocess_utils, transform_utils


def _get_estimator(flags):
  """Generate ML estimator (classifier or regressor)

  Args:
    flags: (argparse.ArgumentParser), parameters passed from command-line

  Returns:

  """

  if metadata.PROBLEM_TYPE == 'classification':
    estimator_class = ensemble.RandomForestClassifier
  elif metadata.PROBLEM_TYPE == 'regression':
    estimator_class = ensemble.RandomForestRegressor
  else:
    raise ValueError(
        'The problem type is not supported: {}'.format(metadata.PROBLEM_TYPE))

  classifier = estimator_class(
      n_estimators=flags.n_estimators,
      max_depth=flags.max_depth,
      min_samples_leaf=flags.min_samples_leaf
  )

  return classifier


def get_pipeline(flags):
  """Generate ML Pipeline which include both pre-processing and model training.

  Args:
    flags: (argparse.ArgumentParser), parameters passed from command-line

  Returns:
    pipeline.Pipeline
  """
  estimator = _get_estimator(flags)
  transform_meta = transform_utils.get_transform_pipeline(
      transform_config.TRANSFORM_CONFIG)
  transformer, transformed_column_names, \
  new_numeric_columns, new_categorical_columns = transform_meta

  enriched_categorical_columns = metadata.CATEGORICAL_FEATURES \
                                 + new_categorical_columns
  enriched_numerical_columns = metadata.NUMERIC_FEATURES + new_numeric_columns

  preprocessor = preprocess_utils.get_preprocess_pipeline(
      feature_columns=transformed_column_names,
      numerical_names=enriched_numerical_columns,
      categorical_names=enriched_categorical_columns
  )

  return pipeline.Pipeline([
      ('transform', transformer),
      ('preprocess', preprocessor),
      ('estimator', estimator),
  ])
