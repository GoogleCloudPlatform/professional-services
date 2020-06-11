# Copyright 2019 Google Inc. All Rights Reserved.
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
"""Constants and common methods for preprocessing and training scripts."""

import tensorflow as tf


# file patterns
TRAIN = "train"
VAL = "val"
TEST = "test"
TRAIN_PATTERN = "{}*.tfrecord".format(TRAIN)
VAL_PATTERN = "{}*.tfrecord".format(VAL)
TEST_PATTERN = "{}*.tfrecord".format(TEST)
USER_VOCAB_NAME = "vocab_users"
ITEM_VOCAB_NAME = "vocab_items"
ARTIST_VOCAB_NAME = "vocab_artists"
TAG_VOCAB_NAME = "vocab_tags"
TMP_DIR = "tmp"

# bq data
USER_KEY = "user"
ITEM_KEY = "song"
ARTIST_KEY = "artist"
ALBUMS_KEY = "albums"
TAGS_KEY = "tags"
USER_TAGS_KEY = "user_tags"
WEIGHT_KEY = "weight"
LABEL_KEY = "label"
BQ_FEATURES = [
    USER_KEY,
    ITEM_KEY,
    ARTIST_KEY,
    ALBUMS_KEY,
    TAGS_KEY,
    USER_TAGS_KEY,
    WEIGHT_KEY,
    LABEL_KEY,
]

# tft data
TFT_USER_KEY = "tft_user"
TFT_ITEM_KEY = "tft_item"
TFT_ARTIST_KEY = "tft_artist"
TFT_TAGS_KEY = "tft_tags"
TFT_FEATURES = [
    TFT_USER_KEY,
    TFT_ITEM_KEY,
    TFT_ARTIST_KEY,
    TFT_TAGS_KEY,
]
TFT_DEFAULT_ID = -1
USER_TAGS_LENGTH = 20

TRAIN_SIZE = .7
VAL_SIZE = .15


def _get_train_spec():
  """Returns a dict mapping training features to tfrecord features."""
  train_spec = {}
  train_spec.update({key: tf.io.FixedLenFeature([], dtype=tf.string)
                     for key in [USER_KEY, ITEM_KEY, ARTIST_KEY]})
  train_spec.update({key: tf.io.FixedLenFeature([], dtype=tf.int64)
                     for key in [ALBUMS_KEY, LABEL_KEY]})
  train_spec[WEIGHT_KEY] = tf.io.FixedLenFeature([], dtype=tf.float32)
  train_spec[USER_TAGS_KEY] = tf.io.FixedLenFeature([USER_TAGS_LENGTH],
                                                    dtype=tf.float32)
  train_spec[TAGS_KEY] = tf.io.VarLenFeature(tf.string)
  return train_spec


def get_serving_stub():
  """Returns stubbed values for features to use during serving when only username matters."""
  stub = {}
  stub.update({key: "" for key in [USER_KEY, ITEM_KEY, ARTIST_KEY]})
  stub.update({key: 0 for key in [ALBUMS_KEY, USER_TAGS_KEY]})
  stub[TAGS_KEY] = []
  return stub


# model constants
USER_NUMERICAL_FEATURES = [USER_TAGS_KEY]
USER_NUMERICAL_FEATURE_LENS = [USER_TAGS_LENGTH]
USER_CATEGORICAL_FEATURES = []
USER_CATEGORICAL_VOCABS = []
USER_FEATURES = USER_NUMERICAL_FEATURES + USER_CATEGORICAL_FEATURES
ITEM_NUMERICAL_FEATURES = [ALBUMS_KEY]
ITEM_NUMERICAL_FEATURE_LENS = [1]
ITEM_CATEGORICAL_FEATURES = [TFT_TAGS_KEY, TFT_ARTIST_KEY]
ITEM_CATEGORICAL_VOCABS = [TAG_VOCAB_NAME, ARTIST_VOCAB_NAME]
ITEM_FEATURES = ITEM_NUMERICAL_FEATURES + ITEM_CATEGORICAL_FEATURES

EVAL_SAMPLE_SIZE = 1000
EVAL_RECALL_KS = [10, 100, 500]
assert all([x < EVAL_SAMPLE_SIZE for x in EVAL_RECALL_KS])

TRAIN_SPEC = _get_train_spec()
SERVE_SPEC = _get_train_spec()
SERVE_SPEC.pop(WEIGHT_KEY)
SERVE_SPEC.pop(LABEL_KEY)
RAW_CATEGORICAL_FEATURES = [TAGS_KEY]

# tensorboard projector config
PROJECTOR_PATH = "metadata.tsv"
PROJECTOR_NAME = "combined_embedding"
NUM_PROJECTOR_USERS = 1000
NUM_PROJECTOR_ITEMS = 4000
