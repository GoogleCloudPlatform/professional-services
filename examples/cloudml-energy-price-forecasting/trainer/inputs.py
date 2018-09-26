#!/usr/bin/env python
#Copyright 2018 Google LLC
#
#Licensed under the Apache License, Version 2.0 (the "License");
#you may not use this file except in compliance with the License.
#You may obtain a copy of the License at
#
#     http://www.apache.org/licenses/LICENSE-2.0
#
#Unless required by applicable law or agreed to in writing, software
#distributed under the License is distributed on an "AS IS" BASIS,
#WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
#See the License for the specific language governing permissions and
#limitations under the License.
# ==============================================================================
"""Takes care of all the input data for the model.

  Parses columns and generates input specifications for `Estimator`.

  Typical usage example:

  inputs.get_train_spec(parameters)
  inputs.get_eval_spec(parameters)
"""

import multiprocessing

import tensorflow as tf

from constants import constants

TARGET_COLUMN = 'price'
SHUFFLE_BUFFER_SIZE = 200


def parse_csv(record):
    """Parses columns from comma separated record.

    Defines default values and column names for columns.

    Args:
        record: String representation of the record.

    Returns:
        A dictionary with all column names and values for the record.
    """
    distribution_defaults = [[0.0] for _ in range(constants.DISTRIBUTION_SIZE)]
    weather_defaults = [[0.0] for _ in range(constants.WEATHER_SIZE)]
    distribution_cols = ['distribution' +
                         str(i) for i in range(constants.DISTRIBUTION_SIZE)]
    weather_cols = ['weather' + str(i) for i in range(constants.WEATHER_SIZE)]
    header_def = [[0.0], [''], [0], [0]] + \
        distribution_defaults + weather_defaults
    column_names = [TARGET_COLUMN, 'date', 'day',
                    'hour'] + distribution_cols + weather_cols
    columns = tf.decode_csv(record, record_defaults=header_def)
    return dict(zip(column_names, columns))


def get_features_target_tuple(features):
    """Returns features and target.

    Args:
        features: Dictionary with all columns.

    Returns:
        A tuple of a dictionary of features and the target.
    """
    target = features.pop(TARGET_COLUMN, None)
    return features, target


def generate_input_fn(file_path, shuffle, batch_size, num_epochs):
    """Generates a data input function.

    Args:
        file_path: Path to the data.
        shuffle: Boolean flag specifying if data should be shuffled.
        batch_size: Number of records to be read at a time.
        num_epochs: Number of times to go through all of the records.

    Returns:
        A function useed by `Estimator` to read data.
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
        dataset = dataset.map(lambda x: parse_csv(
            tf.expand_dims(x, -1)), num_parallel_calls=num_threads)
        dataset = dataset.map(get_features_target_tuple,
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


def csv_serving_input_fn():
    """Creates a `ServingInputReceiver` for inference.

    Creates a  placeholder for the record and specifies how to parse the
    features from that record.

    Returns:
        A `ServingInputReceiver`.
    """
    csv_row = tf.placeholder(
        dtype=tf.string
    )

    features = parse_csv(csv_row)
    features, _ = get_features_target_tuple(features)

    return tf.estimator.export.ServingInputReceiver(
        features=features,
        receiver_tensors={'csv_row': csv_row})


def get_train_spec(training_path, batch_size, max_steps):
    """Creates a `TrainSpec` for the `Estimaor`.

    Args:
        training_path: Path to training data.
        batch_size: Number of records to be read at a time.
        max_steps: Maximum number of steps to take during training.

    Returns:
        A Train Spec.
    """
    return tf.estimator.TrainSpec(
        input_fn=generate_input_fn(
            training_path,
            shuffle=True,
            batch_size=batch_size,
            num_epochs=None),
        max_steps=max_steps)


def get_eval_spec(validation_path, batch_size):
    """Creates an `EvalSpec` for the `Estimaor`.

    Args:
        training_path: Path to validation data.
        batch_size: Number of records to be read at a time.

    Returns:
        An Eval Spec.
    """
    exporter = tf.estimator.FinalExporter(
        'estimator',
        csv_serving_input_fn,
        as_text=False)
    return tf.estimator.EvalSpec(
        input_fn=generate_input_fn(
            validation_path,
            shuffle=False,
            batch_size=batch_size,
            num_epochs=None),
        exporters=[exporter],
        name='estimator-eval')
