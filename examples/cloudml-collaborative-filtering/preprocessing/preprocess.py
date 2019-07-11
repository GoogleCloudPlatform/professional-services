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
"""Builds preprocessing pipeline for product recommendation, producing user-item pairs."""

import os

import apache_beam as beam
import numpy as np
import tensorflow_transform as tft
from tensorflow_transform import coders
from tensorflow_transform.beam import impl as beam_impl
from tensorflow_transform.tf_metadata import dataset_schema

# pylint: disable=g-bad-import-order
from constants import constants
from preprocessing import query as bq_query


# pylint: disable=invalid-name
# pylint: disable=expression-not-assigned
@beam.ptransform_fn
def ReadBQ(p, query):
  """Ingests BQ query results into the pipeline.

  Args:
    p: a pCollection to read the data into.
    query: a BigQuery query.

  Returns:
    A pCollection of injested inputs.
  """
  return p | "ReadQuery" >> beam.io.Read(beam.io.BigQuerySource(
      query=query, use_standard_sql=True))


def _preprocess_tft(raw_data, user_freq, item_freq):
  """Creates vocabularies for users and items and maps their ids to ints.

  Args:
    raw_data: a dict of shape {$user_key: tensor, $item_key: tensor, ...}.
    user_freq: minimum frequency of a user to include it in the user vocab.
    item_freq: minimum frequency of an item to include it in the item vocab.

  Returns:
    A dict containing int ids cooresponding to a user_id and item_id and other
      features: {$user_key: $user_id, $item_key: $item_id, ...}.
  """
  features = {feature: raw_data[feature] for feature in constants.BQ_FEATURES}
  item_vocab = tft.vocabulary(
      raw_data[constants.ITEM_KEY],
      vocab_filename=constants.ITEM_VOCAB_NAME,
      frequency_threshold=item_freq)
  tft_features = {
      constants.TFT_USER_KEY: tft.compute_and_apply_vocabulary(
          raw_data[constants.USER_KEY],
          vocab_filename=constants.USER_VOCAB_NAME,
          frequency_threshold=user_freq,
          default_value=constants.TFT_DEFAULT_ID),
      constants.TFT_ITEM_KEY: tft.apply_vocabulary(
          raw_data[constants.ITEM_KEY],
          item_vocab,
          default_value=constants.TFT_DEFAULT_ID),
      constants.TFT_ARTIST_KEY: tft.compute_and_apply_vocabulary(
          raw_data[constants.ARTIST_KEY],
          vocab_filename=constants.ARTIST_VOCAB_NAME,
          default_value=constants.TFT_DEFAULT_ID),
      constants.TFT_TAGS_KEY: tft.compute_and_apply_vocabulary(
          raw_data[constants.TAGS_KEY],
          vocab_filename=constants.TAG_VOCAB_NAME,
          default_value=constants.TFT_DEFAULT_ID),
      constants.TFT_TOP_10_KEY: tft.apply_vocabulary(
          raw_data[constants.TOP_10_KEY],
          item_vocab,
          default_value=constants.TFT_DEFAULT_ID),
  }
  features.update(tft_features)
  return features


def _run_tft_fn(raw_data, tft_fn, transform_fn_path, user_freq, item_freq):
  """Applys the TensorFlow Transform function to the given data.

  Args:
    raw_data: a dict of shape {$user_key: $user_id, $item_key: ...}.
    tft_fn: a TensorFlow Transform function.
    transform_fn_path: the location to save transformation outputs to.
    user_freq: minimum frequency of a user to include it in the user vocab.
    item_freq: minimum frequency of an item to include it in the item vocab.

  Returns:
    A pCollection of dicts, where each dict is an element of raw_data with the
      preprocess_fn applied to it:
      {$user_key: $user_id, $item_key: $item_id, $count_key: $count}.
  """
  raw_data_metadata = tft.tf_metadata.dataset_metadata.DatasetMetadata(
      tft.tf_metadata.dataset_schema.from_feature_spec(constants.TRAIN_SPEC))
  transformed_dataset, transform_fn = (
      (raw_data, raw_data_metadata)
      | beam_impl.AnalyzeAndTransformDataset(
          lambda x: tft_fn(x, user_freq, item_freq)))
  (transform_fn | "WriteTransformFn" >>
   tft.beam.tft_beam_io.transform_fn_io.WriteTransformFn(
       os.path.join(transform_fn_path, "transform_fn")))
  return transformed_dataset[0]


def _filter_data(features):
  """Yields samples with valid users or items and then drops tft-created ids."""
  user_id = features[constants.TFT_USER_KEY]
  item_id = features[constants.TFT_ITEM_KEY]
  if (user_id != constants.TFT_DEFAULT_ID
      and item_id != constants.TFT_DEFAULT_ID):
    yield {feature: features[feature] for feature in constants.BQ_FEATURES}


def _clean_tags(features):
  if (len(features[constants.TAGS_KEY]) and
      not features[constants.TAGS_KEY][0]):
    features[constants.TAGS_KEY] = []
  return features


def _split_data(examples, train_fraction=constants.TRAIN_SIZE,
                val_fraction=constants.VAL_SIZE):
  """Splits the data into train/validation/test."""

  def partition_fn(*_):
    random_value = np.random.random()
    if random_value < train_fraction:
      return 0
    if random_value < train_fraction + val_fraction:
      return 1
    return 2

  examples_split = examples | "SplitData" >> beam.Partition(partition_fn, 3)
  return zip([constants.TRAIN, constants.VAL, constants.TEST], examples_split)


@beam.ptransform_fn
def Shuffle(p):
  """Shuffles the given pCollection."""
  return (p
          | "PairWithRandom" >> beam.Map(lambda x: (np.random.random(), x))
          | "GroupByRandom" >> beam.GroupByKey()
          | "DropRandom" >> beam.FlatMap(lambda x: x[1]))


@beam.ptransform_fn
def WriteOutput(p, prefix, output_dir, feature_spec, plain_text=False):
  """Writes the given pCollection as a TF-Record.

  Args:
    p: a pCollection.
    prefix: prefix for location tf-record will be written to.
    output_dir: the directory or bucket to write the json data.
    feature_spec: the feature spec of the tf-record to be written.
    plain_text: if true, write the output as plain text instead.
  """
  path = os.path.join(output_dir, prefix)
  shuffled = p | "ShuffleData" >> Shuffle()  # pylint: disable=no-value-for-parameter

  if plain_text:
    shuffled | "WriteToText" >> beam.io.WriteToText(
        path, file_name_suffix=".txt")
    return

  schema = dataset_schema.from_feature_spec(feature_spec)
  coder = coders.ExampleProtoCoder(schema)
  shuffled | "WriteTFRecord" >> beam.io.tfrecordio.WriteToTFRecord(
      path,
      coder=coder,
      file_name_suffix=".tfrecord")


def run(p, args):
  """Creates a pipeline to build and write train/val/test datasets."""
  # pylint: disable=no-value-for-parameter
  query = bq_query.query
  if not args.cloud:
    query = "{} LIMIT 10".format(query)

  raw_data = p | "ReadBQ" >> ReadBQ(query)
  data = _run_tft_fn(raw_data, _preprocess_tft, args.tft_dir,
                     args.user_min_count, args.item_min_count)
  data = (data
          | "FilterData" >> beam.FlatMap(_filter_data)
          | "CleanTags" >> beam.Map(_clean_tags))
  data = _split_data(data)
  for name, dataset in data:
    dataset | "Write{}Output".format(name) >> WriteOutput(
        name, args.output_dir, constants.TRAIN_SPEC, args.plain_text)
