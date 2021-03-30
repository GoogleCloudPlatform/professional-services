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
"""Utility functions for model training."""

from __future__ import absolute_import
from __future__ import division
from __future__ import print_function

import os
import random
import tensorflow as tf
import tensorflow_transform as tft

from constants import constants  # pylint: disable=g-bad-import-order


def _sample_vocab(tft_output, vocab_name, label, k):
  """Samples the given vocab and returns the indices and samples.

  Args:
    tft_output: a TFTransformOutput object.
    vocab_name: the name of the embedding vocabulary made with tft.
    label: a label to assign each sample of the vocab.
    k: the maximum number of samples to take.

  Returns:
    A tuple of (indices, metadata):
      indices: a list of indices for the vocab sample.
      metadata: a list of lists of data corresponding to the indices.
  """
  vocab = tft_output.vocabulary_by_name(vocab_name)
  num_indices = min(k, len(vocab))
  indices = random.sample(range(len(vocab)), num_indices)
  return indices, [[label, vocab[i]] for i in indices]


def write_projector_metadata(metadata_dir, tft_dir):
  """Write a metadata file to use in tensorboard to visualize embeddings.

  Tensorboard expects a .tsv (tab-seperated values) file encoding information
  about each sample. A header is required if there is more than one column.

  Args:
    metadata_dir: the directory where the projector config protobuf is written.
    tft_dir: the directory where tft outputs are written.

  Returns:
    A tuple of user and item indices:
      user_indices: indices of users that were sampled.
      item_indices: indices of items that were sampled.
  """
  tft_output = tft.TFTransformOutput(tft_dir)
  user_indices, user_metadata = _sample_vocab(tft_output,
                                              constants.USER_VOCAB_NAME,
                                              "user",
                                              constants.NUM_PROJECTOR_USERS)
  item_indices, item_metadata = _sample_vocab(tft_output,
                                              constants.ITEM_VOCAB_NAME,
                                              "item",
                                              constants.NUM_PROJECTOR_ITEMS)
  metadata = user_metadata + item_metadata
  metadata_path = os.path.join(metadata_dir, constants.PROJECTOR_PATH)
  tf.io.gfile.makedirs(metadata_dir)
  with tf.io.gfile.GFile(metadata_path, "w+") as f:
    f.write("label\tname\n")
    f.write("\n".join(["{}\t{}".format(label, name) for label, name in metadata]))
  return user_indices, item_indices
