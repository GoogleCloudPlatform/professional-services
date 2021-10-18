# Copyright 2021 Google Inc. All Rights Reserved.
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
"""Functions to provide an interface to GCP discovery and client apis."""

import logging
import subprocess

import google.auth
import google.auth.transport.requests

from googleapiclient import discovery
from googleapiclient import errors
from googleapiclient.discovery_cache import base as discovery_cache_base

from google.cloud import bigquery
from google.cloud import pubsub_v1

# API details
_COMPUTE_SERVICE_NAME = 'compute'
_COMPUTE_SERVICE_API_VERSION = 'v1'

_FOLDERS_SERVICE_NAME = 'cloudresourcemanager'
_FOLDERS_SERVICE_API_VERSION = 'v2'

_MONITORING_SERVICE_NAME = 'monitoring'
_MONITORING_SERVICE_API_VERSION = 'v3'

_PROJECTS_SERVICE_NAME = 'cloudresourcemanager'
_PROJECTS_SERVICE_API_VERSION = 'v1'

_METADATA_URL = ('http://metadata/computeMetadata/v1/instance/service-accounts'
                 '/default/identity?audience=')

# No.of retires when making a query against GCP API's.
_NUM_RETRIES = 3


# From github to avoid unneccessary errors in the logs
# github.com/GoogleCloudPlatform/python-docs-samples/
# commit/22788da481a8441500203ccc7fbf37cd9fcafa3b
class _MemoryCache(discovery_cache_base.Cache):
    """Simple cache to hold discovery information."""
    _CACHE = {}

    def get(self, url):
        return _MemoryCache._CACHE.get(url)

    def set(self, url, content):
        _MemoryCache._CACHE[url] = content


def bigquery_client():
    """Return BigQuery client."""
    return bigquery.Client()


def pubsub_client():
    """Return Pubsub client."""
    return pubsub_v1.PublisherClient()


def compute_service(creds=None):
    """Build Compute service."""
    service = discovery.build(_COMPUTE_SERVICE_NAME,
                              _COMPUTE_SERVICE_API_VERSION,
                              credentials=creds,
                              cache=_MemoryCache())
    return service


def folders_service(creds=None):
    """Build folders service."""
    service = discovery.build(_FOLDERS_SERVICE_NAME,
                              _FOLDERS_SERVICE_API_VERSION,
                              credentials=creds,
                              cache=_MemoryCache())
    return service.folders()  # pylint: disable=no-member


def monitoring_service(creds=None):
    """Build monitoring service."""
    service = discovery.build(_MONITORING_SERVICE_NAME,
                              _MONITORING_SERVICE_API_VERSION,
                              credentials=creds,
                              cache=_MemoryCache())
    return service


def projects_service(creds=None):
    """Build projects service."""
    service = discovery.build(_PROJECTS_SERVICE_NAME,
                              _PROJECTS_SERVICE_API_VERSION,
                              credentials=creds,
                              cache=_MemoryCache())
    return service.projects()  # pylint: disable=no-member


def get_access_token():
    """Return access token for use in API request.

    Raises:
        requests.exceptions.ConnectionError.
    """
    credentials, _ = google.auth.default(scopes=[
        'https://www.googleapis.com/auth/cloud-platform',
        'https://www.googleapis.com/auth/cloud-platform.read-only'
    ])
    request = google.auth.transport.requests.Request()
    credentials.refresh(request)
    return credentials.token


def get_access_token_gcloud():
    """Return access token(for use in API request) using gcloud command."""
    command = 'gcloud auth print-access-token'
    response = execute_command(command)
    if response:
        return response[0].decode('utf-8')
    return ''


def execute_command(command):
    """Execute a bash command and return the result.

    Args:
        command: str, gcloud command to execute.

    Returns:
        tuple, stdout and stderr result.
    """
    res = None
    with subprocess.Popen(command, shell=True,
                          stdout=subprocess.PIPE) as process:
        res = process.communicate()
    # Returns (stdout, stderr)
    return res


def execute_request(request):
    """Execute GCP API request and return results.

    Args:
        request: obj, http request.

    Returns:
        response object if successful else None.
    """
    try:
        return request.execute(num_retries=_NUM_RETRIES)
    except errors.HttpError as err:
        logging.error(err)
