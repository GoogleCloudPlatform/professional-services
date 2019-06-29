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
"""Evaluation metrics and label extraction."""

import tensorflow as tf

from trainer import metadata


def get_class(predictions, threshold=0.50):
    """Calculates predicted class.

    Model output is the conditional likelihood of surviving a time interval,
    given that the user reached that interval. In order to predict a ordinal
    class, the predictions must be converted to unconditional likelihoods and be
    compared to some threshold.tf

    Args:
         predictions: [None, # of bounded intervals] array containing
            conditional likelihoods (model predictions)
         threshold: Float to compare predicted unconditional likelihoods
            against. The predicted ordinal class is the first interval with
            likelihood under this threshold. If all interval likelihoods are
            greater than this threshold, the predicted class is the unbounded
            interval.

    Returns:
         Array of class predictions
    """
    cum_preds = tf.math.cumprod(predictions, axis=1)
    compare_preds = tf.math.greater(cum_preds, tf.cast(threshold, tf.float32))
    class_preds = tf.reduce_sum(tf.cast(compare_preds, tf.float32), axis=1)
    return class_preds


def get_label(labels):
    """Calculate actual label from [survival array | failure array]."""
    splits = tf.split(labels, 2, axis=1)
    labels_value = tf.reduce_sum(splits[0], axis=1)
    return labels_value


def eval_metric_fn(labels, predictions, params):
    """Returns dict of <metric name>: <tf.metrics metric>.

    Args:
         labels: Ground truth values in [survival array | failure array] format
         predictions: Conditional likelihoods of surviving each interval
         params: Dict containing model parameters, including  classification
                    threshold
    """
    metrics = {}
    num_unbounded_intervals = metadata.NUM_INTERVALS + 1
    labels_value = get_label(labels)
    class_preds = get_class(predictions, params['threshold'])
    accuracy = tf.metrics.accuracy(labels_value,
                                   class_preds,
                                   name='acc_op')
    metrics['accuracy'] = accuracy
    accuracy_per_class = tf.metrics.mean_per_class_accuracy(
        labels=labels_value,
        predictions=class_preds,
        num_classes=num_unbounded_intervals,
        name='accuracy_per_class_op')
    metrics['accuracy_per_class'] = accuracy_per_class

    return metrics
