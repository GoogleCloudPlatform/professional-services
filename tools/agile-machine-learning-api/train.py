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
    API framework to post a training job
"""
import os

import yaml
from googleapiclient import discovery


def post(
        cfg,
        train_csv_path,
        eval_csv_path,
        task_type,
        target_var,
        data_type,
        column_name,
        na_values,
        condition,
        n_classes,
        to_drop,
        name,
        hidden_units,
        num_layers,
        lin_opt,
        deep_opt,
        train_steps,
        export_dir,
        jobid):
    """
    Post request to submit the training job

    Args:
        cfg: dict, Configurations from yaml file
        train_csv_path: string, Path of the Train csv
        eval_csv_path: string, Path of the Eval csv
        task_type: string, Type of the task (eg LinearClassifier etc.)
        target_var: string, Target column name in the given data
        data_type: dict, A dictionary containing feature names as key and values as the types of the feature
        column_name: list of strings, Column names in the given data
        na_values: string, Null value character in the data
        condition: string, Condition to convert seperate classes in the target column
        n_classes: integer, Number of classes in target column
        to_drop: list of strings, Specific columns to drop
        name: string, Name of the model you want to use
        hidden_units: integer, No. of hidden units for deep classifiers and regressors
        num_layers: integer, No of layers for deep classifiers and regressors
        lin_opt: string, Linear Optimizer
        deep_opt: string, Deep Optimizer
        job_dir: string, Job directory for CMLE job
        train_steps: integer, No. of training steps
        export_dir: string, Export directory of trained model
        jobid: string, Job ID of the training

    Returns:
        Response of the Training job
    """

    with open('config/train.yaml', 'rb') as config_yml:
        train_cfg = yaml.load(config_yml)

    project_id = 'projects/{}'.format(cfg['project_id'])

    cloudml = discovery.build('ml', 'v1')

    params = [
        '--train_csv_path', train_csv_path,
        '--eval_csv_path', eval_csv_path,
        '--task_type', task_type,
        '--target_var', target_var,
        '--data_type', data_type,
        '--column_name', column_name,
        '--na_values', na_values,
        '--condition', condition,
        '--n_classes', n_classes,
        '--to_drop', to_drop,
        '--name', name,
        '--hidden_units', hidden_units,
        '--num_layers', num_layers,
        '--lin_opt', lin_opt,
        '--deep_opt', deep_opt,
        '--train_steps', train_steps,
        '--export_dir', export_dir
    ]

    current_models = [
        'linearclassifier',
        'linearregressor',
        'dnnclassifier',
        'dnnregressor',
        'combinedclassifier',
        'combinedregressor'
    ]

    if name not in current_models:
        raise AssertionError(
            'Please provide a model name from the following : {}'.format(
                str(current_models)))
    training_inputs = {
        'scaleTier': train_cfg['scaleTier'],
        'masterType': train_cfg['masterType'],
        'workerType': train_cfg['workerType'],
        'parameterServerType': train_cfg['parameterServerType'],
        'workerCount': train_cfg['workerCount'],
        'parameterServerCount': train_cfg['parameterServerCount'],
        'packageUris': train_cfg['packageUris'],
        'pythonModule': "trainer.launch_demo",
        'args': params,
        'region': train_cfg['region'],
        'jobDir': os.path.join(train_cfg['jobDir'], jobid),
        'runtimeVersion': train_cfg['runtimeVersion'],
        'pythonVersion': train_cfg['pythonVersion']
    }

    job_spec = {'jobId': jobid, 'trainingInput': training_inputs}

    response = cloudml.projects().jobs().create(body=job_spec,
                                                parent=project_id).execute()
    return response
