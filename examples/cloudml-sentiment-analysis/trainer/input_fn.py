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

"""Functions to read and process input data in order to serve TF estimator."""

from __future__ import absolute_import
from __future__ import division
from __future__ import print_function

import multiprocessing

import numpy as np
import tensorflow as tf

from constants import constants
from utils import utils

_BUCKET_MIN_BOUNDARY = 100
_BUCKET_MAX_BOUNDARY = 500
_BUCKET_LENGTH_STEP = 100
_CHAR_TO_FILTER_OUT = r'[!"#$%&()*+,-./:;<=>?@[\]^_`{|}~]'
_SHUFFLE_BUFFER_SIZE = 100


# TODO(aarg): Add `sparse` option to `group_by_sequence_length_sparse` fn.
def group_by_sequence_length_sparse(element_length_func, bucket_boundaries,
                                    batch_size):
  """Groups dataset records into batches by sequence length.

  Args:
    element_length_func: A function mapping a nested structure of tensors to a
      scalar `tf.int64` (sequence length).
    bucket_boundaries: Array of integers defining the sequence length boundaries
      to use for bucketing.
    batch_size: `int`, batch size to apply to length buckets.

  Returns:
    `tf.data.Dataset` object.
  """

  def _element_to_bucket_id(*args):
    """Maps record to bucket id based on sequence length."""

    seq_length = element_length_func(*args)
    boundaries = list(bucket_boundaries)
    buckets_min = [np.iinfo(np.int64).min] + boundaries
    buckets_max = boundaries + [np.iinfo(np.int64).max]
    conditions_c = tf.logical_and(
        tf.less_equal(buckets_min, seq_length),
        tf.less(seq_length, buckets_max))
    return tf.reduce_min(tf.where(conditions_c))

  def _reduce_func(bucket_id, grouped_dataset):
    """Applies non-padded batching to grouped dataset."""

    del bucket_id
    return grouped_dataset.batch(batch_size)

  return tf.contrib.data.group_by_window(
      key_func=_element_to_bucket_id,
      reduce_func=_reduce_func,
      window_size=batch_size,
      window_size_func=None)


def get_sparse_tensor_size(tensor):
  return tf.cast(tf.reduce_max(tensor.indices[:, 1]), dtype=tf.int64)


def parse_raw_text(sentence):
  """Splits text tensor by word to sparse sequence of tokens.

  Args:
    sentence: `tf.string`, with text record to split.

  Returns:
    Dictionary mapping feature name to tensors with the following entries
    `constants.TOKENS` mapping to a `SparseTensor` and
    `constants.SEQUENCE_LENGTH` mapping to a one-dimensional integer `Tensor`.

  """

  tokens = tf.regex_replace(sentence, _CHAR_TO_FILTER_OUT, ' ',
                            replace_global=True)
  sparse_sequence = tf.string_split(tokens)
  features = {
      constants.TOKENS: sparse_sequence,
      constants.SEQUENCE_LENGTH: get_sparse_tensor_size(sparse_sequence)
  }
  return features


def make_input_fn(input_dir, batch_size, training=True, num_epochs=None,
                  random_seed=None, prefetch_buffer_size=1):
  """Generates an input_fn to use as input to estimator or experiment.

  Combines positive review and negative review datasets into one single dataset.
  Applies shuffling and batching by sequence length.

  Args:
    input_dir: `str`, path to input data.
    batch_size: `int`, size of input batches.
    training: `bool`, whether the data is training data or validation data.
    num_epochs: `int`, number of epochs to repeat the dataset.
    random_seed: `int`, seed to use for randomization.
    prefetch_buffer_size: `int`, buffer size to use to prefetch data.

  Returns:
    Input function.
  """

  def _get_shape(features, labels):
    del labels  # Unused.
    return features[constants.SEQUENCE_LENGTH]

  def _input_fn():
    """Train/eval input function."""

    schema = utils.get_processed_data_schema()
    def _parse_input(record):
      record = tf.parse_single_example(serialized=record, features=schema)
      labels = record.pop(constants.LABELS)
      features = parse_raw_text(tf.reshape(record.pop(constants.REVIEW), [-1,]))
      features[constants.TOKENS] = tf.sparse_reshape(
          features[constants.TOKENS], shape=[-1])
      return features, labels

    filenames = tf.train.match_filenames_once(input_dir)
    dataset = tf.data.TFRecordDataset(filenames)
    dataset = dataset.map(_parse_input,
                          num_parallel_calls=multiprocessing.cpu_count())
    dataset = dataset.shuffle(
        buffer_size=_SHUFFLE_BUFFER_SIZE, seed=random_seed)

    # Groups records by sequence length.
    boundaries = np.arange(
        _BUCKET_MIN_BOUNDARY,
        _BUCKET_MAX_BOUNDARY,
        _BUCKET_LENGTH_STEP)
    dataset = dataset.apply(group_by_sequence_length_sparse(
        _get_shape, boundaries, batch_size))

    # Repeats dataset.
    dataset = dataset.repeat(num_epochs if training else 1)
    dataset = dataset.prefetch(buffer_size=prefetch_buffer_size)

    return dataset
  return _input_fn


def serving_input_fn():
  """Estimator serving function."""

  ph_name = constants.REVIEW
  features_ph = {
      ph_name: tf.placeholder(tf.string, [None], name=ph_name)
  }
  features = parse_raw_text(features_ph[ph_name])
  return tf.estimator.export.ServingInputReceiver(features, features_ph)
