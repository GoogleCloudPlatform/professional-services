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

"""Custom component for deploying model to Endpoint on Vertex AI Platform."""

import argparse
import json
import logging

from google.cloud import aiplatform
from kfp.v2.components import executor
from kfp.v2.dsl import Artifact, Input, Model

logging.getLogger().setLevel(logging.INFO)

# Vertex AI artifact resource prefix
VERTEX_AI_RESOURCE_PREFIX = 'aiplatform://v1/'

# The maximum allowed deployed models for the endpoint
MAX_DEPLOYED_MODELS_PER_ENDPOINT = 2


# pylint: disable=too-many-arguments
def deploy_model(project_id: str,
                 data_region: str,
                 data_pipeline_root: str,
                 machine_type: str,
                 min_replica_count: int,
                 max_replica_count: int,
                 model: Input[Model],
                 endpoint: Input[Artifact]):
  """Deploy the model to a particular endpoint.

  Args:
    project_id: The project ID.
    data_region: The region for the model and endpoint.
    data_pipeline_root: The staging location for any custom job.
    machine_type: The machine type to serve the prediction requests.
    min_replica_count: The minimum number of instances to server
        prediction requests.
    max_replica_count: The maximum number of instances to server
        prediction requests.
    model: The input artifact of the model.
    endpoint: The input artifact of the endpoint.
  """

  logging.info(f'input model URI: {model.uri}')
  logging.info(f'input endpoint URI: {endpoint.uri}')

  if not model.uri.startswith(VERTEX_AI_RESOURCE_PREFIX):
    raise RuntimeError(f'Invalid model URI {model.uri}')

  if not endpoint.uri.startswith(VERTEX_AI_RESOURCE_PREFIX):
    raise RuntimeError(f'Invalid endpoint URI {endpoint.uri}')

  model_resource_name = model.uri[len(VERTEX_AI_RESOURCE_PREFIX):]
  endpoint_resource_name = endpoint.uri[len(VERTEX_AI_RESOURCE_PREFIX):]

  # Call Vertex AI custom job in another region
  aiplatform.init(
      project=project_id,
      location=data_region,
      staging_bucket=data_pipeline_root)

  target_model = aiplatform.Model(
      model_resource_name,
      project=project_id,
      location=data_region)

  target_endpoint = aiplatform.Endpoint(
      endpoint_resource_name,
      project=project_id,
      location=data_region)

  target_model.deploy(
      endpoint=target_endpoint,
      traffic_percentage=100,
      machine_type=machine_type,
      min_replica_count=min_replica_count,
      max_replica_count=max_replica_count)
  logging.info('Model has been deployed to endpoint successfully.')

  # Only keep a maximum of MAX_DEPLOYED_MODELS_PER_ENDPOINT deployed models
  deployed_models = sorted(
      target_endpoint.list_models(),
      key=lambda x: x.create_time,
      reverse=True)
  logging.info(f'Number of deployed models = {len(deployed_models)}')

  if len(deployed_models) > MAX_DEPLOYED_MODELS_PER_ENDPOINT:
    for deployed_model in deployed_models[MAX_DEPLOYED_MODELS_PER_ENDPOINT:]:
      logging.info(f'Undeploy model {deployed_model.model}...')
      target_endpoint.undeploy(deployed_model.id)
      logging.info(f'Model {deployed_model.model} has been '
                   f'removed from endpoint.')


def executor_main():
  """Main executor."""

  parser = argparse.ArgumentParser()
  parser.add_argument('--executor_input', type=str)
  parser.add_argument('--function_to_execute', type=str)

  args, _ = parser.parse_known_args()
  executor_input = json.loads(args.executor_input)
  function_to_execute = globals()[args.function_to_execute]

  executor.Executor(
      executor_input=executor_input,
      function_to_execute=function_to_execute).execute()


if __name__ == '__main__':
  executor_main()
