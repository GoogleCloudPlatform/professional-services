"""Classes to demonstrate how to write unit tests for TensorFlow code."""
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

from absl import logging

import tensorflow as tf


@tf.keras.utils.register_keras_serializable(package='Custom')
class LinearBlockFull(tf.keras.layers.Layer):
    """Custom keras liner Layer (serializable)."""

    def __init__(self, units=32, **kwargs):
        super(LinearBlockFull, self).__init__(**kwargs)
        self.units = units

    def build(self, input_shape):
        self.w = self.add_weight(shape=(input_shape[-1], self.units),
                                 initializer='random_normal',
                                 trainable=True)
        self.b = self.add_weight(shape=(self.units,),
                                 initializer='zeros',
                                 trainable=True)

    def call(self, inputs):
        return tf.matmul(inputs, self.w) + self.b

    def get_config(self):
        config = super(LinearBlockFull, self).get_config()
        custom_config = {'units': self.units}
        config.update(custom_config)
        return config


class LinearBlock(tf.keras.layers.Layer):
    """Custom keras liner Layer."""

    def __init__(self, units=32):
        super(LinearBlock, self).__init__()
        self.units = units

    def build(self, input_shape):
        self.w = self.add_weight(shape=(input_shape[-1], self.units),
                                 initializer='random_normal',
                                 trainable=True)
        self.b = self.add_weight(shape=(self.units,),
                                 initializer='zeros',
                                 trainable=True)

    def call(self, inputs):
        return tf.matmul(inputs, self.w) + self.b


def get_model(dim):
    """Creates a keras model.

    Args:
        dim: a dimension of an input vector
    Returns:
         A complied keras model used in tutorial.
    """
    model = tf.keras.Sequential([
        tf.keras.layers.Dense(64, activation='relu', input_shape=[dim]),
        tf.keras.layers.Dense(32, activation='relu'),
        tf.keras.layers.Dense(1)
    ])
    model.summary(print_fn=logging.info)
    optimizer = tf.keras.optimizers.RMSprop(0.001)
    model.compile(loss='mse', optimizer=optimizer, metrics=['mae', 'mse'])
    return model
