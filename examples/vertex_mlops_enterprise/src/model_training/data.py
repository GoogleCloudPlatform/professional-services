# Copyright 2023 Google LLC
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
"""Functions for reading data as tf.data.Dataset."""

import tensorflow as tf

from src.common import features


def _gzip_reader_fn(filenames):
    """Small utility returning a record reader that can read gzip'ed files."""
    return tf.data.TFRecordDataset(filenames, compression_type="GZIP")


def get_dataset(file_pattern, feature_spec, batch_size, epochs):
    """Generates features and label for tuning/training.
    Args:
      file_pattern: input tfrecord file pattern.
      feature_spec: a dictionary of feature specifications.
      batch_size: representing the number of consecutive elements of returned
        dataset to combine in a single batch
    Returns:
      A dataset that contains (features, indices) tuple where features is a
        dictionary of Tensors, and indices is a single Tensor of label indices.
    """

    dataset = tf.data.experimental.make_batched_features_dataset(
        file_pattern=file_pattern,
        batch_size=batch_size,
        features=feature_spec,
        label_key=features.TARGET_FEATURE_NAME,
        reader=_gzip_reader_fn,
        num_epochs=2*epochs,
        drop_final_batch=True,
    )
    

    return dataset
