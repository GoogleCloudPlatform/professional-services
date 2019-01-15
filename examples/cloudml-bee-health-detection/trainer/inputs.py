#!/usr/bin/env python
# Copyright 2018 Google LLC
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
# ==============================================================================
"""Takes care of all the input data for the model.

Parses columns and generates input specifications for `Estimator`.

Typical usage example:

estimator = model.create_classifier(
    config,
    parameters)
train_spec = inputs.get_train_spec(
    training_path,
    image_path,
    batch_size,
    max_steps)
eval_spec = inputs.get_eval_spec(
    validation_path,
    image_path,
    eval_batch_size)

tf.estimator.train_and_evaluate(
    estimator,
    train_spec,
    eval_spec)
"""

import multiprocessing

import tensorflow as tf

IMAGE_SIZE = 224
TARGET_COLUMN = 'unhealthy'
SHUFFLE_BUFFER_SIZE = 200


def _parse_csv(record):
    """Parses columns from comma separated record.

    Defines types and column names for columns.

    Args:
        record: A Tensor of type string. Each string is a record/row in the csv
        and all records should have the same format.

    Returns:
        A dictionary with all column names and values for the record.
    """
    column_defaults = [
        tf.constant([], tf.string),
        tf.constant([], tf.string),
        tf.constant([], tf.int32)]
    column_names = ['img_file', 'subspecies', TARGET_COLUMN]
    columns = tf.decode_csv(record, record_defaults=column_defaults)
    return dict(zip(column_names, columns))


def _get_features_target_tuple(features):
    """Separates features from target.

    Args:
        features: Dictionary with all columns.

    Returns:
        A tuple of a dictionary of features and the target.
    """
    target = features.pop(TARGET_COLUMN, None)
    return features, target


def _load_image(image_path):
    """Loads, encodes, and resizes an image.

    Args:
        image_path: String with a path to an image.

    Returns:
        tensor representing the image.
    """
    image_string = tf.read_file(image_path)
    image_decoded = tf.image.decode_png(image_string, channels=3)
    image_resized = tf.image.resize_images(
        image_decoded,
        [IMAGE_SIZE, IMAGE_SIZE])
    return image_resized


def _create_image_path(image_path, image_id):
    """Generates path to a specific image.

    Args:
        image_path: String with path to the folder containing training images.
        image_id: String representing name of the file.

    Returns:
        String with path to the specific image.
    """
    return image_path + image_id


def _process_features(features, image_path):
    """Includes processed image in the features.

    Folder is expected to contain an image file for each record named the same
    as the row id.

    Args:
        features: Dictionary with data features.
        image_path: String with path to the folder containing training images.

    Returns:
        a features dict augmented or transformed by this function's processing.
    """
    features['image'] = _load_image(
        _create_image_path(
            image_path,
            tf.reshape(features['img_file'], [])))
    return features


def _generate_input_fn(file_path, image_path, shuffle, batch_size, num_epochs):
    """Generates a data input function.

    Args:
        file_path: String with path to the data.
        image_path: String with path to image folder.
        shuffle: Boolean flag specifying if data should be shuffled.
        batch_size: Number of records to be read at a time.
        num_epochs: Number of times to go through all of the records.

    Returns:
        A function used by `Estimator` to read data.
    """
    def _input_fn():
        """Returns features and target from input data.

        Defines the input dataset, specifies how to read the data, and reads it.

        Returns:
            A tuple os a dictionary containing the features and the target.
        """
        num_threads = multiprocessing.cpu_count()
        dataset = tf.data.TextLineDataset(filenames=[file_path])
        dataset = dataset.skip(1)
        dataset = dataset.map(
            lambda x: _parse_csv(tf.expand_dims(x, -1)),
            num_parallel_calls=num_threads)
        dataset = dataset.map(
            lambda x: _process_features(x, image_path),
            num_parallel_calls=num_threads)
        dataset = dataset.map(
            _get_features_target_tuple,
            num_parallel_calls=num_threads)
        if shuffle:
            dataset = dataset.shuffle(SHUFFLE_BUFFER_SIZE)
        dataset = dataset.batch(batch_size)
        dataset = dataset.repeat(num_epochs)
        dataset = dataset.prefetch(1)
        iterator = dataset.make_one_shot_iterator()
        features, target = iterator.get_next()
        return features, target
    return _input_fn


def _get_serving_function(image_path):
    """Creates a serving function.

    Args:
        image_path: String with path to image folder.

    Returns:
        Serving function to be used during inference.
    """
    def _csv_serving_input_fn():
        """Creates a `ServingInputReceiver` for inference.

        Creates a  placeholder for the record and specifies how to parse the
        features from that record.

        Returns:
            A `ServingInputReceiver`.
        """
        csv_row = tf.placeholder(
            shape=[None],
            dtype=tf.string
        )

        features = _parse_csv(csv_row)
        features, _ = _get_features_target_tuple(features)
        features['image'] = tf.map_fn(
            _load_image,
            _create_image_path(image_path, features['img_file']),
            dtype=tf.float32)

        return tf.estimator.export.ServingInputReceiver(
            features=features,
            receiver_tensors={'csv_row': csv_row})

    return _csv_serving_input_fn


def get_train_spec(training_path, image_path, batch_size, max_steps):
    """Creates a `TrainSpec` for the `Estimaor`.

    Args:
        training_path: String with path to training data.
        image_path: String with path to image folder.
        batch_size: Number of records to be read at a time.
        max_steps: Maximum number of steps to take during training.

    Returns:
        A Train Spec.
    """
    return tf.estimator.TrainSpec(
        input_fn=_generate_input_fn(
            training_path,
            image_path,
            shuffle=True,
            batch_size=batch_size,
            num_epochs=None),
        max_steps=max_steps)


def get_eval_spec(validation_path, image_path, batch_size):
    """Creates an `EvalSpec` for the `Estimaor`.

    Args:
        validation_path: String with path to validation data.
        image_path: String with path to image folder.
        batch_size: Number of records to be read at a time.

    Returns:
        An Eval Spec.
    """
    exporter = tf.estimator.FinalExporter(
        'estimator',
        _get_serving_function(image_path),
        as_text=False)
    return tf.estimator.EvalSpec(
        input_fn=_generate_input_fn(
            validation_path,
            image_path,
            shuffle=False,
            batch_size=batch_size,
            num_epochs=None),
        exporters=[exporter],
        name='estimator-eval')
