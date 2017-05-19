# Copyright 2017 Google Inc.
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

import logging
import unittest

from dns_sync import api
from dns_sync import auth
from dns_sync import main
from google.cloud import datastore
from google.cloud.datastore import client
import mock
import webapp2

import common



class TestHandlers(unittest.TestCase):
    """Test syncing of projects."""

    def setUp(self):
        logging.basicConfig(level=logging.DEBUG)

    def test_project_sync(self):
        """Sync two projects."""

        url = '/sync_projects?projects={}&projects={}'.format('project-1',
                                                              'project-2')
        request = webapp2.Request.blank(url)
        request.method = 'POST'
        request.headers['content-type'] = 'application/json'

        data_files = common.read_data_files([
            'tests/data/compute.v1.json',
            'tests/data/project-sync-instance-list-project-1.json',
            'tests/data/project-sync-forwarding-rules-list-project-1.json',
            'tests/data/project-sync-instance-list-project-2.json',
            'tests/data/project-sync-forwarding-rules-list-project-2.json',
            'tests/data/dns.v1.json',
            'tests/data/dns-zone-response.json',
            'tests/data/project-sync-dns-record-set-response.json',
            'tests/data/project-sync-dns-pending-operation.json'
        ])

        success = {'status': '200'}

        compute_mock_http = common.LoggingHttpMockSequence([
            (success, '{"access_token":"token","expires_in":3600}'),
            (success, data_files['compute.v1.json']),
            (success, data_files['project-sync-instance-list-project-1.json']),
            (success,
             data_files['project-sync-forwarding-rules-list-project-1.json']),
            (success, data_files['project-sync-instance-list-project-2.json']),
            (success,
             data_files['project-sync-forwarding-rules-list-project-2.json'])
        ])
        api.Clients.compute.http = compute_mock_http
        api.Clients.compute.cache_discovery = False

        dns_mock_http = common.LoggingHttpMockSequence([
            (success, '{"access_token":"token","expires_in":3600}'),
            (success, data_files['dns.v1.json']),
            (success, data_files['dns-zone-response.json']),
            (success, data_files['project-sync-dns-record-set-response.json']),
            (success, data_files['project-sync-dns-pending-operation.json'])
        ])

        mock_datastore = mock.Mock(spec=client.Client)
        mock_datastore.project = 'project-1'
        entity = mock.MagicMock(spec=datastore.Entity)
        mock_datastore.get.return_value = entity

        api.Clients.dns.http = dns_mock_http
        api.Clients.dns.cache_discovery = False
        api.CLIENTS.datastore = mock_datastore

        dns_sync_app = main.DnsSyncApplication()

        auth.AdminRequestHandler.SKIP_AUTHENTICATION = True
        # Get a response for that request.
        response = request.get_response(dns_sync_app)
        self.assertEquals(response.status_int, 200)
