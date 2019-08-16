# Copyright 2019 Google Inc. All Rights Reserved.
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
# ==============================================================================

"""Helper function for requesting an online prediction."""

import json
import os

import googleapiclient.discovery


def predict(project, model, data, version=None):
  """Run predictions on a list of instances.

  Args:
    project: (str), project where the Cloud ML Engine Model is deployed.
    model: (str), model name.
    data: ([[any]]), list of input instances, where each input instance is a
      list of attributes.
    version: str, version of the model to target.

  Returns:
    Mapping[str: any]: dictionary of prediction results defined by the model.
  """

  service = googleapiclient.discovery.build('ml', 'v1')
  name = 'projects/{}/models/{}'.format(project, model)

  if version is not None:
    name += '/versions/{}'.format(version)

  response = service.projects().predict(
      name=name, body={
          'instances': data
      }).execute()

  if 'error' in response:
    raise RuntimeError(response['error'])

  return response['predictions']


if __name__ == '__main__':

  # Example call to `predict`

  project_id = os.environ['PROJECT_ID']
  model_name = 'censusjson' # Please modify accordingly
  version_name = 'v1' # Please modify accordingly
  data = []
  with open('sample_data/sample_json.txt') as f:
    for line in f:
      data.append(json.loads(line))
  print(data)

  print(
      predict(
          project=project_id,
          model=model_name,
          data=data,
          version=version_name))
