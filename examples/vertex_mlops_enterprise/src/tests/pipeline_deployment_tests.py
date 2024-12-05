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
"""Test training pipeline using local runner."""

import sys
import os
from tfx.orchestration.local.local_dag_runner import LocalDagRunner
import tensorflow as tf
from ml_metadata.proto import metadata_store_pb2
import logging

from src.tfx_pipelines import config
from src.tfx_pipelines import training_pipeline

root = logging.getLogger()
root.setLevel(logging.INFO)
handler = logging.StreamHandler(sys.stdout)
handler.setLevel(logging.INFO)
root.addHandler(handler)

MLMD_SQLLITE = "mlmd.sqllite"
NUM_EPOCHS = 1
BATCH_SIZE = 512
LEARNING_RATE = 0.001
HIDDEN_UNITS = "128,128"


def test_e2e_pipeline():

  project = os.getenv("PROJECT")
  region = os.getenv("REGION")
  model_display_name = os.getenv("MODEL_DISPLAY_NAME")
  dataset_display_name = os.getenv("VERTEX_DATASET_NAME")
  gcs_location = os.getenv("GCS_LOCATION")
  model_registry = os.getenv("MODEL_REGISTRY_URI")
  upload_model = os.getenv("UPLOAD_MODEL")

  assert project, "Environment variable PROJECT is None!"
  assert region, "Environment variable REGION is None!"
  assert dataset_display_name, \
      "Environment variable VERTEX_DATASET_NAME is None!"
  assert model_display_name, "Environment variable MODEL_DISPLAY_NAME is None!"
  assert gcs_location, "Environment variable GCS_LOCATION is None!"
  assert model_registry, "Environment variable MODEL_REGISTRY_URI is None!"

  logging.info("upload_model: %s", upload_model)
  if tf.io.gfile.exists(gcs_location):
    tf.io.gfile.rmtree(gcs_location)
  logging.info("Pipeline e2e test artifacts stored in: %s", gcs_location)

  if tf.io.gfile.exists(MLMD_SQLLITE):
    tf.io.gfile.remove(MLMD_SQLLITE)

  metadata_connection_config = metadata_store_pb2.ConnectionConfig()
  metadata_connection_config.sqlite.filename_uri = MLMD_SQLLITE
  metadata_connection_config.sqlite.connection_mode = 3
  logging.info("ML metadata store is ready.")

  pipeline_root = os.path.join(
      config.ARTIFACT_STORE_URI,
      config.PIPELINE_NAME,
  )

  runner = LocalDagRunner()

  pipeline = training_pipeline.create_pipeline(
      pipeline_root=pipeline_root,
      num_epochs=NUM_EPOCHS,
      batch_size=BATCH_SIZE,
      steps_per_epoch=100,
      learning_rate=LEARNING_RATE,
      hidden_units=HIDDEN_UNITS,
      metadata_connection_config=metadata_connection_config,
  )

  runner.run(pipeline)

  logging.info(
      "Model output: %s",  os.path.join(model_registry, model_display_name))
  assert tf.io.gfile.exists(os.path.join(model_registry, model_display_name))
