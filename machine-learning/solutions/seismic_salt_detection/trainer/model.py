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


def forward_key_to_export(estimator):
    """Forwards record key to output during inference.

    Temporary workaround. The key and its value will be extracted from input
    tensors and returned in the prediction dictionary. This is useful to pass
    record key identifiers. Code came from:
    https://towardsdatascience.com/how-to-extend-a-canned-tensorflow-estimator-to-add-more-evaluation-metrics-and-to-pass-through-ddf66cd3047d
    This shouldn't be necessary. (CL/187793590 was filed to update extenders.py
    with this code)

    Args:
        estimator: `Estimator` being modified.

    Returns:
        A modified `Estimator`
    """
    config = estimator.config

    def model_fn2(features, labels, mode):
        estimatorSpec = estimator._call_model_fn(
            features, labels, mode, config=config)
        if estimatorSpec.export_outputs:
            for ekey in ['predict', 'serving_default']:
                estimatorSpec.export_outputs[
                    ekey
                ] = tf.estimator.export.PredictOutput(
                    estimatorSpec.predictions)
        return estimatorSpec
    return tf.estimator.Estimator(model_fn=model_fn2, config=config)

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
    estimator = forward_key_to_export(estimator)
    return estimator
