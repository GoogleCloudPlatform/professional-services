# Copyright 2019 Google Inc. All Rights Reserved.

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
"""Input and preprocessing functions."""

from __future__ import absolute_import
from __future__ import division
from __future__ import print_function

import multiprocessing

import tensorflow as tf

from constants import constants  # pylint: disable=g-bad-import-order


def get_input_fn(file_pattern, batch_size, num_epochs=None):
  """Wrapper for the _input_fn.

  Args:
    file_pattern: pattern of the input files.
    batch_size: batch size used to read data.
    num_epochs: number of times to iterate over the dataset.

  Returns:
    An input_fn.
  """

  def _parse_example(example):
    """Parses a row in a batch of data into features and labels."""
    parsed_example = tf.parse_single_example(
        serialized=example,
        features=constants.TRAIN_SPEC)
    label = parsed_example.pop(constants.COUNT_KEY)
    return parsed_example, label

  def _input_fn():
    """Reads TF-records and return the data in a tf.dataset."""
    filenames = tf.data.Dataset.list_files(file_pattern)
    dataset = tf.data.TFRecordDataset(filenames)
    dataset = dataset.map(
        _parse_example,
        num_parallel_calls=multiprocessing.cpu_count())
    dataset = dataset.repeat(num_epochs)
    dataset = dataset.batch(batch_size)
    dataset = dataset.prefetch(buffer_size=10)
    return dataset

  return _input_fn


def get_serving_input_fn():
  """Wrapper for _serving_input_fn.

  Returns:
    An input fn for serving.
  """

  def _get_tensor_stubs():
    """Creates input tensors for the model with dynamic shapes."""
    features = {}
    stub = constants.get_serving_stub()
    for feature in constants.SERVE_SPEC:
      if feature not in constants.RAW_CATEGORICAL_FEATURES:
        t = tf.placeholder(constants.SERVE_SPEC[feature].dtype)
        features[feature] = tf.fill(
            tf.shape(t), tf.cast(stub[feature], t.dtype))
    for feature in constants.RAW_CATEGORICAL_FEATURES:
      t = tf.placeholder(tf.float32)
      dynamic_shape = tf.shape(t, out_type=tf.int64)
      features[feature] = tf.SparseTensor(
          [[0, 0], [1, 1]], ["", ""], dynamic_shape)
    return features

  def _serving_input_fn():
    """Creates in ServingInputReceiver to handle JSON inputs."""
    receiver_tensors = {
        constants.USER_KEY: tf.placeholder(tf.string),
        constants.ITEM_KEY: tf.placeholder(tf.string),
    }
    features = _get_tensor_stubs()
    features.update(receiver_tensors)
    return tf.estimator.export.ServingInputReceiver(features, receiver_tensors)

  return _serving_input_fn

