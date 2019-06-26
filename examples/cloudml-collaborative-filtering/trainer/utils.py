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
from six.moves.urllib.parse import urlsplit
import tensorflow_transform as tft
from google.cloud import storage

from constants import constants  # pylint: disable=g-bad-import-order


def _sample_vocab(tft_output, vocab_name, label, k):
  """Samples the given vocab and returns the indices and samples.

  Args:
    tft_output: a TFTransformOutput object.
    vocab_name: the name of the embedding vocabulary made with tft.
    label: a label to assign each sample of the vocab.
    k: the number of samples to take.

  Returns:
    A tuple of (indices, metadata):
      indices: a list of indices for the vocab sample.
      metadata: a list of lists of data corresponding to the indices.

  Raises:
    RuntimeError: k is larger than the vocab size.
  """
  vocab = tft_output.vocabulary_by_name(vocab_name)
  if k > len(vocab):
    raise RuntimeError("{0} num samples too high, must be at most {1}"
                       .format(label, len(vocab)))

  indices = random.sample(range(len(vocab)), k)
  return indices, [[label, vocab[i]] for i in indices]


def _write_projector_metadata_local(metadata_dir, metadata):
  """Write local metadata file to use in tensorboard to visualize embeddings."""
  metadata_path = os.path.join(metadata_dir, constants.PROJECTOR_PATH)
  if not os.path.exists(metadata_dir):
    os.makedirs(metadata_dir)
  with open(metadata_path, "w+") as f:
    f.write("label\tname\n")
    f.write("\n".join(["\t".join(sample) for sample in metadata]))


def _write_projector_metadata_gcs(metadata_dir, metadata):
  """Write GCS metadata file to use in tensorboard to visualize embeddings."""
  metadata_path = os.path.join(metadata_dir, constants.PROJECTOR_PATH)
  scheme, netloc, path, _, _ = urlsplit(metadata_path)
  if scheme != "gs":
    raise ValueError("URI scheme must be gs")
  storage_client = storage.Client()
  bucket = storage_client.get_bucket(netloc)
  blob = bucket.blob(path)

  _write_projector_metadata_local(".", metadata)
  blob.upload_from_filename(constants.PROJECTOR_PATH)
  os.remove(constants.PROJECTOR_PATH)


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
  gcs_drive = "gs://"
  tft_output = tft.TFTransformOutput(tft_dir)
  user_indices, user_metadata = _sample_vocab(tft_output,
                                              constants.USER_VOCAB_NAME,
                                              "user",
                                              constants.PROJECTOR_USER_SAMPLES)
  item_indices, item_metadata = _sample_vocab(tft_output,
                                              constants.ITEM_VOCAB_NAME,
                                              "item",
                                              constants.PROJECTOR_ITEM_SAMPLES)
  metadata = user_metadata + item_metadata
  if metadata_dir[:len(gcs_drive)] == gcs_drive:
    _write_projector_metadata_gcs(metadata_dir, metadata)
  else:
    _write_projector_metadata_local(metadata_dir, metadata)
  return user_indices, item_indices
