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

"""File with functions to process input data and serve TF graph.

Create input function on processed data for training and evaluation and
serving function for out of sample unprocessed data.
"""

from __future__ import absolute_import
from __future__ import division
from __future__ import print_function

import posixpath

import tensorflow as tf
from tensorflow_transform.saved import input_fn_maker
from tensorflow_transform.tf_metadata import metadata_io

from constants import constants
from utils.datasettype import DatasetType


def make_input_schema():
  """Builds the schema of the data from TFRecord to be inputted in the model.

  Returns:
    A dictionary mapping keys of column names to `tf.FixedLenFeature` and
    specifies the shape and dtypes.
  """

  schema = {}
  for c in constants.FEATURE_COLUMNS:
    schema[c] = tf.FixedLenFeature(shape=[], dtype=tf.float32)
  schema[constants.LABEL_COLUMN] = tf.FixedLenFeature(shape=[], dtype=tf.int64)
  schema[constants.KEY_COLUMN] = tf.FixedLenFeature(shape=[], dtype=tf.int64)
  return schema


def read_dataset(input_dir, mode, batch_size):
  """Reads data to be inputted in TF experiment from DataFlow output.

  Processed data, stored as TFRecord.

  Args:
    input_dir: Directory to read data from (output of DataFlow job).
    mode: Specifies the type of dataset (train, validation, test).
    batch_size: Batch size used to read data.

  Raises:
    ValueError: Expected one of the following: `tf.estimator.ModeKeys.TRAIN`,
    `tf.estimator.ModeKeys.EVAL`, `tf.estimator.ModeKeys.INFER`.

  Returns:
    Input function.
  """

  def _parser(data):
    features = {c: data[c] for c in constants.FEATURE_COLUMNS}
    key = constants.KEY_COLUMN
    features.update({key: data[key]})
    labels = data[constants.LABEL_COLUMN]
    return features, labels

  if mode == tf.estimator.ModeKeys.TRAIN:
    d = DatasetType.TRAIN
  elif mode == tf.estimator.ModeKeys.EVAL:
    d = DatasetType.VAL
  elif mode == tf.estimator.ModeKeys.INFER:
    d = DatasetType.TEST
  else:
    raise ValueError(
        'Expected one of the following: tf.estimator.ModeKeys.TRAIN, EVAL, '
        'INFER ; got {} instead.'.format(mode))
  assert d

  prefix_input = [
      posixpath.join(input_dir,
                     '{}*'.format(constants.PATH_TRANSFORMED_DATA_SPLIT[d]))
  ]

  def _input_fn():
    """Input function that serves as input to the Experiment class.

    Returns:
      `tf.Data.dataset` object containing features and labels.
    """

    filenames = tf.train.match_filenames_once(prefix_input)
    dataset = tf.data.TFRecordDataset(filenames)
    schema = make_input_schema()
    dataset = dataset.map(
        lambda x: tf.parse_single_example(serialized=x, features=schema))
    dataset = dataset.map(_parser)
    dataset = dataset.repeat(None)
    dataset = dataset.batch(batch_size)
    return dataset

  return _input_fn


def get_serving_input_fn(input_dir):
  """Creates and returns function serving unlabelled data for scoring.

  Args:
    input_dir: string, path to input data.

  Returns:
    Serving function.
  """

  raw_metadata = metadata_io.read_metadata(
      posixpath.join(input_dir, constants.PATH_INPUT_SCHEMA))
  transform_fn_path = posixpath.join(
      input_dir, constants.PATH_INPUT_TRANSFORMATION, 'transform_fn')

  return input_fn_maker.build_default_transforming_serving_input_receiver_fn(
      raw_metadata=raw_metadata,
      transform_savedmodel_dir=transform_fn_path,
      exclude_raw_keys=[constants.LABEL_COLUMN],
      include_raw_keys=constants.FEATURE_COLUMNS + [constants.KEY_COLUMN])
