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

"""Defines data preprocessing pipeline."""

from __future__ import absolute_import
from __future__ import division
from __future__ import print_function

import enum
import os
import random

import apache_beam as beam
from apache_beam.io import tfrecordio
from apache_beam.pvalue import TaggedOutput
from tensorflow import gfile
from tensorflow import logging
from tensorflow_transform.coders import example_proto_coder
from tensorflow_transform.tf_metadata import dataset_schema

from constants import constants
from utils import utils


class _DatasetType(enum.Enum):
  """Encodes integer values to differentiate train, validation, test sets."""

  UNSPECIFIED = 0
  TRAIN = 1
  VAL = 2


class _SplitData(beam.DoFn):
  """DoFn that randomly splits records in training / validation sets."""

  def process(self, element, train_size, val_label):
    """Randomly assigns element to training or validation set."""
    if random.random() > train_size:
      yield TaggedOutput(val_label, element)
    else:
      yield element


class ReadFile(beam.DoFn):
  """DoFn to read and label files."""

  def process(self, element):
    labels = {
        constants.SUBDIR_POSITIVE: constants.POSITIVE_SENTIMENT_LABEL,
        constants.SUBDIR_NEGATIVE: constants.NEGATIVE_SENTIMENT_LABEL
    }
    found_labels = [labels[l] for l in labels if l in element]
    if len(found_labels) > 1:
      raise ValueError('Incompatible path: `{}`.'.format(element))
    if found_labels:
      with gfile.GFile(element, 'r') as single_file:
        for line in single_file:
          yield {constants.LABELS: found_labels[0], constants.REVIEW: line}
    else:
      logging.debug('Label not found for file: `%s`.', element)


@beam.ptransform_fn
def shuffle(p):
  """Shuffles data from PCollection.

  Args:
    p: PCollection.

  Returns:
    PCollection of shuffled data.
  """

  class _AddRandomKey(beam.DoFn):

    def process(self, element):
      yield random.random(), element

  shuffled_data = (
      p
      | 'PairWithRandom' >> beam.ParDo(_AddRandomKey())
      | 'GroupByRandom' >> beam.GroupByKey()
      | 'DropRandom' >> beam.FlatMap(lambda (k, vs): vs))
  return shuffled_data


def run(p, params):
  """Defines Beam preprocessing pipeline.

  Performs the following:
    - Reads text files from pattern.
    - Split text files in train and validation sets.

  Args:
    p: PCollection, initial pipeline.
    params: Object holding a set of parameters as name-value pairs.
  """

  path_pattern = os.path.join(params.input_dir, '*', '*{}'.format(
      constants.FILE_EXTENSION))
  data = (
      p
      | 'ListFiles' >> beam.Create(gfile.Glob(path_pattern))
      | 'ReadFiles' >> beam.ParDo(ReadFile())
      | 'SplitData' >> beam.ParDo(
          _SplitData(),
          train_size=params.train_size,
          val_label=_DatasetType.VAL.name).with_outputs(
              _DatasetType.VAL.name, main=_DatasetType.TRAIN.name))

  schema = dataset_schema.from_feature_spec(utils.get_processed_data_schema())
  for dataset in _DatasetType:
    if not dataset.value:
      continue
    _ = (
        data[dataset.name]
        | 'Shuffle{}'.format(dataset.name) >> shuffle()  # pylint: disable=no-value-for-parameter
        | 'WriteFiles{}'.format(dataset.name) >> tfrecordio.WriteToTFRecord(
            os.path.join(params.output_dir, dataset.name + constants.TFRECORD),
            coder=example_proto_coder.ExampleProtoCoder(schema)))
