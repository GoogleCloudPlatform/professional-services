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

"""Custom component for creating Endpoint on Vertex AI Platform."""

import argparse
import json
import logging

from google.cloud import aiplatform
from kfp.v2.components import executor
from kfp.v2.dsl import Artifact, Output

logging.getLogger().setLevel(logging.INFO)


def _create_endpoint(project_id: str,
                     data_region: str,
                     display_name: str) -> aiplatform.Endpoint:
  new_endpoint = aiplatform.Endpoint.create(
      project=project_id,
      location=data_region,
      display_name=display_name)
  logging.info(f'New Endpoint {new_endpoint.resource_name} has been created.')

  return new_endpoint


def get_or_create_endpoint(project_id: str,
                           data_region: str,
                           data_pipeline_root: str,
                           display_name: str,
                           create_if_not_exists: bool,
                           endpoint: Output[Artifact]):
  """Get an existing model endpoint, or create a new one.

  Args:
    project_id: The project ID.
    data_region: The region for the endpoint.
    data_pipeline_root: The staging location for any custom job.
    display_name: The endpoint display name to look for.
    create_if_not_exists: True if a new endpoint should be created in case
      the endpoint is not found.
    endpoint: The output artifact of the endpoint.

  Raise:
    RuntimeError: If Endpoint is not found and create_if_not_exists is False.
  """

  aiplatform.init(
      project=project_id,
      location=data_region,
      staging_bucket=data_pipeline_root)

  # Check if the named endpoint exists
  endpoints = aiplatform.Endpoint.list(
      project=project_id,
      location=data_region,
      filter=f'display_name="{display_name}"',
      order_by='create_time desc'
  )

  # If create_if_not_exists is True and no existing
  # endpoint with the display name, create one
  if endpoints:
    model_endpoint = endpoints[0]
    logging.info(f'Endpoint {model_endpoint.name} is found')
  elif create_if_not_exists:
    logging.info(
        f'Endpoint with display_name {display_name} is not found, create one.')
    model_endpoint = _create_endpoint(project_id, data_region, display_name)
  else:
    raise RuntimeError(
        'Endpoint is not found and create_if_not_exists is False')

  endpoint.uri = f'aiplatform://v1/{model_endpoint.resource_name}'


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
