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

"""Define the training pipeline on Vertex AI Pipeline."""

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
  """Creat training pipeline."""
  load_custom_component = partial(_load_custom_component,
                                  project_id=project_id,
                                  af_registry_location=af_registry_location,
                                  af_registry_name=af_registry_name,
                                  components_dir=components_dir)

  preprocess_op = load_custom_component(component_name='data_preprocess')
  train_op = load_custom_component(component_name='train_model')
  check_metrics_op = load_custom_component(component_name='check_model_metrics')
  create_endpoint_op = load_custom_component(component_name='create_endpoint')
  test_endpoint_op = load_custom_component(component_name='test_endpoint')
  deploy_model_op = load_custom_component(component_name='deploy_model')
  monitor_model_op = load_custom_component(component_name='monitor_model')

  # pylint: disable=too-many-arguments
  # pylint: disable=too-many-locals
  @dsl.pipeline(name=pipeline_name)
  def pipeline(project_id: str,
               data_region: str,
               gcs_data_output_folder: str,
               input_dataset_uri: str,
               training_data_schema: str,
               data_pipeline_root: str,
               hptune_region: str,
               training_container_image_uri: str,
               serving_container_image_uri: str,
               custom_job_service_account: str,
               metrics_name: str,
               metrics_threshold: float,
               endpoint_machine_type: str,
               endpoint_min_replica_count: int,
               endpoint_max_replica_count: int,
               endpoint_test_instances: str,
               monitoring_user_emails: str,
               monitoring_log_sample_rate: float,
               monitor_interval: int,
               monitoring_default_threshold: float,
               monitoring_custom_skew_thresholds: str,
               monitoring_custom_drift_thresholds: str,
               train_additional_args: str,
               output_model_file_name: str = 'model.txt',
               hp_config_max_trials: int = 30,
               hp_config_suggestions_per_request: int = 5,
               machine_type: str = "n1-standard-8",
               accelerator_count: int = 0,
               accelerator_type: str = 'ACCELERATOR_TYPE_UNSPECIFIED',
               vpc_network: str = None,
               enable_model_monitoring: str = 'False'):
    dataset_importer = kfp.dsl.importer(
      artifact_uri=input_dataset_uri,
      artifact_class=Dataset,
      reimport=False)

    preprocess_task = preprocess_op(
      project_id=project_id,
      data_region=data_region,
      gcs_output_folder=gcs_data_output_folder,
      gcs_output_format="CSV",
      input_dataset=dataset_importer.output)

    train_task = train_op(
      project_id=project_id,
      data_region=data_region,
      data_pipeline_root=data_pipeline_root,
      input_data_schema=training_data_schema,
      training_container_image_uri=training_container_image_uri,
      train_additional_args=train_additional_args,
      serving_container_image_uri=serving_container_image_uri,
      custom_job_service_account=custom_job_service_account,
      input_dataset=preprocess_task.outputs['output_dataset'],
      output_model_file_name=output_model_file_name,
      machine_type=machine_type,
      accelerator_count=accelerator_count,
      accelerator_type=accelerator_type,
      vpc_network=vpc_network,
      hptune_region=hptune_region,
      hp_config_max_trials=hp_config_max_trials,
      hp_config_suggestions_per_request=hp_config_suggestions_per_request)

    check_metrics_task = check_metrics_op(
      metrics_name=metrics_name,
      metrics_threshold=metrics_threshold,
      basic_metrics=train_task.outputs['basic_metrics'])

    with dsl.Condition(check_metrics_task.output == 'True', name='Metrics'):
      create_endpoint_task = create_endpoint_op(
        project_id=project_id,
        data_region=data_region,
        data_pipeline_root=data_pipeline_root,
        display_name='endpoint-template',
        create_if_not_exists=True)

      deploy_model_task = deploy_model_op(
        project_id=project_id,
        data_region=data_region,
        data_pipeline_root=data_pipeline_root,
        machine_type=endpoint_machine_type,
        min_replica_count=endpoint_min_replica_count,
        max_replica_count=endpoint_max_replica_count,
        model=train_task.outputs['output_model'],
        endpoint=create_endpoint_task.outputs['endpoint'])

      test_endpoint_task = test_endpoint_op(
        project_id=project_id,
        data_region=data_region,
        data_pipeline_root=data_pipeline_root,
        endpoint=create_endpoint_task.outputs['endpoint'],
        test_instances=endpoint_test_instances,
      ).after(deploy_model_task)

      with dsl.Condition(enable_model_monitoring == 'True', name='Monitoring'):
        monitor_model_task = monitor_model_op(
          project_id=project_id,
          data_region=data_region,
          user_emails=monitoring_user_emails,
          log_sample_rate=monitoring_log_sample_rate,
          monitor_interval=monitor_interval,
          default_threshold=monitoring_default_threshold,
          custom_skew_thresholds=monitoring_custom_skew_thresholds,
          custom_drift_thresholds=monitoring_custom_drift_thresholds,
          endpoint=create_endpoint_task.outputs['endpoint'],
          instance_schema=train_task.outputs['instance_schema'],
          dataset=preprocess_task.outputs['output_dataset'])
        monitor_model_task.after(deploy_model_task)

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
      pipeline_name=config['train']['name'],
      components_dir=config['pipelines']['pipeline_component_directory'],
      pipeline_job_spec_path=config['train']['pipeline_job_spec_path'])
