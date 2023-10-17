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
"""A DNN keras classification model."""

import tensorflow as tf
from tensorflow import keras
from tensorflow.keras import layers, activations
import logging

from src.common import features


def create_model(feature_keys, hyperparams) -> keras.Model:
    
    inputs = [layers.Input(shape=(1,), name=f) for f in feature_keys if f != features.TARGET_FEATURE_NAME]
    d = layers.concatenate(inputs)
    
    for units in hyperparams['hidden_units']:
        d = layers.Dense(units, activation=activations.relu)(d)
        
    if 'dropout' in hyperparams:
        d = tf.keras.layers.Dropout(hyperparams['dropout'])(d)
        
    outputs = layers.Dense(1, activation=activations.sigmoid)(d)
    
    model = keras.Model(inputs=inputs, outputs=outputs)

    model.summary(print_fn=logging.info)

    return model
