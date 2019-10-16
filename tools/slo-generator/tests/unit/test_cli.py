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

from slo_generator.cli import parse_args

cwd = os.path.dirname(os.path.abspath(__file__))


class TestCLI(unittest.TestCase):

    def test_parse_args(self):
        slo_config_path = f'{cwd}/fixtures/slo_config.json'
        error_budget_policy_path = f'{cwd}/fixtures/error_budget_policy.json'
        args = parse_args([
            "--slo-config", slo_config_path, "--error-budget-policy",
            error_budget_policy_path
        ])
        self.assertEqual(args.slo_config, slo_config_path)
        self.assertEqual(args.error_budget_policy, error_budget_policy_path)


if __name__ == '__main__':
    unittest.main()
