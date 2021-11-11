"""Classes to demonstrate how to write unit tests for TensorFlow code.
"""
# Copyright 2020 Google Inc. All Rights Reserved.

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

from unittest.mock import patch

import numpy as np
import pandas as pd
import tensorflow as tf
from tensorflow.python.keras import testing_utils
from tensorflow.python.keras import initializers

import example


class LinearBlockFullTest(tf.test.TestCase):
    """Example how to use testing_utils to test a custom keras layer.
    """

    def test_basic(self):
        testing_utils.layer_test(example.LinearBlockFull, input_shape=(4, 32))

    def test_output(self):
        batch_size, dim, output_dim = (3, 4, 2)
        testing_utils.layer_test(example.LinearBlockFull,
                                 kwargs={'units': output_dim},
                                 input_data=np.ones((batch_size, dim)),
                                 expected_output_dtype='float32')


class LinearBlockTest(tf.test.TestCase):
    """Example how to partially test a custom keras layer.
    """

    def test_shape_default(self):
        x = np.ones((4, 32))
        layer = example.LinearBlock()
        output = layer(x)
        self.assertAllEqual(output.shape, (4, 32))

    def test_shape(self):
        batch_size, input_dim, output_dim = (4, 15, 15)
        x = np.ones((batch_size, input_dim))
        layer = example.LinearBlock(output_dim)
        output = layer(x)
        self.assertAllEqual(output.shape, (batch_size, output_dim))

    def test_shape_multidim(self):
        batch_size, input_dim, output_dim = (4, 15, 15)
        x = np.ones((batch_size, 7, input_dim))
        layer = example.LinearBlock(output_dim)
        output = layer(x)
        self.assertAllEqual(output.shape, (batch_size, 7, output_dim))

    def test_output(self):
        batch_size, input_dim, output_dim = (3, 4, 4)
        x = np.ones((batch_size, input_dim))
        layer = example.LinearBlock(output_dim)
        output = layer(x)
        expected_output = np.array([[0.1250, -0.0576, 0.0513, -0.0305]] *
                                   batch_size)
        self.assertAllClose(output, expected_output, atol=1e-4)

    @patch.object(initializers, 'get',
                  lambda _: tf.compat.v1.keras.initializers.Ones)
    def test_output_ones(self):
        batch_size, input_dim, output_dim = (3, 4, 4)
        x = np.ones((batch_size, input_dim, output_dim))
        layer = example.LinearBlock(output_dim)
        output = layer(x)
        expected_output = (np.ones(
            (batch_size, input_dim, output_dim)) * (output_dim + 1))
        self.assertAllClose(output, expected_output, atol=1e-4)


class ExampleModelTest(tf.test.TestCase):
    """Example how to test a keras model on a faked dataset.
    """

    def _get_data(self):
        link = 'http://archive.ics.uci.edu/ml/machine-learning-databases/auto-mpg/auto-mpg.data'  # noqa: E501
        dataset_path = tf.keras.utils.get_file('auto-mpg.data', link)
        column_names = [
            'MPG', 'Cylinders', 'Displacement', 'Horsepower', 'Weight',
            'Acceleration', 'Model Year', 'Origin'
        ]
        dataset = pd.read_csv(dataset_path,
                              names=column_names,
                              na_values='?',
                              comment='\t',
                              sep=' ',
                              skipinitialspace=True)
        dataset = dataset.dropna()
        dataset['Origin'] = dataset['Origin'].map({
            1: 'USA',
            2: 'Europe',
            3: 'Japan'
        })
        dataset = pd.get_dummies(dataset, prefix='', prefix_sep='')
        dataset = dataset[dataset.columns].astype('float64')
        labels = dataset.pop('MPG')
        return dataset, labels

    def test_basic(self):
        train_features, train_labels = self._get_data()
        dim = len(train_features.keys())
        example_model = example.get_model(dim)
        test_ind = train_features.sample(10).index
        test_dataset, test_labels = (train_features.iloc[test_ind],
                                     train_labels.iloc[test_ind])
        history = example_model.fit(train_features,
                                    train_labels,
                                    steps_per_epoch=2,
                                    epochs=2,
                                    batch_size=10,
                                    validation_split=0.1,
                                    validation_steps=1)
        self.assertAlmostEqual(history.history['mse'][-1],
                               history.history['loss'][-1],
                               places=2)
        example_model.evaluate(test_dataset, test_labels)
        example_model.predict(test_dataset)


if __name__ == '__main__':
    tf.test.main()
