# Copyright 2018 Google Inc.
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

"""Creates a function to build a `tf.estimator.Estimator` object.

Builds a customed estimator on top of canned DNN classifier to allow saving the
model and handling indexed outputs.
"""





import tensorflow as tf
from tensorflow.python.estimator.canned import head as head_lib  # pylint: disable=no-name-in-module
from tensorflow.python.estimator.canned.dnn import _dnn_model_fn  # pylint: disable=no-name-in-module

from constants import constants

# TODO(aarg): Use forward_features once it allows to save the estimator.


def build_estimator(output_dir, first_layer_size, num_layers, dropout,
                    learning_rate, save_checkpoints_steps):
  """Builds and returns a DNN Estimator, defined by input parameters.

  Args:
    output_dir: string, directory to save Estimator.
    first_layer_size: int, size of first hidden layer of DNN.
    num_layers: int, number of hidden layers.
    dropout: float, dropout rate used in training.
    learning_rate: float, learning_rate used in training.
    save_checkpoints_steps: int, training steps to save Estimator.

  Returns:
    `Estimator` instance.
  """

  # Sets head to default head for DNNClassifier with two classes.
  model_params = {
      'head':
          head_lib._binary_logistic_head_with_sigmoid_cross_entropy_loss(),
      'feature_columns': [
          tf.feature_column.numeric_column(c, shape=[])
          for c in constants.FEATURE_COLUMNS
      ],
      'hidden_units': [
          max(int(first_layer_size / (pow(2, i))), 2)
          for i in range(int(num_layers))
      ],
      'dropout':
          dropout,
      'optimizer':
          tf.train.AdagradOptimizer(learning_rate)
  }

  def _model_fn(features, labels, mode, params):
    """Build TF graph based on canned DNN classifier."""

    key_column = features.pop(constants.KEY_COLUMN, None)
    if key_column is None:
      raise ValueError('Key is missing from features.')

    spec = _dnn_model_fn(features=features, labels=labels, mode=mode, **params)

    predictions = spec.predictions
    if predictions:
      predictions[constants.KEY_COLUMN] = tf.convert_to_tensor_or_sparse_tensor(
          key_column)
      spec = spec._replace(predictions=predictions)
      spec = spec._replace(export_outputs={
          'classes': tf.estimator.export.PredictOutput(predictions)
      })
    return spec

  config = tf.estimator.RunConfig(save_checkpoints_steps=save_checkpoints_steps)
  return tf.estimator.Estimator(
      model_fn=_model_fn,
      model_dir=output_dir,
      config=config,
      params=model_params)
