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
"""Feature management for data preprocessing."""

import tensorflow as tf
import tensorflow_transform as tft
from tensorflow_transform.tf_metadata import dataset_metadata
from tensorflow_transform.tf_metadata import dataset_schema


BQ_FEATURES = [
    'fullVisitorId', 'totals.visits', 'totals.hits',
    'totals.pageviews', 'device.deviceCategory',
    'geoNetwork.continent', 'geoNetwork.subContinent', 'socialEngagementType',
    'channelGrouping']

CATEGORICAL_COLUMNS = [
    'deviceCategory',
    'continent',
    'subContinent',
    'socialEngagementType',
    'channelGrouping',
]

METADATA_COLUMNS = [
    'fullVisitorId'
]

NUMERIC_COLUMNS = [
    'visits',
    'hits',
    'pageviews',
    'duration'
]

LABEL_ARRAY_COLUMN = 'labelArray'

BOOLEAN_COLUMNS = []

LABEL_COLUMNS = [
    'start_date',
    'end_date',
    'active',
    'duration',
    'labelArray',
    'label'
]


LABEL_VALUES = ['0-2M', '2-4M', '4-6M', '6-8M', '8M+']
LABEL_CEILINGS = [60, 120, 180, 240]  # number of days for ceiling of each class


def get_raw_feature_spec():
    """Returns TF feature spec for preprocessing."""

    features = {}
    features.update(
        {key: tf.FixedLenFeature([], dtype=tf.string)
         for key in CATEGORICAL_COLUMNS}
    )
    features.update(
        {key: tf.FixedLenFeature([], dtype=tf.float32)
         for key in NUMERIC_COLUMNS}
    )
    features.update(
        {key: tf.FixedLenFeature([], dtype=tf.int64)
         for key in BOOLEAN_COLUMNS}
    )
    features[LABEL_ARRAY_COLUMN] = tf.FixedLenFeature(
        [2*len(LABEL_CEILINGS)], tf.float32)

    return features


RAW_FEATURE_SPEC = get_raw_feature_spec()


def get_raw_dataset_metadata():
    return dataset_metadata.DatasetMetadata(
        dataset_schema.from_feature_spec(RAW_FEATURE_SPEC))


def preprocess_fn(inputs):
    """TensorFlow transform preprocessing function.

    Args:
        inputs: Dict of key to Tensor.
    Returns:
        Dict of key to transformed Tensor.
    """
    outputs = inputs.copy()
    # For all categorical columns except the label column, we generate a
    # vocabulary but do not modify the feature.  This vocabulary is instead
    # used in the trainer, by means of a feature column, to convert the feature
    # from a string to an integer id.
    for key in CATEGORICAL_COLUMNS:
        tft.vocabulary(inputs[key], vocab_filename=key)
    return outputs
