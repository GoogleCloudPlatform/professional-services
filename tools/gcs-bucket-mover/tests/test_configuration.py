# Copyright 2018 Google LLC. All rights reserved. Licensed under the Apache License, Version 2.0
# (the "License"); you may not use this file except in compliance with the License. You may obtain
# a copy of the License at
#
# http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software distributed under the License
# is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express
# or implied. See the License for the specific language governing permissions and limitations under
# the License.
#
# Any software provided by Google hereunder is distributed "AS IS", WITHOUT WARRANTIES OR
# CONDITIONS OF ANY KIND, and is not intended for production use.
"""Tests for the configuration.py file"""

from __future__ import absolute_import
from __future__ import division
from __future__ import print_function
import os
import unittest

import mock
from google.auth import environment_vars

from gcs_bucket_mover import configuration
from tests import common


@mock.patch('google.cloud.storage.Client', mock.MagicMock())
@mock.patch('google.cloud.logging.Client', mock.MagicMock())
@mock.patch(
    'google.oauth2.service_account.Credentials.from_service_account_file')
class TestConfiguration(unittest.TestCase):
    """Tests for the logic in the Configuration class."""

    def setUp(self):
        self.parsed_args = common.get_mock_args()

    def test_default_constructor(self, mock_from_service_account_file):
        """Tests the default object is successfully created."""
        config = configuration.Configuration.from_conf(self.parsed_args)

        # Test that the properties are set to the parsed_args values
        self.assertEqual(self.parsed_args.source_project, config.source_project)
        self.assertEqual(self.parsed_args.target_project, config.target_project)
        self.assertEqual(self.parsed_args.bucket_name, config.bucket_name)
        self.assertEqual(self.parsed_args.bucket_name,
                         config.target_bucket_name)
        self.assertEqual(self.parsed_args.bucket_name + '-temp',
                         config.temp_bucket_name)
        self.assertFalse(config.is_rename)
        self.assertFalse(config.disable_bucket_lock)
        self.assertEqual(self.parsed_args.lock_file_name, config.lock_file_name)
        calls = [
            mock.call(self.parsed_args.gcp_source_project_service_account_key),
            mock.call(self.parsed_args.gcp_target_project_service_account_key)
        ]
        mock_from_service_account_file.assert_has_calls(calls)

    def test_temp_bucket_name(self, mock_from_service_account_file):
        """Test that a specific temp_bucket_name is correctly set."""
        self.parsed_args.temp_bucket_name = 'temp'
        config = configuration.Configuration.from_conf(self.parsed_args)

        self.assertEqual(self.parsed_args.source_project, config.source_project)
        self.assertEqual(self.parsed_args.target_project, config.target_project)
        self.assertEqual(self.parsed_args.bucket_name, config.bucket_name)
        self.assertEqual(self.parsed_args.bucket_name,
                         config.target_bucket_name)
        self.assertEqual('temp', config.temp_bucket_name)
        self.assertFalse(config.is_rename)
        self.assertFalse(config.disable_bucket_lock)
        self.assertEqual(self.parsed_args.lock_file_name, config.lock_file_name)
        calls = [
            mock.call(self.parsed_args.gcp_source_project_service_account_key),
            mock.call(self.parsed_args.gcp_target_project_service_account_key)
        ]
        mock_from_service_account_file.assert_has_calls(calls)

    def test_target_bucket_name(self, mock_from_service_account_file):
        """Test that the target_bucket_name is correctly set."""
        self.parsed_args.rename_bucket_to = 'target'
        config = configuration.Configuration.from_conf(self.parsed_args)

        self.assertEqual(self.parsed_args.source_project, config.source_project)
        self.assertEqual(self.parsed_args.target_project, config.target_project)
        self.assertEqual(self.parsed_args.bucket_name, config.bucket_name)
        self.assertEqual('target', config.target_bucket_name)
        self.assertEqual(self.parsed_args.bucket_name + '-temp',
                         config.temp_bucket_name)
        self.assertTrue(config.is_rename)
        self.assertFalse(config.disable_bucket_lock)
        self.assertEqual(self.parsed_args.lock_file_name, config.lock_file_name)
        calls = [
            mock.call(self.parsed_args.gcp_source_project_service_account_key),
            mock.call(self.parsed_args.gcp_target_project_service_account_key)
        ]
        mock_from_service_account_file.assert_has_calls(calls)

    @mock.patch.dict(os.environ, {environment_vars.CREDENTIALS: 'env_key_path'})
    def test_source_key_is_none(self, mock_from_service_account_file):
        """Test that the source project credentials are set from the environment
         when the config value is not supplied variable."""
        self.parsed_args.gcp_source_project_service_account_key = None
        config = configuration.Configuration.from_conf(self.parsed_args)

        self.assertEqual(self.parsed_args.source_project, config.source_project)
        self.assertEqual(self.parsed_args.target_project, config.target_project)
        self.assertEqual(self.parsed_args.bucket_name, config.bucket_name)
        self.assertEqual(self.parsed_args.bucket_name,
                         config.target_bucket_name)
        self.assertEqual(self.parsed_args.bucket_name + '-temp',
                         config.temp_bucket_name)
        self.assertFalse(config.is_rename)
        self.assertFalse(config.disable_bucket_lock)
        self.assertEqual(self.parsed_args.lock_file_name, config.lock_file_name)
        calls = [
            mock.call('env_key_path'),
            mock.call(self.parsed_args.gcp_target_project_service_account_key)
        ]
        mock_from_service_account_file.assert_has_calls(calls)

    @mock.patch.dict(os.environ, {environment_vars.CREDENTIALS: 'env_key_path'})
    def test_source_key_is_none_string(self, mock_from_service_account_file):
        """Test that the source project credentials are set from the environment when
         the config value provided is empty (and parsed as 'None' by the parser)."""
        self.parsed_args.gcp_source_project_service_account_key = 'None'
        config = configuration.Configuration.from_conf(self.parsed_args)

        self.assertEqual(self.parsed_args.source_project, config.source_project)
        self.assertEqual(self.parsed_args.target_project, config.target_project)
        self.assertEqual(self.parsed_args.bucket_name, config.bucket_name)
        self.assertEqual(self.parsed_args.bucket_name,
                         config.target_bucket_name)
        self.assertEqual(self.parsed_args.bucket_name + '-temp',
                         config.temp_bucket_name)
        self.assertFalse(config.is_rename)
        self.assertFalse(config.disable_bucket_lock)
        self.assertEqual(self.parsed_args.lock_file_name, config.lock_file_name)
        calls = [
            mock.call('env_key_path'),
            mock.call(self.parsed_args.gcp_target_project_service_account_key)
        ]
        mock_from_service_account_file.assert_has_calls(calls)

    @mock.patch.dict(os.environ, {environment_vars.CREDENTIALS: 'env_key_path'})
    def test_target_key_is_none(self, mock_from_service_account_file):
        """Test that the target project credentials are set from the environment
         when the config value is not supplied variable."""
        self.parsed_args.gcp_target_project_service_account_key = None
        config = configuration.Configuration.from_conf(self.parsed_args)

        self.assertEqual(self.parsed_args.source_project, config.source_project)
        self.assertEqual(self.parsed_args.target_project, config.target_project)
        self.assertEqual(self.parsed_args.bucket_name, config.bucket_name)
        self.assertEqual(self.parsed_args.bucket_name,
                         config.target_bucket_name)
        self.assertEqual(self.parsed_args.bucket_name + '-temp',
                         config.temp_bucket_name)
        self.assertFalse(config.is_rename)
        self.assertFalse(config.disable_bucket_lock)
        self.assertEqual(self.parsed_args.lock_file_name, config.lock_file_name)
        calls = [
            mock.call(self.parsed_args.gcp_source_project_service_account_key),
            mock.call('env_key_path')
        ]
        mock_from_service_account_file.assert_has_calls(calls)

    @mock.patch.dict(os.environ, {environment_vars.CREDENTIALS: 'env_key_path'})
    def test_source_key_is_none_string(self, mock_from_service_account_file):
        """Test that the target project credentials are set from the environment when
         the config value provided is empty (and parsed as 'None' by the parser)."""
        self.parsed_args.gcp_target_project_service_account_key = 'None'
        config = configuration.Configuration.from_conf(self.parsed_args)

        self.assertEqual(self.parsed_args.source_project, config.source_project)
        self.assertEqual(self.parsed_args.target_project, config.target_project)
        self.assertEqual(self.parsed_args.bucket_name, config.bucket_name)
        self.assertEqual(self.parsed_args.bucket_name,
                         config.target_bucket_name)
        self.assertEqual(self.parsed_args.bucket_name + '-temp',
                         config.temp_bucket_name)
        self.assertFalse(config.is_rename)
        self.assertFalse(config.disable_bucket_lock)
        self.assertEqual(self.parsed_args.lock_file_name, config.lock_file_name)
        calls = [
            mock.call(self.parsed_args.gcp_source_project_service_account_key),
            mock.call('env_key_path')
        ]
        mock_from_service_account_file.assert_has_calls(calls)


if __name__ == '__main__':
    unittest.main()
