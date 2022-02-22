# Copyright 2019 Google LLC
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

"""Module for creating metrics in tensorflow for model training."""

import tensorflow as tf


def mean_acc(labels, predictions, num_classes):
    """Mean per class accuracy metrics
    Arguments:
        labels: tf.Tensor objects, True values of the dependent variable
        predictions: tf.Tensor objects, Predictions from the model

    Returns:
        The mean per class accuracy
    """
    return {'mean_class_acc': tf.metrics.mean_per_class_accuracy(
        labels,
        predictions['class_ids'], num_classes)
    }


def my_auc(labels, predictions):
    """Custom AUC metric using interpolation.

    Arguments:
        labels: tf.Tensor objects, True values of dependent variable
        predictions: tf.Tensor objects, Predictions from the model
    Returns:
        The AUC metric for the model
    """
    return {'auc_ci': tf.metrics.auc(
        labels,
        predictions['class_ids'],
        summation_method='careful_interpolation')
    }


def rmse(labels, predictions):
    """Root mean squared error metric for regression tasks.

    Arguments:
        labels: tf.Tensor objects, True values of dependent variable
        predictions: tf.Tensor objects, Predictions from the model

    Returns:
        Root mean squared error for regression model
    """
    return {'root_mean_square_error': tf.metrics.root_mean_squared_error(
        labels,
        predictions['predictions'])
    }


def mar(labels, predictions):
    """Mean absolute error for regression model.

    Arguments:
        labels: tf.Tensor objects, True values of dependent variable
        predictions: tf.Tensor objects, Predictions from the model

    Returns:
        Mean absolute error for the regression model
    """
    return {'mean_absolute_error': tf.metrics.mean_absolute_error(
        labels,
        predictions['predictions'])
    }
