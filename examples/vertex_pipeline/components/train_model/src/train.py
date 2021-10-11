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

import json
import logging
import os
from datetime import datetime

from kfp.v2.components.executor import Executor
from kfp.v2.dsl import Artifact, ClassificationMetrics, Dataset, Input, Metrics, Model, Output

FEATURE_IMPORTANCE_FILENAME = 'feature_importance.csv'
INSTANCE_SCHEMA_FILENAME = 'instance_schema.yaml'


def train_model(
    project_id: str,
    data_region: str,
    data_pipeline_root: str,
    training_container_image_uri: str,
    serving_container_image_uri: str,
    custom_job_service_account: str,
    input_dataset: Input[Dataset],
    input_data_schema: str,
    output_model: Output[Model],
    basic_metrics: Output[Metrics],
    classification_metrics: Output[ClassificationMetrics],
    feature_importance_dataset: Output[Dataset],
    instance_schema: Output[Artifact],
    output_model_file_name: str = 'model.txt',
    machine_type: str = "n1-standard-8",
    accelerator_count: int = 0,
    accelerator_type: str = 'ACCELERATOR_TYPE_UNSPECIFIED',
    hptune_region: str = None,
    hp_config_max_trials: int = 30,
    hp_config_suggestions_per_request: int = 5,
    train_additional_args: str = None,
    vpc_network: str = None,
):
  """ Component to train a model by calling remote custom training pipeline job.

  Args:
      project_id: The project ID.
      data_region: The region for the training job.
      data_pipeline_root: The staging location for custom job.
      training_container_image_uri: The container image URI for the
          training job.
      serving_container_image_uri: The container image URI for the
          prediction container.
      custom_job_service_account: The service account to execute the
          custom training job.
      input_dataset: The input artifact of the training dataset.
      input_data_schema: The schema of the input dataset.
      output_model: The output artifact of the model.
      basic_metrics: The output artifact of the basic metrics.
      classification_metrics: The output artifact of the classification
          metrics.
      feature_importance_dataset: The output artifact of the feature
          importance CSV file.
      instance_schema: The output artifact of the schema of the features.
      output_model_file_name: the file name of the output model.
      machine_type: The machine type to serve the prediction requests.
      accelerator_type: The type of accelerator(s) that may be attached
        to the machine as per `accelerator_count`.
      accelerator_count: The number of accelerators to attach to the
        `machine_type`.
      hptune_region: The region for hyperparameter tuning job.
      hp_config_max_trials: The max number of trials for hyperparameter tuning.
      hp_config_suggestions_per_request: The number of suggestion per request.
      train_additional_args: The training argument.
      vpc_network: The VPC network to execute the training job (optional).
  """

  logging.getLogger().setLevel(logging.INFO)

  logging.info(f'input dataset URI: {input_dataset.uri}')
  logging.info(f'output model URI: {output_model.uri}')
  logging.info(f'custom_job_service_account: {custom_job_service_account}')

  from google.cloud import aiplatform

  # Call Vertex AI custom job in another region
  aiplatform.init(
    project=project_id,
    location=data_region,
    staging_bucket=data_pipeline_root)

  job = aiplatform.CustomContainerTrainingJob(
    display_name='model-training',
    location=data_region,
    container_uri=training_container_image_uri,
    model_serving_container_image_uri=serving_container_image_uri,
    model_serving_container_predict_route='/predict',
    model_serving_container_health_route='/health',
    model_serving_container_environment_variables={
      'TRAINING_DATA_SCHEMA': input_data_schema,
      'MODEL_FILENAME': output_model_file_name
    })

  # Create a millisecond timestamped model display name
  model_display_name = f'model-{int(datetime.now().timestamp() * 1000)}'

  # The container is implemented to handle managed dataset
  # can make use of the same AIP_* env variables
  # Also provide the metrics artifact URI for the metrics output
  fields = [field.split(':')[0] for field in input_data_schema.split(';')]
  label = fields[-1]
  features = ','.join(fields[0:-1])

  # It is possible to make all train_args passed using `train_additional_args`
  # The below is an example to show different usage
  train_args = [
    '--training_data_uri', input_dataset.uri,
    '--training_data_schema', input_data_schema,
    '--label', label,
    '--features', features,
    '--metrics_output_uri', basic_metrics.uri,
    '--hp_config_gcp_project_id', project_id,
    '--hp_config_gcp_region', hptune_region,
    '--hp_config_suggestions_per_request', hp_config_suggestions_per_request,
    '--hp_config_max_trials', hp_config_max_trials,
  ]

  if train_additional_args:
    arg_dict = json.loads(train_additional_args)
    for item in arg_dict:
      train_args.append('--'+item)
      train_args.append(arg_dict[item])

  if hptune_region:
    train_args.append('--perform_hp',)

  model = job.run(
    model_display_name=model_display_name,
    args=train_args,
    replica_count=1,
    machine_type=machine_type,
    accelerator_type=accelerator_type,
    accelerator_count=accelerator_count,
    service_account=custom_job_service_account,
    network=vpc_network)

  logging.info(
    f'Training completes with model URI: {model.uri}, '
    f'Resource Name: {model.resource_name}')

  logging.info('Update output model metadata')
  output_model.uri = 'aiplatform://v1/' + model.resource_name
  output_model.metadata['model_gcs_uri'] = model.uri

  feature_importance_dataset.uri = os.path.join(
    model.uri, FEATURE_IMPORTANCE_FILENAME)
  instance_schema.uri = os.path.join(model.uri, INSTANCE_SCHEMA_FILENAME)
  instance_schema.metadata['label'] = label

  # Read confusion matrix returned by the custom job
  with open(basic_metrics.path, 'rt') as f:
    metrics_json = json.load(f)

  # log the metrics
  classification_report = metrics_json['classification_report']
  fpr = metrics_json['fpr']
  tpr = metrics_json['tpr']
  thresholds = metrics_json['thresholds']

  logging.info('Update basic metrics metadata')
  basic_metrics.log_metric('precision', classification_report['1']['precision'])
  basic_metrics.log_metric('recall', classification_report['1']['recall'])
  basic_metrics.log_metric('accuracy', classification_report['accuracy'])
  basic_metrics.log_metric('au_roc', metrics_json['au_roc'])
  basic_metrics.log_metric('au_prc', metrics_json['au_prc'])

  basic_metrics.metadata['model_name'] = model.resource_name

  logging.info('Update classification metrics metadata')
  classification_metrics.log_confusion_matrix(
    categories=["0", "1"], matrix=metrics_json['confusion_matrix'])
  classification_metrics.log_roc_curve(fpr, tpr, thresholds)
  classification_metrics.metadata['model_name'] = model.resource_name


def executor_main():
  import argparse
  import json

  parser = argparse.ArgumentParser()
  parser.add_argument('--executor_input', type=str)
  parser.add_argument('--function_to_execute', type=str)

  args, _ = parser.parse_known_args()
  executor_input = json.loads(args.executor_input)
  function_to_execute = globals()[args.function_to_execute]

  executor = Executor(executor_input=executor_input,
                      function_to_execute=function_to_execute)

  executor.execute()


if __name__ == '__main__':
  executor_main()
