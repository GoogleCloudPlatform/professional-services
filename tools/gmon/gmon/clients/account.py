# Copyright 2020 Google Inc.
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#            http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.
"""
`account.py`
Cloud Operations Accounts Client.
"""
import logging
import os
import pprint
import time

from googleapiclient.discovery import build
from oauth2client import tools
from oauth2client.client import flow_from_clientsecrets
from oauth2client.file import Storage

API_SCOPES = ['https://www.googleapis.com/auth/monitoring']
API_SERVICE_NAME = 'stackdriver'
API_VERSION = 'v2'
API_KEY = os.environ.get('GCP_API_KEY')
API_OAUTH2_CREDENTIALS = os.environ.get('GCP_OAUTH2_CREDENTIALS')
BASE_URI = 'https://stackdriver.googleapis.com/$discovery/rest'
URI = f'{BASE_URI}?labels=ACCOUNTS_TRUSTED_TESTER&version=v2&key='

pp = pprint.PrettyPrinter(indent=2)

LOGGER = logging.getLogger(__name__)

# pylint: disable=E1101
class AccountClient:
    """Client for Cloud Operations Accounts API.

    Args:
        project_id (str): Cloud Monitoring host project id (workspace).
        no_poll (bool): No poll for response is set to True.
    """
    def __init__(self, project_id=None, no_poll=True):
        self.service = AccountClient._build_service()
        self.project_id = project_id
        self.account_name = f'accounts/{project_id}'
        self.no_poll = no_poll

    def get(self, include_projects=True):
        """Get a Cloud Operations Account.

        Args:
            include_projects (bool): Include monitored projects.

        Returns:
            obj: Cloud Operations Account.
        """
        LOGGER.info(f'Getting Cloud Operations Account "{self.account_name}"')
        results = self.service.accounts().get(
            name=self.account_name,
            includeProjects=include_projects).execute()
        pp.pprint(results)
        return results

    def list(self):
        """List all Cloud Operations accounts."""
        results = self.service.accounts().list().execute()
        pp.pprint(results)
        return results

    def create(self):
        """Create Cloud Operations workspace."""
        LOGGER.info(f'Creating Cloud Operations Account "{self.account_name}"')
        body = {'name': self.account_name}
        operation = self.service.accounts().create(body=body).execute()
        pp.pprint(operation)
        if not self.no_poll:
            self._poll(operation['name'])
        return operation

    # TODO: Uncomment this when `delete` operation is available.
    # def delete(self):
    #     """Delete Cloud Operations workspace."""
    #     LOGGER.info(f'Deleting Cloud Ops Account "{self.account_name}"')
    #     data = self._get_monitored_project(project_id)
    #     operation = service.accounts().projects().delete(
    #         parent=self.account_name, body=data).execute()
    #     pp.pprint(operation)
    #     if not self.no_poll:
    #         self._poll(operation['name'])
    #     return operation

    def link(self, project_id):
        """Link a project to the Cloud Operations Account.

        Args:
            project_id (str): Project id to link.

        Returns:
            obj: API result.
        """
        data = self._get_monitored_project(project_id)
        operation = self.service.accounts().projects().create(
            parent=self.account_name, body=data).execute()
        pp.pprint(operation)
        if not self.no_poll:
            self._poll(operation['name'])
        return operation

    # TODO: Uncomment this when `projects.delete` operation is available.
    # def unlink(self, project_id):
    #     """Unlink a project from the Cloud Operations Account.
    #
    #     Args:
    #         project_id (str): Project id to unlink.
    #
    #     Returns:
    #         obj: API result.
    #     """
    #     data = self._get_monitored_project(project_id)
    #     operation = self.service.accounts().projects().delete(
    #         parent=self.project_id, body=data).execute()
    #     pp.pprint(operation)
    #     if not self.no_poll:
    #         self._poll(operation['name'])
    #     return operation

    @classmethod
    def _build_service(cls):
        """Build Cloud Operations Account service resource.

        Returns:
            obj: Service object.
        """
        LOGGER.debug('Authenticating to Cloud Operations Accounts API ...')
        creds_store = '/tmp/creds_store'
        if not API_OAUTH2_CREDENTIALS:
            raise ValueError(
                'To use the Accounts API, please set the environment variable '
                'API_OAUTH2_CREDENTIALS')
        if not API_KEY:
            raise ValueError(
                'To use the Accounts API, please set the environment variable '
                'API_KEY')
        flow = flow_from_clientsecrets(API_OAUTH2_CREDENTIALS, API_SCOPES)
        credentials = Storage(creds_store).get()
        flags = tools.argparser.parse_args(args=[])
        # flags.noauth_local_webserver = True
        if credentials is None:
            credentials = tools.run_flow(flow, Storage(creds_store), flags)
        discovery_url = URI + API_KEY
        return build(API_SERVICE_NAME,
                     API_VERSION,
                     credentials=credentials,
                     discoveryServiceUrl=discovery_url)

    def _get_monitored_project(self, project_id):
        """Get monitored project data.

        Args:
            project_id: Monitored project id.

        Returns:
            dict: Monitored project data.
                name (str): Monitored project path.
                project_id (str): Monitored project id.
        """
        return {
            'name': f'accounts/{self.project_id}/projects/{project_id}',
            'project_id': project_id
        }

    def _poll(self, operation_name):
        """A long running operation poller that polls every 5 seconds till
        operation.

        Args:
            operation_name: An operation name.
        """
        operation = self.service.operations().get(
            name=operation_name).execute()
        while not operation.get('done', False):
            LOGGER.debug(f'Polling operation {operation_name} ...')
            time.sleep(5)
            operation = self.service.operations().get(
                name=operation_name).execute()
            pp.pprint(operation)
