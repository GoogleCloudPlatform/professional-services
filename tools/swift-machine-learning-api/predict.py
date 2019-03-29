# Copyright 2019 Google LLC
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

"""
    API framework to post a prediction job
"""
from googleapiclient import discovery


def post(cfg, model_name, instances, version_name=None):
    """
    Post request for a prediction job

    Arguments:
        cfg : dict, Configurations from yaml file
        model_name : string, Name of the model in ML engine to be used for prediction
        instances : list of dictionaries, Instance of the data on which prediction is to be done.
            For example {"input_array" : [0.0,0.0,0.0,0.0]}
        version_name : string, Version of the model to be used for prediction

    Returns:
        Predictions on the input given in instance
        Response body {"output" : [prediction]}
    """
    api = discovery.build('ml', 'v1')
    project_id = 'projects/{}'.format(cfg['project_id'])
    model_response = api.projects().models().list(parent=project_id).execute()
    list_of_models = [a['name'] for a in model_response['models']]
    model_id = '{}/models/{}'.format(project_id, model_name)
    version_id = '{}/versions/{}'.format(model_id, version_name)

    if model_id in list_of_models:
        version_response = api.projects().models(
        ).versions().list(parent=model_id).execute()
        list_of_versions = [b['name'] for b in version_response['versions']]
        if version_id not in list_of_versions:
            raise AssertionError(
                'Required version of the model is not yet deployed. \
                    Please deploy the model before running the prediction call')
        response = api.projects().predict(
            name=version_id,
            body={'instances': instances}
        ).execute()
    else:
        raise AssertionError(
            'Please deploy the model before running the prediction call')
    return response['predictions']
