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

# TODO(michaelsherman): Can this be deleted now that we do it with sh?

import subprocess


def create(config):

    sa_name = config["service_acct"]["name"]
    sa_display_name = config["service_acct"]["display_name"]
    sa_description = config["service_acct"]["description"]
    project_id = config["main_project"]["project_id"]
    user_id = config["service_acct"]["user_id"]
    sa_key = config["service_acct"]["key"]

    sa_name_full = f'{sa_name}@{project_id}.iam.gserviceaccount.com'

    commands = [
        f'gcloud config set account {user_id}',
        f'gcloud beta iam service-accounts create {sa_name} --display-name={sa_display_name} --description={sa_description} --project={project_id}',
        f'gcloud projects add-iam-policy-binding {project_id} --member="serviceAccount:{sa_name_full}" --role="roles/editor"',
        f'gcloud projects add-iam-policy-binding {project_id} --member="serviceAccount:{sa_name_full}" --role="roles/automl.admin"',
        f'gcloud projects add-iam-policy-binding {project_id} --member="user:{user_id}" --role="roles/automl.admin"',
        f'gcloud iam service-accounts keys create {sa_key} --iam-account {sa_name_full} --project={project_id}'
    ]

    for c in commands:
        subprocess.run(c, shell=True, capture_output=True)
