# Copyright 2019 Google Inc.
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
import os
import unittest

from mock import patch
from gmon.cli import parse_args, cli
from test_stubs import (mock_cm_list_metric_descriptors,
                        mock_cm_inspect_metric_descriptors,
                        mock_cm_list_services, mock_cm_list_slos)

cwd = os.path.dirname(os.path.abspath(__file__))
root = os.path.dirname(os.path.dirname(cwd))

PROJECT_ID = 'fake_project_id'
SERVICE_ID = 'kkKv9xDqTs6SgN6l6wqa-w'
SSM_MOCK = "gmon.clients.service_monitoring.ServiceMonitoringServiceClient"  # noqa: E501


# pylint: disable=E501
class TestCLI(unittest.TestCase):

    def setUp(self):
        pass

    def test_parse_args_metrics_list(self):
        parsers, args = parse_args(
            ['metrics', 'list', 'custom.', '-p', PROJECT_ID])
        self.assertEqual(args.parser, 'metrics')
        self.assertEqual(args.operation, 'list')
        self.assertEqual(args.project, PROJECT_ID)
        self.assertEqual(args.regex, 'custom.')

    def test_parse_args_metrics_inspect(self):
        parsers, args = parse_args([
            'metrics', 'inspect', 'custom.googleapis.com/fake', '-p', PROJECT_ID
        ])
        self.assertEqual(args.parser, 'metrics')
        self.assertEqual(args.operation, 'inspect')
        self.assertEqual(args.project, PROJECT_ID)
        self.assertEqual(getattr(args, 'metric-type'),
                         'custom.googleapis.com/fake')

    def test_parse_args_services_list(self):
        parsers, args = parse_args(['services', 'list', '-p', PROJECT_ID])
        self.assertEqual(args.parser, 'services')
        self.assertEqual(args.operation, 'list')
        self.assertEqual(args.project, PROJECT_ID)

    def test_parse_args_slos_list(self):
        parsers, args = parse_args(
            ['slos', 'list', '-p', PROJECT_ID, SERVICE_ID])
        self.assertEqual(args.parser, 'slos')
        self.assertEqual(args.operation, 'list')
        self.assertEqual(args.project, PROJECT_ID)
        self.assertEqual(args.service_id, SERVICE_ID)

    def test_parse_args_accounts_get(self):
        parsers, args = parse_args(['accounts', 'get', '-p', PROJECT_ID])
        self.assertEqual(args.parser, 'accounts')
        self.assertEqual(args.operation, 'get')
        self.assertEqual(args.project, PROJECT_ID)

    def test_parse_args_account_get(self):
        parsers, args = parse_args(['accounts', 'get', '-p', PROJECT_ID])
        self.assertEqual(args.parser, 'accounts')
        self.assertEqual(args.operation, 'get')
        self.assertEqual(args.project, PROJECT_ID)

    @patch('google.api_core.grpc_helpers.create_channel',
           return_value=mock_cm_list_metric_descriptors())
    def test_cli_metrics_list(self, mock):
        parsers, args = parse_args(
            ['metrics', 'list', 'custom.googleapis.com/fake', '-p', PROJECT_ID])
        response = cli(parsers, args)
        logging.info(response)

    @patch('google.api_core.grpc_helpers.create_channel',
           return_value=mock_cm_inspect_metric_descriptors())
    def test_cli_metrics_inspect(self, mock):
        parsers, args = parse_args([
            'metrics', 'inspect', 'custom.googleapis.com/invoice/paid/amount',
            '-p', PROJECT_ID
        ])
        mlabel_keys = [
            'type', 'name', 'metricKind', 'valueType', 'description',
            'displayName', 'event_type'
        ]
        rlabel_keys = ['instance_id', 'project_id', 'zone']

        responses = cli(parsers, args)
        response = responses[0]

        mtype = response['metric']['type']
        mlabels = response['metric']['labels']
        rtype = response['resource']['type']
        rlabels = response['resource']['labels']
        mpoints = response['points']
        mintval = mpoints[0]['value']['int64Value']

        self.assertEqual(mtype, 'custom.googleapis.com/invoice/paid/amount')
        self.assertEqual(sorted(list(mlabels.keys())), sorted(mlabel_keys))
        self.assertEqual(len(mpoints), 1)
        self.assertEqual(mintval, '100')
        self.assertEqual(rtype, 'gce_instance')
        self.assertEqual(sorted(list(rlabels.keys())), sorted(rlabel_keys))

    @patch('google.api_core.grpc_helpers.create_channel',
           return_value=mock_cm_list_services())
    def test_cli_services_list(self, *mocks):
        parsers, args = parse_args(['services', 'list', '-p', PROJECT_ID])
        responses = cli(parsers, args)
        response = responses[0]
        display_name = response['displayName']
        service_id = response['name'].split('/')[-1]
        self.assertEqual(len(responses), 1)
        self.assertEqual(display_name, 'fake')
        self.assertEqual(service_id, SERVICE_ID)

    @patch('google.api_core.grpc_helpers.create_channel',
           return_value=mock_cm_list_slos())
    def test_cli_slos_list(self, *mocks):
        parsers, args = parse_args(
            ['slos', 'list', '-p', PROJECT_ID, SERVICE_ID])
        responses = cli(parsers, args)
        response = responses[0]
        display_name = response['displayName']
        goal = response['goal']
        rolling_period = response['rollingPeriod']
        sli = response['serviceLevelIndicator']['basicSli']
        threshold = sli['latency']['threshold']
        self.assertEqual(len(responses), 1)
        self.assertEqual(display_name, 'fake')
        self.assertEqual(goal, 0.999)
        self.assertEqual(rolling_period, '86400s')
        self.assertEqual(threshold, '0.724s')

    # Add when API spec is made public (currently EAP)
    # def test_cli_accounts_get(self, mock):
    #     parsers, args = parse_args([
    #         'accounts', 'get', '-p', PROJECT_ID
    #     ])
    #     responses = cli(parsers, args)
    #     response = responses[0]


if __name__ == '__main__':
    unittest.main()
