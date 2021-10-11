# Copyright 2021 Google LLC. All Rights Reserved.
#
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

"""Define the batch prediction pipeline on Vertex AI Pipeline."""

import os
import argparse
from functools import partial

import yaml
import jinja2
import kfp
from kfp.v2 import dsl
from kfp.v2.compiler import compiler
from kfp.v2.dsl import Dataset


def _load_custom_component(project_id: str,
                           af_registry_location: str,
                           af_registry_name: str,
                           components_dir: str,
                           component_name: str):
  """Load custom Vertex AI Pipeline component."""
  component_path = os.path.join(components_dir,
                                component_name,
                                'component.yaml.jinja')
  with open(component_path, 'r') as f:
    component_text = jinja2.Template(f.read()).render(
      project_id=project_id,
      af_registry_location=af_registry_location,
      af_registry_name=af_registry_name)

  return kfp.components.load_component_from_text(component_text)


def create_training_pipeline(project_id: str,
                             pipeline_name: str,
                             af_registry_location: str,
                             af_registry_name: str,
                             components_dir: str,
                             pipeline_job_spec_path: str):
  """Creat batch prediction pipeline."""
  load_custom_component = partial(_load_custom_component,
                                  project_id=project_id,
                                  af_registry_location=af_registry_location,
                                  af_registry_name=af_registry_name,
                                  components_dir=components_dir)

  preprocess_op = load_custom_component(component_name='data_preprocess')
  batch_prediction_op = load_custom_component(component_name='batch_prediction')

  @dsl.pipeline(name=pipeline_name)
  def pipeline(project_id: str,
               data_region: str,
               gcs_data_output_folder: str,
               input_dataset_uri: str,
               data_pipeline_root: str,
               gcs_result_folder: str,
               model_resource_name: str = '',
               endpoint_resource_name: str = '',
               machine_type: str = "n1-standard-8",
               accelerator_count: int = 0,
               accelerator_type: str = 'ACCELERATOR_TYPE_UNSPECIFIED',
               starting_replica_count: int = 1,
               max_replica_count: int = 2):
    dataset_importer = kfp.dsl.importer(
      artifact_uri=input_dataset_uri,
      artifact_class=Dataset,
      reimport=False)

    preprocess_task = preprocess_op(
      project_id=project_id,
      data_region=data_region,
      gcs_output_folder=gcs_data_output_folder,
      gcs_output_format="NEWLINE_DELIMITED_JSON",
      input_dataset=dataset_importer.output)

    batch_prediction_op(
      project_id=project_id,
      data_region=data_region,
      data_pipeline_root=data_pipeline_root,
      gcs_result_folder=gcs_result_folder,
      instances_format='jsonl',
      predictions_format='jsonl',
      input_dataset=preprocess_task.outputs['output_dataset'],
      model_resource_name=model_resource_name,
      endpoint_resource_name=endpoint_resource_name,
      machine_type=machine_type,
      accelerator_type=accelerator_type,
      accelerator_count=accelerator_count,
      starting_replica_count=starting_replica_count,
      max_replica_count=max_replica_count)

  compiler.Compiler().compile(
    pipeline_func=pipeline,
    package_path=pipeline_job_spec_path)


if __name__ == "__main__":
  parser = argparse.ArgumentParser()
  parser.add_argument('--config', type=str,
                      help='The config file for setting default values.')

  args = parser.parse_args()

  with open(args.config, 'r') as config_file:
    config = yaml.load(config_file, Loader=yaml.FullLoader)

    create_training_pipeline(
      project_id=config['gcp']['project_id'],
      af_registry_location=config['gcp']['af_registry_location'],
      af_registry_name=config['gcp']['af_registry_name'],
      pipeline_name=config['predict']['name'],
      components_dir=config['pipelines']['pipeline_component_directory'],
      pipeline_job_spec_path=config['predict']['pipeline_job_spec_path'])
