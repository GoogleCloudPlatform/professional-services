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
"""Test model functions."""

import sys
import logging
import tensorflow as tf

from src.model_training import model, defaults

root = logging.getLogger()
root.setLevel(logging.INFO)
handler = logging.StreamHandler(sys.stdout)
handler.setLevel(logging.INFO)
root.addHandler(handler)

EXPECTED_HYPERPARAMS_KEYS = [
    "hidden_units",
    "learning_rate",
    "batch_size",
    "num_epochs",
]


def test_hyperparams_defaults():
  hyperparams = {"hidden_units": [64, 32]}

  hyperparams = defaults.update_hyperparams(hyperparams)
  assert set(hyperparams.keys()) == set(EXPECTED_HYPERPARAMS_KEYS)


def test_create_model():

  hyperparams = hyperparams = defaults.update_hyperparams({})

  model_inputs = {
      "V1": tf.convert_to_tensor([-0.9066112, -0.9066112, -0.9066112]),
      "V2": tf.convert_to_tensor([-0.9066112, -0.9066112, -0.9066112]),
      "V3": tf.convert_to_tensor([-0.9066112, -0.9066112, -0.9066112]),
      "V4": tf.convert_to_tensor([-0.9066112, -0.9066112, -0.9066112]),
      "V5": tf.convert_to_tensor([-0.9066112, -0.9066112, -0.9066112]),
      "V6": tf.convert_to_tensor([-0.9066112, -0.9066112, -0.9066112]),
      "V7": tf.convert_to_tensor([-0.9066112, -0.9066112, -0.9066112]),
      "V8": tf.convert_to_tensor([-0.9066112, -0.9066112, -0.9066112]),
      "V9": tf.convert_to_tensor([-0.9066112, -0.9066112, -0.9066112]),
      "V10": tf.convert_to_tensor([-0.9066112, -0.9066112, -0.9066112]),
      "V11": tf.convert_to_tensor([-0.9066112, -0.9066112, -0.9066112]),
      "V12": tf.convert_to_tensor([-0.9066112, -0.9066112, -0.9066112]),
      "V13": tf.convert_to_tensor([-0.9066112, -0.9066112, -0.9066112]),
      "V14": tf.convert_to_tensor([-0.9066112, -0.9066112, -0.9066112]),
      "V15": tf.convert_to_tensor([-0.9066112, -0.9066112, -0.9066112]),
      "V16": tf.convert_to_tensor([-0.9066112, -0.9066112, -0.9066112]),
      "V17": tf.convert_to_tensor([-0.9066112, -0.9066112, -0.9066112]),
      "V18": tf.convert_to_tensor([-0.9066112, -0.9066112, -0.9066112]),
      "V19": tf.convert_to_tensor([-0.9066112, -0.9066112, -0.9066112]),
      "V20": tf.convert_to_tensor([-0.9066112, -0.9066112, -0.9066112]),
      "V21": tf.convert_to_tensor([-0.9066112, -0.9066112, -0.9066112]),
      "V22": tf.convert_to_tensor([-0.9066112, -0.9066112, -0.9066112]),
      "V23": tf.convert_to_tensor([-0.9066112, -0.9066112, -0.9066112]),
      "V24": tf.convert_to_tensor([-0.9066112, -0.9066112, -0.9066112]),
      "V25": tf.convert_to_tensor([-0.9066112, -0.9066112, -0.9066112]),
      "V26": tf.convert_to_tensor([-0.9066112, -0.9066112, -0.9066112]),
      "V27": tf.convert_to_tensor([-0.9066112, -0.9066112, -0.9066112]),
      "V28": tf.convert_to_tensor([-0.9066112, -0.9066112, -0.9066112]),
      "Amount": tf.convert_to_tensor([10, 100, 1000]),
  }

  classifier = model.create_model(model_inputs.keys(), hyperparams)
  model_outputs = classifier(model_inputs)  # .numpy()
  assert model_outputs.shape == (3, 1)
  assert model_outputs.dtype == "float32"
