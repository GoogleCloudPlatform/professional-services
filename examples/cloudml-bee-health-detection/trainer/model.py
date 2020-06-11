#!/usr/bin/env python
# Copyright 2018 Google LLC
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
# ==============================================================================
"""Defines TensorFlow model.

Defines features and classification model.

Typical usage example:

model.create_classifier(config, parameters)
"""

import math

import tensorflow as tf
import tensorflow_hub as hub


BEE_SUBSPECIES = ['Other', 'Carniolan', 'Italian', 'Russian']


def _estimator_metrics(labels, predictions):
    """Creates metrics for Estimator.

    Metrics defined here can be used to evaluate the model (on evaluation
    data) and also can be used to maximize or minimize their values during
    hyper-parameter tunning.

    Args:
        labels: Evaluation true labels.
        predictions: Evaluation model predictions.

    Returns:
        A dictionary with the evaluation metrics
    """
    pred_logistic = predictions['logistic']
    pred_class = predictions['class_ids']
    return {
        'accuracy': tf.metrics.accuracy(labels, pred_class),
        'auc_roc': tf.metrics.auc(labels, pred_logistic),
        'auc_pr': tf.metrics.auc(labels, pred_logistic, curve='PR'),
        'precision': tf.metrics.precision(labels, pred_class),
        'recall': tf.metrics.recall(labels, pred_class)}


def create_classifier(config, parameters):
    """Creates a DNN classifier.

    Defines features and builds an 'Estimator' with them.

    Args:
        config: `RunConfig` object to configure the runtime of the `Estimator`.
        parameters: Parameters passed to the job.

    Returns:
        `tf.estimator.DNNClassifier` with specified features and architecture.
    """
    # Columns to be used as features.
    subspecies = tf.feature_column.categorical_column_with_vocabulary_list(
        'subspecies',
        vocabulary_list=BEE_SUBSPECIES,
        default_value=0)
    subspecies = tf.feature_column.embedding_column(
        subspecies, dimension=parameters.subspecies_embedding)

    image = hub.image_embedding_column('image', parameters.tf_hub_module)

    feature_cols = [subspecies, image]

    layer = parameters.first_layer_size
    lfrac = parameters.layer_reduction_fraction
    nlayers = parameters.number_layers
    h_units = [layer]
    for _ in range(nlayers - 1):
        h_units.append(math.ceil(layer * lfrac))
        layer = h_units[-1]

    estimator = tf.estimator.DNNClassifier(
        feature_columns=feature_cols,
        hidden_units=h_units,
        optimizer=tf.train.AdagradOptimizer(
            learning_rate=parameters.learning_rate),
        dropout=parameters.dropout, config=config)
    estimator = tf.contrib.estimator.add_metrics(
        estimator, _estimator_metrics)
    estimator = tf.contrib.estimator.forward_features(estimator, 'img_file')
    return estimator
