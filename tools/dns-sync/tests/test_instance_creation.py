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

import base64
import json
import logging
import unittest

from dns_sync import api
from dns_sync import main
from google.cloud.datastore import client
import mock
import webapp2

import common


class TestHandlers(unittest.TestCase):
    """Test processing of instance creation events."""
    def setUp(self):
        logging.basicConfig(level=logging.DEBUG)

    def test_gce_api_push_notification(self):
        """Push notification event for instance creation."""

        url = '/push_notification?secret={}'.format('my-test-secret-key')
        request = webapp2.Request.blank(url)
        request.method = 'POST'
        request.headers['content-type'] = 'application/json'

        data_files = common.read_data_files([
            'tests/data/instance-creation-insert-done-message.json',
            'tests/data/compute.v1.json',
            'tests/data/instance-creation-compute-operation.json',
            'tests/data/instance-creation-instance-get.json',
            'tests/data/dns.v1.json', 'tests/data/dns-zone-response.json',
            'tests/data/instance-creation-dns-pending-operation.json',
            'tests/data/instance-creation-dns-done-operation.json',
            'tests/data/instance-creation-dns-record-set-response.json'
        ])

        data = base64.encodestring(data_files[
            'instance-creation-insert-done-message.json'])
        post = {
            'message': {
                'data': data,
                'attributes': {
                    'compute.googleapis.com/resource_id':
                    '18082097775580039429',
                    'compute.googleapis.com/resource_name': 'instance-6',
                    'compute.googleapis.com/resource_type': 'instance',
                    'compute.googleapis.com/resource_zone': 'us-central1-c',
                    'logging.googleapis.com/timestamp':
                    '2016-04-03T23: 06: 31.17867Z'
                },
                'message_id': '29119446125187'
            },
            'subscription': 'projects/project-1/subscriptions/gae-push'
        }
        request.body = json.dumps(post)

        success = {'status': '200'}

        compute_mock_http = common.LoggingHttpMockSequence(
            [(success, '{"access_token":"token","expires_in":3600}'),
             (success, data_files['compute.v1.json']),
             (success, data_files['instance-creation-compute-operation.json']),
             (success, data_files['instance-creation-instance-get.json'])])
        api.Clients.compute.http = compute_mock_http
        api.Clients.compute.cache_discovery = False

        dns_mock_http = common.LoggingHttpMockSequence([
            (success, '{"access_token":"token","expires_in":3600}'),
            (success, data_files['dns.v1.json']),
            (success, data_files['dns-zone-response.json']),
            # instance-1.internal.project-1.mydnsdomain.com
            (success,
             data_files['instance-creation-dns-record-set-response.json']),
            # instance-1.project-1.mydnsdomain.com
            (success,
             data_files['instance-creation-dns-record-set-response.json']),
            # nic0.instance-1.internal.project-1.mydnsdomain.com
            (success,
             data_files['instance-creation-dns-record-set-response.json']),
            # nic0.instance-1.project-1.mydnsdomain.com
            (success,
             data_files['instance-creation-dns-record-set-response.json']),
            # make change
            (success,
             data_files['instance-creation-dns-pending-operation.json']),
            (success, data_files['instance-creation-dns-done-operation.json']),
        ])

        mock_datastore = mock.Mock(spec=client.Client)
        mock_datastore.project = 'project-1'
        mock_datastore.get.side_effect = [common.config_entity()]

        api.CLIENTS.datastore = mock_datastore

        api.Clients.dns.http = dns_mock_http
        api.Clients.dns.cache_discovery = False

        dns_sync_app = main.DnsSyncApplication()

        response = request.get_response(dns_sync_app)
        self.assertEquals(response.status_int, 200)
