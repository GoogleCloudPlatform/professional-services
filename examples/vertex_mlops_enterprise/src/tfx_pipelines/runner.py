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
"""Define KubeflowV2DagRunner to run the training pipeline using Managed Pipelines."""


import os
from tfx.orchestration import data_types
from tfx.orchestration.kubeflow.v2 import kubeflow_v2_dag_runner


from src.tfx_pipelines import config, training_pipeline
from src.model_training import defaults


def compile_training_pipeline(pipeline_definition_file):

    pipeline_root = os.path.join(
        config.ARTIFACT_STORE_URI,
        config.PIPELINE_NAME,
    )
    managed_pipeline = training_pipeline.create_pipeline(
        pipeline_root=pipeline_root,
        num_epochs=data_types.RuntimeParameter(
            name="num_epochs",
            default=defaults.NUM_EPOCHS,
            ptype=int,
        ),
        batch_size=data_types.RuntimeParameter(
            name="batch_size",
            default=defaults.BATCH_SIZE,
            ptype=int,
        ),
        steps_per_epoch=data_types.RuntimeParameter(
            name="steps_per_epoch",
            default=int(config.TRAIN_LIMIT) // defaults.BATCH_SIZE,
            ptype=int,
        ),
        learning_rate=data_types.RuntimeParameter(
            name="learning_rate",
            default=defaults.LEARNING_RATE,
            ptype=float,
        ),
        hidden_units=data_types.RuntimeParameter(
            name="hidden_units",
            default=",".join(str(u) for u in defaults.HIDDEN_UNITS),
            ptype=str,
        ),
    )

    runner = kubeflow_v2_dag_runner.KubeflowV2DagRunner(
        config=kubeflow_v2_dag_runner.KubeflowV2DagRunnerConfig(
            default_image=config.TFX_IMAGE_URI
        ),
        output_filename=pipeline_definition_file,
    )

    return runner.run(managed_pipeline, write_out=True)
