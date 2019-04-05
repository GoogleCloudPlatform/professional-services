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
    API framework to post a deployment job
"""

import os

from google.cloud import storage
from googleapiclient import discovery


def get_model_path(cfg, job_id, trained_model_location):
    """
    Gets the trained model path from the job_dir and job_id

    Arguments :
        cfg : dict, Configurations from yaml file
        job_id : string, Job ID of the training job
        trained_model_location : string, Path of the trained model
                     i.e. export directory of training job
    Returns :
        model_path : string, path of the trained model
    """
    storage_client = storage.Client.from_service_account_json(
        cfg['service_account_json_key'])
    bucket = storage_client.get_bucket(cfg['bucket_name'].replace('gs://', ''))
    job_dir = trained_model_location.replace(cfg['bucket_name'] + '/', '')
    prefix_path = os.path.join(job_dir, job_id)
    blobs = bucket.list_blobs(prefix=prefix_path)
    model_path = [b.name.replace(prefix_path, '')
                  for b in blobs][1].replace('/', '')
    return model_path


def get_training_status(api, cfg, job_id, model_name):
    """
    Gets the status of the given training job id

    Arguments :
        api : object, API object to access CloudML Engine
        cfg : dict, Configurations from yaml file
        job_id : string, Job ID of the training job
        model_name : string, Name of the model
    Returns :
        job_response : string, State of the executed training job
        project_id : string, project id of the project
        model_id : string, model id of the project
    """
    project_id = 'projects/{}'.format(cfg['project_id'])
    model_id = '{}/models/{}'.format(project_id, model_name)
    job_response = api.projects().jobs().get(
        name='{}/jobs/{}'.format(project_id, job_id)).execute()
    return job_response['state'], project_id, model_id


def get_models_deployed(api, project_id):
    """
    Gets the list of models deployed
    Arguments :
        api : object, API object to access CloudML Engine
        project_id : string, project id of the project
    Returns :
        list_of_models : list, List of the models deployed
    """
    model_response = api.projects().models().list(parent=project_id).execute()
    list_of_models = [a['name'] for a in model_response['models']]
    return list_of_models


def post(
        cfg,
        job_id,
        model_name,
        version_name,
        trained_model_location,
        runtime_version):
    """
    Post request for a deployment job

    Arguments:
        cfg : dict, Configurations from yaml file
        job_id : string, Job ID of the training job
        model_name : string, Name of the model in ML engine to be used for prediction
        version_name : string, Version of the model to be used for prediction [string]
        trained_model_location : string, Path of the trained model
                     i.e. export directory of training job
        runtime_version : string, Runtime version is the version of Tensorflow
                     used for training of the model

    Returns:
        Response of the deployment API call

    """
    api = discovery.build('ml', 'v1')
    job_status, project_id, model_id = get_training_status(
        api, cfg, job_id, model_name)
    if job_status == 'SUCCEEDED':
        list_of_models = get_models_deployed(api, project_id)
        if model_id not in list_of_models:
            create_model_request = api.projects().models().create(
                parent=project_id, body={'name': model_name})
            _ = create_model_request.execute()

        version_response = api.projects().models(
        ).versions().list(parent=model_id).execute()
        if version_response:
            list_of_versions = [b['name']
                                for b in version_response['versions']]
            version_id = '{}/versions/{}'.format(model_id, version_name)
            if version_id in list_of_versions:
                raise AssertionError(
                    'Version already present. Please change the version')
        model_path = get_model_path(cfg, job_id, trained_model_location)
        request_dict = {'name': version_name,
                        'deploymentUri': '{}/{}/{}'.format(trained_model_location,
                                                           job_id,
                                                           model_path),
                        'runtimeVersion': runtime_version,
                        'framework': 'TENSORFLOW'}
        request = api.projects().models().versions().create(
            parent=model_id, body=request_dict)
        output = request.execute()
    elif job_status == 'FAILED':
        raise AssertionError(
            'The specified job has been failed. Kindly check the job parameters and log')
    else:
        raise AssertionError(
            'Please wait for some more time, as the training job is still running')
    return output
