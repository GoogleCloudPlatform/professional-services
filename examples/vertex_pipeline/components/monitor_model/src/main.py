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

import copy
import logging
from typing import Dict, List

import yaml
from google.cloud import aiplatform
from google.cloud.aiplatform import Endpoint
from google.cloud.aiplatform_v1beta1 import GcsSource, JobServiceClient, \
  ListModelDeploymentMonitoringJobsRequest, \
  ModelDeploymentMonitoringJob, ModelDeploymentMonitoringObjectiveConfig, \
  ModelDeploymentMonitoringScheduleConfig, \
  ModelMonitoringAlertConfig, ModelMonitoringObjectiveConfig, SamplingStrategy, \
  ThresholdConfig
from google.protobuf.duration_pb2 import Duration
from kfp.v2.components.executor import Executor
from kfp.v2.dsl import Artifact, Dataset, Input

# Vertex AI artifact resource prefix
VERTEX_AI_RESOURCE_PREFIX = 'aiplatform://v1/'

# Vertex AI API endpoint suffix
API_ENDPOINT_SUFFIX = 'aiplatform.googleapis.com'

# Model monitoring job name
JOB_DISPLAY_NAME = 'model_monitoring'


def monitor_model(
    project_id: str,
    data_region: str,
    user_emails: str,
    log_sample_rate: float,
    monitor_interval: int,
    default_threshold: float,
    custom_skew_thresholds: str,
    custom_drift_thresholds: str,
    endpoint: Input[Artifact],
    instance_schema: Input[Artifact],
    dataset: Input[Dataset]
):
  """ Deploy a model monitoring job to a particular endpoint.

  Args:
      project_id: The project ID.
      data_region: The region for the model monitoring job and endpoint.
      user_emails: The user emails for the alerts, separated by comma.
      log_sample_rate: The ratio of logged prediction requests for analysis purposes.
      monitor_interval: The monitoring interval in seconds.
      default_threshold: The default skew/drift threshold for all features.
      custom_skew_thresholds: Thresholds for skew using canonical string format <feature>:<value>,<feature>:<value>.
      custom_drift_thresholds: Thresholds for drift using canonical string format <feature>:<value>,<feature>:<value>.
      endpoint: The input artifact of the endpoint.
      instance_schema: The input artifact of the schema of the features.
      dataset: The input artifact of the dataset for setting up train skew detection.
  """

  logging.getLogger().setLevel(logging.INFO)

  logging.info(f'input endpoint URI: {endpoint.uri}')
  if not endpoint.uri.startswith(VERTEX_AI_RESOURCE_PREFIX):
    raise RuntimeError(f'Invalid endpoint URI {endpoint.uri}')

  endpoint_resource_name = endpoint.uri[len(VERTEX_AI_RESOURCE_PREFIX):]

  target_endpoint = aiplatform.Endpoint(
    endpoint_resource_name,
    project=project_id,
    location=data_region
  )

  objective_configs = _create_objectives_config(
    endpoint=target_endpoint,
    instance_schema_path=instance_schema.path,
    label=instance_schema.metadata['label'],
    training_dataset_uri=dataset.uri,
    default_threshold=default_threshold,
    custom_skew_thresholds=custom_skew_thresholds,
    custom_drift_thresholds=custom_drift_thresholds
  )

  _create_monitoring_job(
    project_id=project_id,
    region=data_region,
    user_emails=user_emails,
    log_sample_rate=log_sample_rate,
    monitor_interval=monitor_interval,
    instance_schema_uri=instance_schema.uri,
    endpoint=target_endpoint,
    objective_configs=objective_configs
  )


def _create_monitoring_job(
    project_id: str,
    region: str,
    user_emails: str,
    log_sample_rate: float,
    monitor_interval: int,
    instance_schema_uri: str,
    endpoint: Endpoint,
    objective_configs: List[ModelDeploymentMonitoringObjectiveConfig]
):
  api_endpoint = f'{region}-{API_ENDPOINT_SUFFIX}'

  # Create/update the monitoring job.
  options = dict(api_endpoint=api_endpoint)
  client = JobServiceClient(client_options=options)
  parent = f'projects/{project_id}/locations/{region}'

  # Create sampling configuration.
  random_sampling = SamplingStrategy.RandomSampleConfig(
    sample_rate=log_sample_rate)
  sampling_config = SamplingStrategy(random_sample_config=random_sampling)

  # Create schedule configuration.
  duration = Duration(seconds=monitor_interval)
  schedule_config = ModelDeploymentMonitoringScheduleConfig(
    monitor_interval=duration)

  # Create alerting configuration.
  emails = [x.strip() for x in user_emails.split(',')]
  email_config = ModelMonitoringAlertConfig.EmailAlertConfig(user_emails=emails)
  alerting_config = ModelMonitoringAlertConfig(email_alert_config=email_config)

  # Get existing job if any.
  job = _get_existing_job(project_id, region, endpoint)
  if job:
    # We cannot update the job as specifying a training dataset in the config
    # is not supported now. So we would pause the job and try deleting it.
    logging.info(f'Try pause and delete existing job {job.name}')
    try:
      client.pause_model_deployment_monitoring_job(name=job.name)
    except Exception:
      logging.info('Fail to pause the monitoring job')

    client.delete_model_deployment_monitoring_job(name=job.name)
    logging.info(f'Existing job has been deleted.')

  predict_schema = instance_schema_uri
  analysis_schema = instance_schema_uri
  job = ModelDeploymentMonitoringJob(
    display_name=JOB_DISPLAY_NAME,
    endpoint=endpoint.resource_name,
    model_deployment_monitoring_objective_configs=objective_configs,
    logging_sampling_strategy=sampling_config,
    model_deployment_monitoring_schedule_config=schedule_config,
    model_monitoring_alert_config=alerting_config,
    predict_instance_schema_uri=predict_schema,
    analysis_instance_schema_uri=analysis_schema
  )
  logging.info(job)

  client.create_model_deployment_monitoring_job(
    parent=parent, model_deployment_monitoring_job=job
  )
  logging.info('Monitoring job has been created')


def _get_existing_job(
    project_id: str,
    region: str,
    endpoint: Endpoint
):
  client_options = dict(api_endpoint=f'{region}-{API_ENDPOINT_SUFFIX}')
  client = JobServiceClient(client_options=client_options)

  request = ListModelDeploymentMonitoringJobsRequest(
    parent=f'projects/{project_id}/locations/{region}',
    filter=f'display_name="{JOB_DISPLAY_NAME}"'
  )

  response = client.list_model_deployment_monitoring_jobs(request)
  for job in response:
    if job.endpoint == endpoint.resource_name:
      return job
  return None


def _create_objectives_config(
    endpoint: Endpoint,
    instance_schema_path: str,
    label: str,
    training_dataset_uri: str,
    default_threshold: float,
    custom_skew_thresholds: str,
    custom_drift_thresholds: str,
) -> List[ModelDeploymentMonitoringObjectiveConfig]:
  all_features = _get_model_features(instance_schema_path)

  skew_config = ModelMonitoringObjectiveConfig.TrainingPredictionSkewDetectionConfig(
    skew_thresholds=_get_thresholds(all_features, default_threshold,
                                    custom_skew_thresholds)
  )

  drift_config = ModelMonitoringObjectiveConfig.PredictionDriftDetectionConfig(
    drift_thresholds=_get_thresholds(all_features, default_threshold,
                                     custom_drift_thresholds)
  )

  training_dataset = ModelMonitoringObjectiveConfig.TrainingDataset(
    target_field=label, data_format='csv')
  training_dataset.gcs_source = GcsSource(uris=[training_dataset_uri])

  objective_config = ModelMonitoringObjectiveConfig(
    training_dataset=training_dataset,
    training_prediction_skew_detection_config=skew_config,
    prediction_drift_detection_config=drift_config
  )

  objective_template = ModelDeploymentMonitoringObjectiveConfig(
    objective_config=objective_config
  )

  deployed_models = endpoint.list_models()
  model_ids = [model.id for model in deployed_models]
  if not model_ids:
    raise RuntimeError('The endpoint does not have a deployed model.')

  # Use the same objective config for all models.
  objective_configs = []
  for model_id in model_ids:
    objective_config = copy.deepcopy(objective_template)
    objective_config.deployed_model_id = model_id
    objective_configs.append(objective_config)
  return objective_configs


def _get_model_features(instance_schema_path: str) -> List[str]:
  with open(instance_schema_path, 'r') as file:
    schema = yaml.full_load(file)
    return schema['required']


def _get_thresholds(
    all_features: List[str],
    default_threshold_value: float,
    custom_thresholds: str
) -> Dict[str, ThresholdConfig]:
  thresholds = {}
  default_threshold = ThresholdConfig(value=default_threshold_value)

  for feature in all_features:
    thresholds[feature] = default_threshold

  for custom_threshold in custom_thresholds.split(","):
    pair = custom_threshold.split(":")
    if len(pair) != 2:
      raise RuntimeError(f'Invalid custom threshold: {custom_threshold}')
    feature, value = pair
    thresholds[feature] = ThresholdConfig(value=float(value))
  return thresholds


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
