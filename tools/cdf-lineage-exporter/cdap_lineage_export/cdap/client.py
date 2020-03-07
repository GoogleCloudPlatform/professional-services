# Copyright 2019 Google LLC.
# This software is provided as-is, without warranty or representation
# for any use or purpose.
# Your use of it is subject to your agreement with Google.

# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
# http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.
import urllib.parse
from dataclasses import dataclass
from functools import wraps

from google.api_core.exceptions import NotFound
from google.auth.credentials import AnonymousCredentials, Credentials
from google.cloud import _http
from google.cloud.client import ClientWithProject


class Connection(_http.JSONConnection):
    """
    Connection to CDAP API on Data Fusion
    """
    def __init__(self, client, api_endpoint, client_info=None):
        super(Connection, self).__init__(client, client_info)
        self.API_BASE_URL = api_endpoint

    API_VERSION = "v3"
    API_URL_TEMPLATE = "{api_base_url}/{api_version}/{path}"


def empty_if_not_found(api_call):
    """
     Decorator to help handle scenarios where CDAP REST API returns
     a misleading 404.

     For example, If there are no datasets (or streams) the CDAP REST API
     datasets (or streams) endpoint will return 404 instead of empty list"""
    @wraps(api_call)
    def handle_not_found(*args, **kwargs):
        try:
            return api_call(*args, **kwargs)
        except NotFound:
            return []

    return handle_not_found


class CDAPClient(ClientWithProject):
    """
    Client for making CDAP REST API Calls.
    
    Args:
        api_endpoint (str): address of your CDAP instance. For Data Fusion this
            can be retrieved with:
            ```bash
                gcloud beta data-fusion instance describe --location=${REGION} \
                  --format="value(apiEndpoint)" ${INSTANCE_NAME}
            ```
        credentials (google.auth.credentials.Credentials): optional path the json SA key to use.
    """
    def __init__(self,
                 project: str,
                 api_endpoint: str,
                 credentials=None,
                 namespace=None):
        super().__init__(project=project, credentials=credentials, _http=None)
        self.namespace = namespace if namespace else 'default'
        self._connection = Connection(self, api_endpoint)

    def api_request(self,
                    method: str,
                    path: str,
                    query_params: dict = None,
                    data: str = None,
                    headers: dict = None,
                    expect_json=True):

        return self._connection.api_request(method,
                                            path,
                                            query_params=query_params,
                                            data=data,
                                            headers=headers,
                                            expect_json=expect_json)

    def list_namespaces(self):
        return [
            namespace.get('name')
            for namespace in self.api_request('GET', 'namespaces')
        ]

    def list_apps(self, namespace):
        return [
            app.get('name')
            for app in self.api_request('GET', f'namespaces/{namespace}/apps/')
        ]

    @empty_if_not_found
    def list_datasets(self, namespace):
        return [
            dataset.get('name') for dataset in self.api_request(
                'GET', f'namespaces/{namespace}/data/datasets/')
        ]

    @empty_if_not_found
    def list_streams(self, namespace):
        return [
            stream.get('name') for stream in self.api_request(
                'GET', f'namespaces/{namespace}/data/streams/')
        ]

    def fetch_lineage(self,
                      namespace,
                      entity_type,
                      entity,
                      start_ts='now-1d',
                      end_ts='now'):
        return self.api_request(
            'GET',
            f'namespaces/{namespace}/{entity_type}/{entity}/lineage',
            query_params={
                'start': start_ts,
                'end': end_ts
            })
