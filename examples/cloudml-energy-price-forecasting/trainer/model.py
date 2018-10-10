#!/usr/bin/env python
#Copyright 2018 Google LLC
#
#Licensed under the Apache License, Version 2.0 (the "License");
#you may not use this file except in compliance with the License.
#You may obtain a copy of the License at
#
#     http://www.apache.org/licenses/LICENSE-2.0
#
#Unless required by applicable law or agreed to in writing, software
#distributed under the License is distributed on an "AS IS" BASIS,
#WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
#See the License for the specific language governing permissions and
#limitations under the License.
# ==============================================================================
"""Defines TensorFlow model.

  Defines features and regression model.

  Typical usage example:

  model.create_regressor(config, parameters)
"""

import math
import pickle

import tensorflow as tf
from tensorflow.python.lib.io import file_io

from constants import constants


def create_regressor(config, parameters):
    """Creates a DNN regressor.

    Defines features and builds an 'Estimator' with them.

    Args:
        config: `RunConfig` object to configure the runtime of the `Estimator`.
        parameters: Parameters passed to the job.

    Returns:
        A configured and ready to use `tf.estimator.DNNRegressor`
    """

    # Mean and Standard Deviation Constants for normalization.
    with file_io.FileIO(parameters.mean_path, mode='r') as f:
        mean = pickle.load(f)
    with file_io.FileIO(parameters.std_path, mode='r') as f:
        std = pickle.load(f)

    # Columns to be used as features.
    hour = tf.feature_column.categorical_column_with_identity(
        'hour', num_buckets=24)
    hour = tf.feature_column.embedding_column(
        hour, dimension=parameters.hour_embedding)

    day = tf.feature_column.categorical_column_with_identity(
        'day', num_buckets=7)
    day = tf.feature_column.embedding_column(
        day, dimension=parameters.day_embedding)

    weather = [tf.feature_column.numeric_column(
        'weather' + str(i),
        normalizer_fn=(lambda x, i = i: (x - mean[i]) / std[i])
    ) for i in range(constants.WEATHER_SIZE)]

    distribution = [tf.feature_column.numeric_column(
        'distribution' + str(i)
    ) for i in range(constants.DISTRIBUTION_SIZE)]

    feature_cols = [hour, day] + weather + distribution

    # Evaluation metric.
    def mean_absolute_error(labels, predictions):
        """Creates mean absolute error metric.

        Metric is used to evaluate the model.

        Args:
            labels: Evaluation true labels.
            predictions: Evaluation model predictions.

        Returns:
            A dictionary with the evaluation metric
        """
        pred_values = predictions['predictions']
        return {'mae': tf.metrics.mean_absolute_error(
            labels, pred_values)}

    layer = parameters.first_layer_size
    lfrac = parameters.layer_reduction_fraction
    nlayers = parameters.number_layers
    h_units = [layer]
    for _ in range(nlayers - 1):
        h_units.append(math.ceil(layer * lfrac))
        layer = h_units[-1]

    estimator = tf.estimator.DNNRegressor(
        feature_columns=feature_cols,
        hidden_units=h_units,
        optimizer=tf.train.AdagradOptimizer(
            learning_rate=parameters.learning_rate),
        dropout=parameters.dropout, config=config)
    estimator = tf.contrib.estimator.add_metrics(
        estimator, mean_absolute_error)
    estimator = tf.contrib.estimator.forward_features(estimator, 'date')
    return estimator
