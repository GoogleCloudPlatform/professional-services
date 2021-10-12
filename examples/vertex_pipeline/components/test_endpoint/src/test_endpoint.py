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

"""Custom component for testing the deployed model."""

import logging
import json
import argparse

from google.cloud import aiplatform
from kfp.v2.components import executor
from kfp.v2.dsl import Artifact, Input

logging.getLogger().setLevel(logging.INFO)


def test_endpoint(project_id: str,
                  data_region: str,
                  data_pipeline_root: str,
                  test_instances: str,
                  endpoint: Input[Artifact]):
  """Test an endpoint.

  Args:
    project_id: The project ID.
    data_region: The region for the endpoint.
    data_pipeline_root: The staging location for any custom job.
    test_instances: The testing instances.
    endpoint: The output artifact of the endpoint.
  """

  aiplatform.init(
      project=project_id,
      location=data_region,
      staging_bucket=data_pipeline_root)

  endpoint_rn = endpoint.uri.replace('aiplatform://v1/', '')
  endpoint = aiplatform.Endpoint(endpoint_rn)

  instances = json.loads(test_instances)

  predictions = endpoint.predict(instances=instances)
  logging.info(f'prediction result {predictions}')


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
