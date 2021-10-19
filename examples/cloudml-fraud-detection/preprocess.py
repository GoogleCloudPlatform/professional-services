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

"""Processes raw data to build train, validation and test set.

Runs either locally or in Google Cloud DataFlow. Performs the following
operations:
  - reads data from BigQuery
  - adds hash key value to each row
  - scales data
  - shuffles and splits data in train / validation / test sets
  - oversamples train data
  - stores data as TFRecord
  - splits and stores test data into labels and features files.
"""

from __future__ import absolute_import
from __future__ import division
from __future__ import print_function

import argparse
from datetime import datetime
import json
import os
import posixpath
import random
import sys

import apache_beam as beam
from apache_beam.io import tfrecordio
import tensorflow as tf
import tensorflow_transform as tft
import tensorflow_transform.beam.impl as beam_impl
from tensorflow_transform.coders import example_proto_coder
from tensorflow_transform.tf_metadata import dataset_metadata
from tensorflow_transform.tf_metadata import dataset_schema

from constants import constants
from utils.datasettype import DatasetType


def preprocessing_fn(inputs):
  """Performs scaling of input features.

  Args:
    inputs: Dictionary of input columns mapping strings to `Tensor` or
    `SparseTensor`s.

  Returns:
    Dictionary of output columns mapping strings to `Tensor` or `SparseTensor`.
  """

  output = {}
  for c in constants.FEATURE_COLUMNS:
    output[c] = tft.scale_to_0_1(inputs[c])
  output[constants.LABEL_COLUMN] = inputs[constants.LABEL_COLUMN]
  output[constants.KEY_COLUMN] = inputs[constants.KEY_COLUMN]
  return output


@beam.ptransform_fn
def check_size(p, name, path):
  """Performs checks on the input pipeline and stores stats in specfied path.

  Checks performed: counts rows and derives class distribution.

  Args:
    p: PCollection, input pipeline.
    name: string, unique identifier for the beam step.
    path: string: path to store stats.

  Returns:
    PCollection
  """

  class _Combine(beam.CombineFn):
    """Counts and take the average of positive classes in the pipeline."""

    def create_accumulator(self):
      return (0.0, 0.0)

    def add_input(self, sum_count, inputs):
      (s, count) = sum_count
      return s + inputs, count + 1

    def merge_accumulators(self, accumulators):
      sums, counts = zip(*accumulators)
      return sum(sums), sum(counts)

    # We should not consider the case count == 0 as an error (class initialized
    # with count == 0).
    def extract_output(self, sum_count):
      (s, count) = sum_count
      return count, (1.0 * s / count) if count else float('NaN')

  return (p
          | 'CheckMapTo_1_{}'.format(name) >>
          beam.Map(lambda x: x[constants.LABEL_COLUMN])
          | 'CheckSum_{}'.format(name) >> beam.CombineGlobally(_Combine())
          | 'CheckRecord_{}'.format(name) >> beam.io.WriteToText(
              '{}.txt'.format(path)))


@beam.ptransform_fn
def shuffle_data(p):
  """Shuffles data from PCollection.

  Args:
    p: PCollection.

  Returns:
    PCollection of shuffled data.
  """

  class _AddRandomKey(beam.DoFn):

    def process(self, element):
      yield (random.random(), element)

  shuffled_data = (
      p
      | 'PairWithRandom' >> beam.ParDo(_AddRandomKey())
      | 'GroupByRandom' >> beam.GroupByKey()
      | 'DropRandom' >> beam.FlatMap(lambda k__vs: k__vs[1]))
  return shuffled_data


@beam.ptransform_fn
def randomly_split(p, train_size, validation_size, test_size):
  """Randomly splits input pipeline in three sets based on input ratio.

  Args:
    p: PCollection, input pipeline.
    train_size: float, ratio of data going to train set.
    validation_size: float, ratio of data going to validation set.
    test_size: float, ratio of data going to test set.

  Returns:
    Tuple of PCollection.

  Raises:
    ValueError: Train validation and test sizes don`t add up to 1.0.
  """

  if train_size + validation_size + test_size != 1.0:
    raise ValueError('Train validation and test sizes don`t add up to 1.0.')

  class _SplitData(beam.DoFn):

    def process(self, element):
      r = random.random()
      if r < test_size:
        yield beam.pvalue.TaggedOutput(DatasetType.TEST.name, element)
      elif r < 1 - train_size:
        yield beam.pvalue.TaggedOutput(DatasetType.VAL.name, element)
      else:
        yield element

  split_data = (
      p | 'SplitData' >> beam.ParDo(_SplitData()).with_outputs(
          DatasetType.VAL.name,
          DatasetType.TEST.name,
          main=DatasetType.TRAIN.name))

  split_data_id = {}
  for k in [DatasetType.TRAIN, DatasetType.VAL, DatasetType.TEST]:
    split_data_id[k] = split_data[k.name]

  return split_data_id


@beam.ptransform_fn
def read_data(p, bq_table, project_id):
  """Inputs raw data from BigQuery table into beam pipeline.

  Args:
    p: PCollection, pipeline to input data.
    bq_table: string, name of table to read data from.
    project_id: string, GCP project id.
  Returns:
    PCollection.
  """

  column_list = ', '.join(constants.FEATURE_COLUMNS + [constants.LABEL_COLUMN])
  query = 'SELECT {} FROM [{}:{}.{}]'.format(column_list, project_id,
                                             constants.BQ_DATASET, bq_table)

  data = (
      p | 'ReadData' >> beam.io.Read(
          beam.io.BigQuerySource(query=query, use_standard_sql=False)))
  return data


def make_input_schema():
  """Builds the schema of the data read from BigQuery.

  Appends key column to schema for inference.

  Returns:
    A dictionary mapping keys of column names to `tf.FixedLenFeature` instances.
  """

  feature_spec = {}
  for c in constants.FEATURE_COLUMNS:
    feature_spec[c] = tf.FixedLenFeature(shape=[], dtype=tf.float32)
  feature_spec[constants.LABEL_COLUMN] = tf.FixedLenFeature(
      shape=[], dtype=tf.int64)
  feature_spec[constants.KEY_COLUMN] = tf.FixedLenFeature(
      shape=[], dtype=tf.int64)

  return dataset_schema.from_feature_spec(feature_spec)


@beam.ptransform_fn
def oversampling(p):
  """Oversamples the positive class elements contained in the input pipeline.

  Computes the current class distribution and re-sample positive class to
  ensure a class distribution close to 50% / 50%. Samples each positive class
  item w/ bernouilli distribution approximated with normal distribution
  (mean=ratio, var=ratio, where ratio is the factor by which we want to increase
  the number of positive samples).

  Args:
    p: PCollection.

  Returns:
    PCollection of re-balanced elements.

  Raises:
    ValueError: No positive class items found in pipeline.
  """

  # Computes percentage of positive class to use as side input in main pipeline.
  percentage = (
      p
      | 'ReduceToClass' >> beam.Map(lambda x: 1.0 * x[constants.LABEL_COLUMN])
      | beam.CombineGlobally(beam.combiners.MeanCombineFn()))

  class _Sample(beam.DoFn):
    """DoFn that performs resampling element by element.

    Attributes:
      process: Function performing the resampling at element level.
    """

    def process(self, element, percent_positive):
      if not percent_positive:
        raise ValueError('No positive class items found in pipeline.')
      ratio = 1.0 / percent_positive
      n = (
          max(int(random.gauss(mu=ratio, sigma=ratio**0.5)), 0)
          if element[constants.LABEL_COLUMN] else 1)
      for _ in range(n):
        yield element

  proc = (
      p | 'DuplicateItemAndFlatten' >> beam.ParDo(
          _Sample(), percent_positive=beam.pvalue.AsSingleton(percentage)))

  return proc


@beam.ptransform_fn
def store_transformed_data(data, schema, path, name=''):
  """Stores data from input pipeline into TFRecord in the specified path.

  Args:
    data: `PCollection`, input pipeline.
    schema: `DatasetMetadata` object, describes schema of the input pipeline.
    path: string, where to write output.
    name: string: name describing pipeline to be written.

  Returns:
    PCollection
  """

  p = (
      data
      | 'WriteData{}'.format(name) >> tfrecordio.WriteToTFRecord(
          path, coder=example_proto_coder.ExampleProtoCoder(schema.schema)))
  return p


@beam.ptransform_fn
def split_features_labels(data, label_column, key_column):
  """Separates features from true labels in input pipeline for future inference.

  Args:
    data: PCollection, input pipeline.
    label_column: string, name of column containing labels.
    key_column: string, name of column containing keys.

  Returns:
    Dictionary mapping the strings 'labels' and 'features' to PCollection
    objects.
  """

  label_pipeline, features_pipeline = 'labels', 'features'

  class _SplitFeaturesLabels(beam.DoFn):

    def process(self, element, label_column, key_column):
      yield beam.pvalue.TaggedOutput(label_pipeline, {
          key_column: element[key_column],
          label_column: element.pop(label_column)
      })
      yield element

  data |= 'SplitFeaturesLabels' >> beam.ParDo(
      _SplitFeaturesLabels(), label_column=label_column,
      key_column=key_column).with_outputs(
          label_pipeline, main=features_pipeline)
  return {k: data[k] for k in (label_pipeline, features_pipeline)}


class AddHash(beam.DoFn):
  """DoFn that adds a hash key to each element based on the feature values.

  Attributes:
    process: Adds the hash key at the element level.
  """

  def process(self, element, label_column, key_column, dtype):
    hsh = 0
    if dtype == DatasetType.TEST:
      hsh = [element[k] for k in element if k != label_column]
      hsh = hash(tuple(hsh))
    element.update({key_column: hsh})
    yield element


def preprocess(p, output_dir, check_path, data_size, bq_table, split_data_path,
               project_id):
  """Main processing pipeline reading, processing and storing processed data.

  Performs the following operations:
    - reads data from BigQuery
    - adds hash key value to each row
    - scales data
    - shuffles and splits data in train / validation / test sets
    - oversamples train data
    - stores data as TFRecord
    - splits and stores test data into labels and features files

  Args:
    p: PCollection, initial pipeline.
    output_dir: string, path to directory to store output.
    check_path: string, path to directory to store data checks.
    data_size: tuple of float, ratio of data going respectively to train,
      validation and test sets.
    bq_table: string, name of table to read data from.
    split_data_path: string, path to directory to store train, validation and
      test raw datasets.
    project_id: string, GCP project id.

  Raises:
    ValueError: No test dataset found in pipeline output.
  """

  train_size, validation_size, test_size = data_size

  data = (p | 'ReadData' >> read_data(bq_table=bq_table, project_id=project_id))

  _ = data | 'StoreData' >> beam.io.WriteToText(
      posixpath.join(output_dir, check_path, 'processed_data.txt'))

  split_data = (
      data | 'RandomlySplitData' >> randomly_split(
          train_size=train_size,
          validation_size=validation_size,
          test_size=test_size))

  for k in split_data:
    split_data[k] |= 'AddHash_{}'.format(k.name) >> beam.ParDo(
        AddHash(),
        label_column=constants.LABEL_COLUMN,
        key_column=constants.KEY_COLUMN,
        dtype=k)

  # Splits test data into features pipeline and labels pipeline.
  if DatasetType.TEST not in split_data:
    raise ValueError('No test dataset found in pipeline output.')
  test_data = (
      split_data.pop(DatasetType.TEST)
      | 'SplitFeaturesLabels' >> split_features_labels(constants.LABEL_COLUMN,
                                                       constants.KEY_COLUMN))

  # Stores test data features and labels pipeline separately.
  for k in test_data:
    _ = (
        test_data[k]
        | 'ParseJsonToString_{}'.format(k) >> beam.Map(json.dumps)
        | 'StoreSplitData_{}'.format(k) >> beam.io.WriteToText(
            posixpath.join(
                output_dir, split_data_path, 'split_data_{}_{}.txt'.format(
                    DatasetType.TEST.name, k))))

  meta_data = dataset_metadata.DatasetMetadata(make_input_schema())

  transform_fn = (
      (split_data[DatasetType.TRAIN], meta_data)
      | 'AnalyzeTrainDataset' >> beam_impl.AnalyzeDataset(preprocessing_fn))

  _ = (
      transform_fn
      | 'WriteTransformFn' >> tft.beam.tft_beam_io.WriteTransformFn(
          posixpath.join(output_dir, constants.PATH_INPUT_TRANSFORMATION)))
  _ = (
      meta_data
      | 'WriteInputMetadata' >> tft.beam.tft_beam_io.WriteMetadata(
          posixpath.join(output_dir, constants.PATH_INPUT_SCHEMA), pipeline=p))

  transformed_metadata, transformed_data = {}, {}
  for k in [DatasetType.TRAIN, DatasetType.VAL]:
    transformed_data[k], transformed_metadata[k] = (
        ((split_data[k], meta_data), transform_fn)
        | 'Transform{}'.format(k) >> beam_impl.TransformDataset())

  transformed_data[DatasetType.TRAIN] = (
      transformed_data[DatasetType.TRAIN]
      | 'OverSampleTraining' >> oversampling())

  for k in transformed_data:
    _ = (
        transformed_data[k]
        | 'ShuffleData{}'.format(k) >> shuffle_data()
        | 'StoreData{}'.format(k) >> store_transformed_data(
            schema=transformed_metadata[k],
            path=posixpath.join(output_dir,
                                constants.PATH_TRANSFORMED_DATA_SPLIT[k]),
            name=DatasetType(k).name))

  for k in transformed_data:
    _ = (
        transformed_data[k] | 'CheckSize{}'.format(k.name) >> check_size(
            name=DatasetType(k).name,
            path=posixpath.join(output_dir, check_path, k.name)))


def parse_arguments(argv):
  """Parses execution arguments and replaces default values.

  Args:
    argv: Input arguments from sys.

  Returns:
    Parsed arguments.
  """

  parser = argparse.ArgumentParser()
  parser.add_argument(
      '--bq_table',
      default='raw_data',
      help='Name of BigQuery table to read data from.')
  parser.add_argument(
      '--check_path',
      default='check',
      help='Directory in which to write data checks.')
  parser.add_argument(
      '--cloud',
      default=False,
      action='store_true',
      help='Run preprocessing on the cloud.')
  parser.add_argument(
      '--output_dir',
      default='output-{}'.format(datetime.now().strftime('%Y%m%d%H%M%S')),
      help='Directory in which to write outputs.')
  parser.add_argument(
      '--test_size', default=0.15, help='Fraction of data going into test set.')
  parser.add_argument(
      '--train_size',
      default=0.7,
      help='Fraction of data going into train set.')
  parser.add_argument(
      '--validation_size',
      default=0.15,
      help='Fraction of data going into validation set.')
  parser.add_argument(
      '--split_data_path',
      default='split_data',
      help='Directory in which to write data once split.')
  parser.add_argument(
      '--project_id',
      required=True,
      help='Google Cloud project ID.')
  parser.add_argument(
      '--bucket_id',
      required=True,
      help='Google Cloud bucket ID.')

  args, _ = parser.parse_known_args(args=argv[1:])
  return args


def main():
  """Parses execution arguments, creates and runs processing pipeline.

  Cheks current OS. Posix OS is required for local and GCP paths consistency.

  Raises:
    OSError: Posix OS required.
    ValueError: Train validation and test size dont add up to 1.0.
  """

  if os.name != 'posix':
    raise OSError('Posix OS required.')

  args = parse_arguments(sys.argv)

  if args.train_size + args.validation_size + args.test_size != 1.0:
    raise ValueError('Train validation and test size dont add up to 1.0.')

  output_dir = args.output_dir
  if args.cloud:
    output_dir = posixpath.join('gs://', args.bucket_id, output_dir)
    runner = 'DataflowRunner'
  else:
    output_dir = posixpath.join('.', output_dir)
    runner = 'DirectRunner'

  temp_dir = posixpath.join(output_dir, 'tmp')

  options = {
      'project':
          args.project_id,
      'job_name':
          '{}-{}'.format(args.project_id,
                         datetime.now().strftime('%Y%m%d%H%M%S')),
      'setup_file':
          posixpath.abspath(
              posixpath.join(posixpath.dirname(__file__), 'setup.py')),
      'temp_location':
          temp_dir,
      'save_main_session':
          True
  }
  pipeline_options = beam.pipeline.PipelineOptions(flags=[], **options)

  with beam.Pipeline(runner, options=pipeline_options) as p:
    with beam_impl.Context(temp_dir=temp_dir):
      preprocess(
          p=p,
          output_dir=output_dir,
          check_path=args.check_path,
          data_size=(args.train_size, args.validation_size, args.test_size),
          bq_table=args.bq_table,
          split_data_path=args.split_data_path,
          project_id=args.project_id)


if __name__ == '__main__':
  main()
