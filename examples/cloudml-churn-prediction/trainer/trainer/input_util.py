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
"""Input functions."""

import multiprocessing
import os
import tensorflow as tf
import tensorflow_transform as tft


def input_fn(input_dir, mode, batch_size, num_epochs, label_name=None,
             shuffle_buffer_size=10000, feature_spec=None):
    """Reads TFRecords and returns the features and labels."""
    if feature_spec is None:
        tf_transform_output = tft.TFTransformOutput(
            os.path.join(input_dir, 'transformed_metadata'))
        feature_spec = tf_transform_output.transformed_feature_spec()
    prefix = str(mode).lower()
    suffix = '.tfrecord'
    num_cpus = multiprocessing.cpu_count()

    file_pattern = os.path.join(input_dir, 'data', prefix, prefix+'*'+suffix)
    filenames = tf.matching_files(file_pattern)
    dataset = tf.data.TFRecordDataset(filenames=filenames, buffer_size=None,
                                      num_parallel_reads=num_cpus)

    if mode == tf.estimator.ModeKeys.TRAIN:
        dataset = dataset.shuffle(shuffle_buffer_size)

    dataset = dataset.repeat(num_epochs)
    dataset = dataset.batch(batch_size)
    dataset = dataset.map(
        lambda examples: tf.parse_example(examples, feature_spec))
    iterator = dataset.make_one_shot_iterator()
    features = iterator.get_next()
    if mode == tf.estimator.ModeKeys.PREDICT:
        return features

    label = features.pop(label_name)
    return features, label


def tfrecord_serving_input_fn(feature_spec, label_name=None):
    """Creates ServingInputReceiver for TFRecord inputs."""
    if label_name:
        _ = feature_spec.pop(label_name)

    serving_input_receiver = (
        tf.estimator.export.build_parsing_serving_input_receiver_fn(
            feature_spec)())

    return tf.estimator.export.ServingInputReceiver(
        serving_input_receiver.features,
        serving_input_receiver.receiver_tensors)
