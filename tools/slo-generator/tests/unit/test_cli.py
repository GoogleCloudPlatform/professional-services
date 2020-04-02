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

import os
import unittest

from mock import patch
from slo_generator.cli import parse_args, cli
from test_stubs import CTX, mock_sd

cwd = os.path.dirname(os.path.abspath(__file__))
root = os.path.dirname(os.path.dirname(cwd))


class TestCLI(unittest.TestCase):

    def setUp(self):
        for k, v in CTX.items():
            os.environ[k] = v
        slo_config = f'{root}/samples/stackdriver/slo_gae_app_availability.yaml'
        eb_policy = f'{root}/samples/error_budget_policy.yaml'
        self.slo_config = slo_config
        self.eb_policy = eb_policy

    def test_parse_args(self):
        args = parse_args([
            '--slo-config', self.slo_config, '--error-budget-policy',
            self.eb_policy, '--export'
        ])
        self.assertEqual(args.slo_config, self.slo_config)
        self.assertEqual(args.error_budget_policy, self.eb_policy)
        self.assertEqual(args.export, True)

    @patch('google.api_core.grpc_helpers.create_channel',
           return_value=mock_sd(8))
    def test_cli(self, mock):
        args = parse_args(['-f', self.slo_config, '-b', self.eb_policy])
        all_reports = cli(args)
        len_first_report = len(all_reports[self.slo_config])
        self.assertIn(self.slo_config, all_reports.keys())
        self.assertEqual(len_first_report, 4)

    @patch('google.api_core.grpc_helpers.create_channel',
           return_value=mock_sd(40))
    def test_cli_folder(self, mock):
        args = parse_args(
            ['-f', f'{root}/samples/stackdriver', '-b', self.eb_policy])
        all_reports = cli(args)
        len_first_report = len(all_reports[self.slo_config])
        self.assertIn(self.slo_config, all_reports.keys())
        self.assertEqual(len_first_report, 4)

    def test_cli_no_config(self):
        args = parse_args([
            '-f', f'{root}/samples', '-b',
            f'{root}/samples/error_budget_policy.yaml'
        ])
        all_reports = cli(args)
        self.assertEqual(all_reports, {})


if __name__ == '__main__':
    unittest.main()
