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
"""TFX Custom Python Components."""


import sys
import os
import json
import logging
import tensorflow as tf

from tfx.types import artifact_utils
from tfx.utils import io_utils
from tfx.components.util import model_utils
from tfx.dsl.component.experimental.decorators import component
from tfx.dsl.component.experimental.annotations import (
    InputArtifact,
    OutputArtifact,
    Parameter,
)
from tfx.types.standard_artifacts import HyperParameters, ModelBlessing
from tfx.types.experimental.simple_artifacts import File as UploadedModel

from google.cloud import aiplatform as vertex_ai


SCRIPT_DIR = os.path.dirname(
    os.path.realpath(os.path.join(os.getcwd(), os.path.expanduser(__file__)))
)
sys.path.append(os.path.normpath(os.path.join(SCRIPT_DIR, "..")))


HYPERPARAM_FILENAME = "hyperparameters.json"
SERVING_DATA_PREFIX = "serving-data-"
PREDICTION_RESULTS_PREFIX = "prediction.results-*"


@component
def hyperparameters_gen(
    num_epochs: Parameter[int],
    batch_size: Parameter[int],
    steps_per_epoch: Parameter[int],
    learning_rate: Parameter[float],
    hidden_units: Parameter[str],
    hyperparameters: OutputArtifact[HyperParameters],
):

    hp_dict = dict()
    hp_dict["num_epochs"] = num_epochs
    hp_dict["steps_per_epoch"] = steps_per_epoch
    hp_dict["batch_size"] = batch_size
    hp_dict["learning_rate"] = learning_rate
    hp_dict["hidden_units"] = [int(units) for units in hidden_units.split(",")]
    logging.info(f"Hyperparameters: {hp_dict}")

    hyperparams_uri = os.path.join(
        artifact_utils.get_single_uri([hyperparameters]), HYPERPARAM_FILENAME
    )
    io_utils.write_string_file(hyperparams_uri, json.dumps(hp_dict))
    logging.info(f"Hyperparameters are written to: {hyperparams_uri}")


@component
def vertex_model_uploader(
    project: Parameter[str],
    region: Parameter[str],
    model_display_name: Parameter[str],
    pushed_model_location: Parameter[str],
    serving_image_uri: Parameter[str],
    model_blessing: InputArtifact[ModelBlessing],
    uploaded_model: OutputArtifact[UploadedModel],
    explanation_config: Parameter[str]="",
    labels: Parameter[str]="",
):

    vertex_ai.init(project=project, location=region)
    
    blessing = artifact_utils.get_single_instance([model_blessing])
    if not model_utils.is_model_blessed(blessing):
        logging.info(f"Model is not uploaded to Vertex AI because it was not blessed by the evaluator.")
        uploaded_model.set_int_custom_property("uploaded", 0)
        return

    pushed_model_dir = os.path.join(
        pushed_model_location, tf.io.gfile.listdir(pushed_model_location)[-1]
    )

    logging.info(f"Model registry location: {pushed_model_dir}")

    try:
        explanation_config = json.loads(explanation_config)
        explanation_metadata = vertex_ai.explain.ExplanationMetadata(
            inputs=explanation_config["inputs"],
            outputs=explanation_config["outputs"],
        )
        explanation_parameters = vertex_ai.explain.ExplanationParameters(
            explanation_config["params"]
        )
    except:
        explanation_metadata = None
        explanation_parameters = None
        
    try:
        labels = json.loads(labels)
    except:
        labels = None

    vertex_model = vertex_ai.Model.upload(
        display_name=model_display_name,
        artifact_uri=pushed_model_dir,
        serving_container_image_uri=serving_image_uri,
        parameters_schema_uri=None,
        instance_schema_uri=None,
        explanation_metadata=explanation_metadata,
        explanation_parameters=explanation_parameters,
        labels=labels
    )

    model_uri = vertex_model.gca_resource.name
    logging.info(f"Model uploaded to Vertex AI: {model_uri}")
    uploaded_model.set_string_custom_property("model_uri", model_uri)
    uploaded_model.set_int_custom_property("uploaded", 1)
