# Copyright 2022 Google Inc. All Rights Reserved.
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

import base64
import json
import googleapiclient.discovery
from google.cloud import secretmanager


def rotate_service_account_keys_in_secret_manager(event, context):

    event_type = event['attributes']['eventType']
    secret_name = event['attributes']['secretId']

    if (event_type == "SECRET_ROTATE"):
        client = secretmanager.SecretManagerServiceClient()
        current_secret_with_version = client.list_secret_versions(
            request={
                'parent': secret_name
            }).versions[0].name
        current_secret = client.access_secret_version(
            name=current_secret_with_version)

        ### Get project_id, service account and private key id
        json_key = json.loads(current_secret.payload.data.decode('UTF-8'))
        project_id = json_key['project_id']
        service_account = json_key['client_email']
        key_id = json_key['private_key_id']

        service = googleapiclient.discovery.build('iam', 'v1')

        ### Create a new service account and add a key as a new secret version
        new_key = service.projects().serviceAccounts().keys().create(
            name=f'projects/{project_id}/serviceAccounts/{service_account}',
            body={}).execute()
        new_service_key_json = base64.b64decode(new_key['privateKeyData'])
        client.add_secret_version(parent=secret_name,
                                  payload={'data': new_service_key_json})

        ### Delete the old service account
        key_to_delete = f'projects/{project_id}/serviceAccounts/{service_account}/keys/{key_id}'
        service.projects().serviceAccounts().keys().delete(
            name=key_to_delete).execute()

        ### Disable and delete the old secret version
        client.disable_secret_version(
            request={"name": current_secret_with_version})
        client.destroy_secret_version(
            request={'name': current_secret_with_version})
