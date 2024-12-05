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
"""TFX pipeline configurations."""

import os
from tfx import v1 as tfx

PROJECT = os.getenv("PROJECT", "")
REGION = os.getenv("REGION", "")
GCS_LOCATION = os.getenv("GCS_LOCATION", "")
DOCKER_REPO_NAME = os.getenv("DOCKER_REPO_NAME", "docker-repo")

ARTIFACT_STORE_URI = os.path.join(GCS_LOCATION, "tfx_artifacts")
MODEL_REGISTRY_URI = os.getenv(
    "MODEL_REGISTRY_URI",
    os.path.join(GCS_LOCATION, "model_registry"),
)

VERTEX_DATASET_NAME = os.getenv("VERTEX_DATASET_NAME", "creditcards")
MODEL_DISPLAY_NAME = os.getenv(
    "MODEL_DISPLAY_NAME", f"{VERTEX_DATASET_NAME}-classifier"
)
PIPELINE_NAME = os.getenv("PIPELINE_NAME", f"{MODEL_DISPLAY_NAME}-train-pipeline")

ML_USE_COLUMN = "ml_use"
EXCLUDE_COLUMNS = ",".join(["trip_start_timestamp"])
TRAIN_LIMIT = os.getenv("TRAIN_LIMIT", "0")
TEST_LIMIT = os.getenv("TEST_LIMIT", "0")
SERVE_LIMIT = os.getenv("SERVE_LIMIT", "0")

NUM_TRAIN_SPLITS = os.getenv("NUM_TRAIN_SPLITS", "4")
NUM_EVAL_SPLITS = os.getenv("NUM_EVAL_SPLITS", "1")
ACCURACY_THRESHOLD = os.getenv("ACCURACY_THRESHOLD", "0.8")

USE_KFP_SA = os.getenv("USE_KFP_SA", "False")

TFX_IMAGE_URI = os.getenv(
    "TFX_IMAGE_URI", f"{REGION}-docker.pkg.dev/{PROJECT}/{DOCKER_REPO_NAME}/vertex:latest"
)

DATAFLOW_IMAGE_URI = os.getenv(
    "DATAFLOW_IMAGE_URI", f"{REGION}-docker.pkg.dev/{PROJECT}/{DOCKER_REPO_NAME}/dataflow:latest"
)

BEAM_RUNNER = os.getenv("BEAM_RUNNER", "DirectRunner")
SERVICE_ACCOUNT = os.getenv("SERVICE_ACCOUNT", "")
SUBNETWORK = os.getenv("SUBNETWORK", "")

BEAM_DIRECT_PIPELINE_ARGS = [
    f"--project={PROJECT}",
    f"--temp_location={os.path.join(GCS_LOCATION, 'temp')}",
]
BEAM_DATAFLOW_PIPELINE_ARGS = [
    f"--project={PROJECT}",
    f"--temp_location={os.path.join(GCS_LOCATION, 'temp')}",
    f"--region={REGION}",
    f"--runner={BEAM_RUNNER}",
    f"--service_account_email={SERVICE_ACCOUNT}",
    f"--no_use_public_ips",
    f"--subnetwork={SUBNETWORK}",
    f"--sdk_container_image={DATAFLOW_IMAGE_URI}"
]

TRAINING_RUNNER = os.getenv("TRAINING_RUNNER", "local")
VERTEX_TRAINING_ARGS = {
    'project': PROJECT,
    'worker_pool_specs': [{
        'machine_spec': {
            'machine_type': 'n1-standard-4',
#             'accelerator_type': 'NVIDIA_TESLA_K80',
#             'accelerator_count': 1
        },
        'replica_count': 1,
        'container_spec': {
            'image_uri': TFX_IMAGE_URI,
        },
    }],
}
VERTEX_TRAINING_CONFIG = {
    tfx.extensions.google_cloud_ai_platform.ENABLE_UCAIP_KEY: True,
    tfx.extensions.google_cloud_ai_platform.UCAIP_REGION_KEY: REGION,
    tfx.extensions.google_cloud_ai_platform.TRAINING_ARGS_KEY: VERTEX_TRAINING_ARGS,
    'use_gpu': False,
}

SERVING_RUNTIME = os.getenv("SERVING_RUNTIME", "tf2-cpu.2-5")
SERVING_IMAGE_URI = f"us-docker.pkg.dev/vertex-ai/prediction/{SERVING_RUNTIME}:latest"

BATCH_PREDICTION_BQ_DATASET_NAME = os.getenv(
    "BATCH_PREDICTION_BQ_DATASET_NAME", "playground_us"
)
BATCH_PREDICTION_BQ_TABLE_NAME = os.getenv(
    "BATCH_PREDICTION_BQ_TABLE_NAME", "chicago_taxitrips_prep"
)
BATCH_PREDICTION_BEAM_ARGS = {
    "runner": f"{BEAM_RUNNER}",
    "temporary_dir": os.path.join(GCS_LOCATION, "temp"),
    "gcs_location": os.path.join(GCS_LOCATION, "temp"),
    "project": PROJECT,
    "region": REGION,
    "setup_file": "./setup.py",
}
BATCH_PREDICTION_JOB_RESOURCES = {
    "machine_type": "n1-standard-2",
    #'accelerator_count': 1,
    #'accelerator_type': 'NVIDIA_TESLA_T4'
    "starting_replica_count": 1,
    "max_replica_count": 10,
}
DATASTORE_PREDICTION_KIND = f"{MODEL_DISPLAY_NAME}-predictions"

ENABLE_CACHE = os.getenv("ENABLE_CACHE", "0")
UPLOAD_MODEL = os.getenv("UPLOAD_MODEL", "1")

os.environ["PROJECT"] = PROJECT
os.environ["PIPELINE_NAME"] = PIPELINE_NAME
os.environ["DATAFLOW_IMAGE_URI"] = DATAFLOW_IMAGE_URI
os.environ["TFX_IMAGE_URI"] = TFX_IMAGE_URI
os.environ["MODEL_REGISTRY_URI"] = MODEL_REGISTRY_URI
