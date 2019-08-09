#!/usr/bin/env python

# Copyright 2019 Google LLC
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#    http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

import subprocess


def service_account(config):

    sa_name = config["service_acct"]["name"]
    sa_display_name = config["service_acct"]["display_name"]
    project_id = config["main_project"]["project_id"]
    user_id = config["service_acct"]["user_id"]

    sa_name_full = f'{sa_name}@{project_id}.iam.gserviceaccount.com'

    create_service_acct = f'gcloud iam service-accounts create {sa_name} --display-name={sa_display_name} --project={project_id}'

    bind_service_acct = f'gcloud iam service-accounts add-iam-policy-binding {sa_name_full} --member="serviceAccount:{sa_name_full}" --role="roles/project.editor" --project={project_id}'

    create_service_acct_key = f'gcloud iam service-accounts keys create ./keys/key.json --iam-account {sa_name_full} --project={project_id}'

    bind_user_permissions = f'gcloud projects add-iam-policy-binding {project_id} --member="user:{user_id}" --role="roles/automl.admin"'

    subprocess.run(create_service_acct, shell=True, capture_output=True)
    subprocess.run(bind_service_acct, shell=True, capture_output=True)
    subprocess.run(create_service_acct_key, shell=True, capture_output=True)
    subprocess.run(bind_user_permissions, shell=True, capture_output=True)
