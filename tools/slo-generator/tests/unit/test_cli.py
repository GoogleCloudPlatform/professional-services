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

    def test_parse_args(self):
        slo_config_path = f'{cwd}/path/to/slo_config.json'
        error_budget_policy_path = f'{cwd}/path/to/error_budget_policy.json'
        args = parse_args([
            '--slo-config', slo_config_path, '--error-budget-policy',
            error_budget_policy_path, '--export'
        ])
        self.assertEqual(args.slo_config, slo_config_path)
        self.assertEqual(args.error_budget_policy, error_budget_policy_path)
        self.assertEqual(args.export, True)

    @patch('google.api_core.grpc_helpers.create_channel',
           return_value=mock_sd(8))
    def test_cli(self, mock):
        args = parse_args([
            '-f', f'{root}/samples/stackdriver/slo_gae_app_availability.yaml',
            '-b', f'{root}/samples/error_budget_policy.yaml'
        ])
        cli(args)

    @patch('google.api_core.grpc_helpers.create_channel',
           return_value=mock_sd(40))
    def test_cli_folder(self, mock):
        args = parse_args([
            '-f', f'{root}/samples/stackdriver', '-b',
            f'{root}/samples/error_budget_policy.yaml'
        ])
        cli(args)

    def test_cli_no_config(self):
        args = parse_args([
            '-f', f'{root}/samples', '-b',
            f'{root}/samples/error_budget_policy.yaml'
        ])
        cli(args)


if __name__ == '__main__':
    unittest.main()
