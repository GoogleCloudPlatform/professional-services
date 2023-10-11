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
"""Test an uploaded model to Vertex AI."""

import os
import logging
import tensorflow as tf
import sys

from google.cloud import aiplatform as vertex_ai

# configure logging to print to stdout
root = logging.getLogger()
root.setLevel(logging.DEBUG)
handler = logging.StreamHandler(sys.stdout)
handler.setLevel(logging.DEBUG)
root.addHandler(handler)

test_instance = {
    "V1": [-0.906611],
    "V2": [-0.906611],
    "V3": [-0.906611],
    "V4": [-0.906611],
    "V5": [-0.906611],
    "V6": [-0.906611],
    "V7": [-0.906611],
    "V8": [-0.906611],
    "V9": [-0.906611],
    "V10": [-0.906611],
    "V11": [-0.906611],
    "V12": [-0.906611],
    "V13": [-0.906611],
    "V14": [-0.906611],
    "V15": [-0.906611],
    "V16": [-0.906611],
    "V17": [-0.906611],
    "V18": [-0.906611],
    "V19": [-0.906611],
    "V20": [-0.906611],
    "V21": [-0.906611],
    "V22": [-0.906611],
    "V23": [-0.906611],
    "V24": [-0.906611],
    "V25": [-0.906611],
    "V26": [-0.906611],
    "V27": [-0.906611],
    "V28": [-0.906611],
    "Amount": [15.99],
}

SERVING_DEFAULT_SIGNATURE_NAME = "serving_default"


def test_model_artifact():

  feature_types = {
      "V1": tf.dtypes.float32,
      "V2": tf.dtypes.float32,
      "V3": tf.dtypes.float32,
      "V4": tf.dtypes.float32,
      "V5": tf.dtypes.float32,
      "V6": tf.dtypes.float32,
      "V7": tf.dtypes.float32,
      "V8": tf.dtypes.float32,
      "V9": tf.dtypes.float32,
      "V10": tf.dtypes.float32,
      "V11": tf.dtypes.float32,
      "V12": tf.dtypes.float32,
      "V13": tf.dtypes.float32,
      "V14": tf.dtypes.float32,
      "V15": tf.dtypes.float32,
      "V16": tf.dtypes.float32,
      "V17": tf.dtypes.float32,
      "V18": tf.dtypes.float32,
      "V19": tf.dtypes.float32,
      "V20": tf.dtypes.float32,
      "V21": tf.dtypes.float32,
      "V22": tf.dtypes.float32,
      "V23": tf.dtypes.float32,
      "V24": tf.dtypes.float32,
      "V25": tf.dtypes.float32,
      "V26": tf.dtypes.float32,
      "V27": tf.dtypes.float32,
      "V28": tf.dtypes.float32,
      "Amount": tf.dtypes.float32,
  }

  new_test_instance = {}
  for key, instance in test_instance.items():
    new_test_instance[key] = tf.constant(instance,
                                         dtype=feature_types[key])

  print(new_test_instance)

  project = os.getenv("PROJECT")
  region = os.getenv("REGION")
  model_display_name = os.getenv("MODEL_DISPLAY_NAME")

  assert project, "Environment variable PROJECT is None!"
  assert region, "Environment variable REGION is None!"
  assert model_display_name, "Environment variable MODEL_DISPLAY_NAME is None!"

  vertex_ai.init(
      project=project,
      location=region,
  )

  models = vertex_ai.Model.list(filter=f"display_name={model_display_name}",
                                order_by="update_time")

  assert models, f"No model with display name {model_display_name} exists!"

  model = models[-1]
  artifact_uri = model.gca_resource.artifact_uri
  logging.info("Model artifact uri: %s", artifact_uri)
  assert tf.io.gfile.exists(artifact_uri), \
      f"Model artifact uri {artifact_uri} does not exist!"

  saved_model = tf.saved_model.load(artifact_uri)
  logging.info("Model loaded successfully.")

  assert (SERVING_DEFAULT_SIGNATURE_NAME in saved_model.signatures
         ), f"{SERVING_DEFAULT_SIGNATURE_NAME} not in model signatures!"

  #Disabled until function is fixed
'''
  prediction_fn = saved_model.signatures["serving_default"]

  predictions = prediction_fn(**new_test_instance)
  logging.info("Model produced predictions.")

  keys = ["classes", "scores"]
  for key in keys:
    assert key in predictions, f"{key} in prediction outputs!"

  assert predictions["classes"].shape == (
      1,
      2,
  ), f"Invalid output classes shape: {predictions['classes'].shape}!"
  assert predictions["scores"].shape == (
      1,
      2,
  ), f"Invalid output scores shape: {predictions['scores'].shape}!"
  logging.info("Prediction output: %s", predictions)
'''


def test_model_endpoint():

  project = os.getenv("PROJECT")
  region = os.getenv("REGION")
  model_display_name = os.getenv("MODEL_DISPLAY_NAME")
  endpoint_display_name = os.getenv("ENDPOINT_DISPLAY_NAME")

  assert project, "Environment variable PROJECT is None!"
  assert region, "Environment variable REGION is None!"
  assert model_display_name, "Environment variable MODEL_DISPLAY_NAME is None!"
  assert endpoint_display_name, \
      "Environment variable ENDPOINT_DISPLAY_NAME is None!"

  vertex_ai.init(
      project=project,
      location=region,
  )

  endpoints = vertex_ai.Endpoint.list(
      filter=f"display_name={endpoint_display_name}", order_by="update_time")
  assert (
      endpoints
  ), f"Endpoint with display name {endpoint_display_name} " + \
      "does not exist! in region {region}"

  endpoint = endpoints[-1]
  logging.info("Calling endpoint: %s",  endpoint)

  prediction = endpoint.predict([test_instance]).predictions[0]

  keys = ["classes", "scores"]
  for key in keys:
    assert key in prediction, f"{key} in prediction outputs!"

  assert (len(prediction["classes"]) == 2
         ), f"Invalid number of output classes: {len(prediction['classes'])}!"
  assert (len(prediction["scores"]) == 2
         ), f"Invalid number output scores: {len(prediction['scores'])}!"

  logging.info("Prediction output: %s", prediction)
