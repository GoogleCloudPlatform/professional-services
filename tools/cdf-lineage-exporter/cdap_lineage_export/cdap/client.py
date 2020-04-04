# Copyright 2020 Google LLC
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#     https://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

from functools import wraps

from google.api_core.exceptions import NotFound
import google.auth
import google.auth.transport.requests
import requests

SCOPES = ["https://www.googleapis.com/auth/cloud-platform"]

# Use a sentinal value so that None can be explicitly passed as credentials for
# use in testing with local CDAP.
# https://treyhunner.com/2019/03/unique-and-sentinel-values-in-python/
DEFAULT_CREDENTIALS = object()


def _empty_if_not_found(api_call):
    """
    Decorator to help handle scenarios where CDAP REST API returns
    a misleading 404.

    For example, If there are no datasets (or streams) the CDAP REST API
    datasets (or streams) endpoint will return 404 instead of empty list
    """

    @wraps(api_call)
    def handle_not_found(*args, **kwargs):
        try:
            return api_call(*args, **kwargs)
        except NotFound:
            return []

    return handle_not_found


class CDAPClient(object):
    """
    Client for making CDAP REST API Calls.

    Args:
        api_endpoint (str):
            address of your CDAP instance. For Data Fusion this
            can be retrieved with:

            ..code:: shell

               gcloud beta data-fusion instance describe --location=${REGION} \
                 --format="value(apiEndpoint)" ${INSTANCE_NAME}

        namespace (str):
            Optional. Namespace to use if not specified. Defaults to
            ``'default'``.

        credentials (Optional[google.auth.credentials.Credentials]):
            ``google.auth`` credentials object to use in requests.
    """

    def __init__(self,
                 api_endpoint: str,
                 credentials=DEFAULT_CREDENTIALS,
                 namespace="default"):
        if credentials is DEFAULT_CREDENTIALS:
            credentials, _ = google.auth.default(scopes=SCOPES)
            self._transport = google.auth.transport.requests.AuthorizedSession(
                credentials)
        elif credentials is None:
            self._transport = requests
        else:
            self._transport = google.auth.transport.requests.AuthorizedSession(
                credentials)
        self._endpoint = api_endpoint
        self.namespace = namespace

    def _api_request(
            self,
            method: str,
            path: str,
            query_params: dict = None,
            data: str = None,
            headers: dict = None,
    ):
        response = self._transport.request(
            method,
            f"{self._endpoint}/{path}",
            params=query_params,
            data=data,
            headers=headers,
        )
        if 200 <= response.status_code < 300:
            return response.json()
        # TODO: handle retries on 500
        raise google.api_core.exceptions.from_http_status(
            response.status_code, response.text)

    def list_namespaces(self):
        return [
            namespace.get("name")
            for namespace in self._api_request("GET", "v3/namespaces")
        ]

    def list_apps(self, namespace=None):
        namespace = namespace or self.namespace
        return [
            app.get("name") for app in self._api_request(
                "GET", f"v3/namespaces/{namespace}/apps/")
        ]

    @_empty_if_not_found
    def list_datasets(self, namespace=None):
        namespace = namespace or self.namespace
        return [
            dataset.get("name") for dataset in self._api_request(
                "GET", f"v3/namespaces/{namespace}/data/datasets/")
        ]

    @_empty_if_not_found
    def list_streams(self, namespace=None):
        namespace = namespace or self.namespace
        return [
            stream.get("name") for stream in self._api_request(
                "GET", f"v3/namespaces/{namespace}/data/streams/")
        ]

    def list_lineage(self,
                     entity_type,
                     entity,
                     namespace=None,
                     start_ts="now-1d",
                     end_ts="now",
                     not_found_ok=True):
        namespace = namespace or self.namespace
        try:
            return self._api_request(
                "GET",
                f"v3/namespaces/{namespace}/{entity_type}/{entity}/lineage",
                query_params={
                    "start": start_ts,
                    "end": end_ts
                },
            )
        except google.api_core.exceptions.NotFound:
            return {}
