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
import datetime
import json
import logging
import unittest

from google.cloud.datastore import Entity
from google.cloud.datastore.client import Client
import mock
import webapp2

import common
from dns_sync import api
from dns_sync import audit_log
from dns_sync import auth
from dns_sync import main


class TestHandlers(unittest.TestCase):

    def setUp(self):
        logging.basicConfig(level=logging.DEBUG)

    def test_audit_log_loop_start(self):
        """Test that we can start the audit loop."""

        url = '/start_audit_log_loop'
        request = webapp2.Request.blank(url)
        request.method = 'POST'
        request.headers['content-type'] = 'application/json'

        data_files = common.read_data_files([
            'tests/data/monitoring.v3.json',
            'tests/data/audit-log-start-metric-list.json',
            'tests/data/audit-log-start-metric-create.json',
            'tests/data/compute.v1.json',
            'tests/data/audit-log-resource-get.json',
            'tests/data/audit-log-start-resource-insert.json'
        ])
        success = {'status': '200'}
        not_found = {'status': '404'}

        metrics_mock_http = common.LoggingHttpMockSequence(
            [(success, '{"access_token":"token","expires_in":3600}'),
             (success, data_files['monitoring.v3.json']),
             (success, data_files['audit-log-start-metric-list.json']),
             (success, data_files['audit-log-start-metric-create.json'])])

        api.Clients.metrics.http = metrics_mock_http
        api.Clients.metrics.cache_discovery = False

        compute_mock_http = common.LoggingHttpMockSequence(
            [(success, '{"access_token":"token","expires_in":3600}'),
             (success, data_files['compute.v1.json']),
             (not_found, ''),
             (success, data_files['audit-log-start-resource-insert.json'])])

        api.Clients.compute.http = compute_mock_http
        api.Clients.compute.cache_discovery = False

        mock_datastore = mock.Mock(spec=Client)
        mock_datastore.project = 'project-1'
        entity = mock.MagicMock(spec=Entity)

        mock_datastore.get.side_effect = [entity, common.config_entity()]
        api.CLIENTS.datastore = mock_datastore

        dns_sync_app = main.DnsSyncApplication()

        response = request.get_response(dns_sync_app)
        self.assertEquals(response.status_int, 200)

    def test_audit_log_loop_stop(self):
        """Test we can stop the audit loop."""

        url = '/stop_audit_log_loop'
        request = webapp2.Request.blank(url)
        request.method = 'POST'
        request.headers['content-type'] = 'application/json'

        data_files = common.read_data_files([
            'tests/data/monitoring.v3.json',
            'tests/data/audit-log-stop-metric-list.json',
            'tests/data/compute.v1.json',
            'tests/data/audit-log-resource-get.json',
            'tests/data/audit-log-stop-resource-delete.json'
        ])
        success = {'status': '200'}

        metrics_mock_http = common.LoggingHttpMockSequence(
            [(success, '{"access_token":"token","expires_in":3600}'),
             (success, data_files['monitoring.v3.json']),
             (success, data_files['audit-log-stop-metric-list.json'])])

        api.Clients.metrics.http = metrics_mock_http
        api.Clients.metrics.cache_discovery = False

        compute_mock_http = common.LoggingHttpMockSequence(
            [(success, '{"access_token":"token","expires_in":3600}'),
             (success, data_files['compute.v1.json']),
             (success, data_files['audit-log-resource-get.json']),
             (success, data_files['audit-log-stop-resource-delete.json'])])

        api.Clients.compute.http = compute_mock_http
        api.Clients.compute.cache_discovery = False

        mock_datastore = mock.Mock(spec=Client)
        mock_datastore.project = 'project-1'
        entity = dict()
        mock_datastore.get.side_effect = [entity, common.config_entity()]
        api.CLIENTS.datastore = mock_datastore

        dns_sync_app = main.DnsSyncApplication()

        response = request.get_response(dns_sync_app)
        self.assertEquals(response.status_int, 200)

    def test_audit_log_loop_event(self):
        """Test receiving an audit loop event."""

        url = '/push_notification?secret={}'.format('my-test-secret-key')
        request = webapp2.Request.blank(url)
        request.method = 'POST'
        request.headers['content-type'] = 'application/json'

        data_files = common.read_data_files([
            'tests/data/audit-log-loop-message.json',
            'tests/data/compute.v1.json',
            'tests/data/audit-log-loop-compute-operation.json',
            'tests/data/audit-log-resource-get.json',
            'tests/data/monitoring.v3.json',

            'tests/data/dns.v1.json',
            'tests/data/dns-zone-response.json',
            'tests/data/instance-creation-dns-pending-operation.json',
            'tests/data/instance-creation-dns-done-operation.json',
            'tests/data/instance-creation-dns-record-set-response.json'
        ])

        data = base64.encodestring(data_files[
            'audit-log-loop-message.json'])
        post = {
            'message': {
                'data': data,
                'attributes': {
                    'compute.googleapis.com/resource_id':
                    '18082097775580039429',
                    'compute.googleapis.com/resource_name': 'dns-sync-test',
                    'compute.googleapis.com/resource_type': 'instance',
                    'compute.googleapis.com/resource_zone': 'us-central1-a',
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
             (success, data_files['audit-log-loop-compute-operation.json']),
             (success, data_files['audit-log-resource-get.json']),
             # stop instance
             (success, data_files['audit-log-loop-compute-operation.json'])])

        api.Clients.compute.http = compute_mock_http
        api.Clients.compute.cache_discovery = False

        metrics_mock_http = common.LoggingHttpMockSequence(
            [(success, '{"access_token":"token","expires_in":3600}'),
             (success, data_files['monitoring.v3.json']),
             # timeseries.write
             (success, '{}')])

        api.Clients.metrics.http = metrics_mock_http
        api.Clients.metrics.cache_discovery = False

        mock_dns = mock.MagicMock()
        mock_dns.changes().get().execute.return_value = {'status': 'done'}
        api.Clients.dns = mock_dns

        mock_datastore = mock.Mock(spec=Client)
        mock_datastore.project = 'project-1'

        now = audit_log.utcnow()
        last_call_time = now - datetime.timedelta(0, 30)
        entity = Entity()
        entity.update({'running': True,
                       'last_call': 'start',
                       'last_call_time': last_call_time,
                       'last_call_event_received': False})

        mock_datastore.get.side_effect = [common.config_entity(), entity]
        api.CLIENTS.datastore = mock_datastore

        dns_sync_app = main.DnsSyncApplication()
        auth.AdminRequestHandler.SKIP_AUTHENTICATION = True

        # Get a response for that request.
        response = request.get_response(dns_sync_app)
        self.assertEquals(response.status_int, 200)
