# Copyright 2022 Google Inc.
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

from google.cloud import storage
import json
import os


def get_dag_dependency(attributes_dict):

    storage_client = storage.Client()
    bucket = storage_client.get_bucket(os.environ.get('DAG_DEPENDENCY_BUCKET'))

    workflow_dependency_blob = bucket.blob('{}.json'.format(
        attributes_dict["workflow_id"]))
    workflow_dependency = json.loads(
        workflow_dependency_blob.download_as_string(client=None))

    composer_url_blob = bucket.blob('composer-url-mapping-{}.json'.format(
        os.environ.get('ENVIRONMENT')))
    composer_url = json.loads(composer_url_blob.download_as_string(client=None))

    return workflow_dependency['target'][
        attributes_dict['workflow_status']], composer_url
