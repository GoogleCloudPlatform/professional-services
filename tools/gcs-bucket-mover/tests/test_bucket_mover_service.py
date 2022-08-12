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
"""Tests for the bucket_mover_service.py file"""

from __future__ import absolute_import
from __future__ import division
from __future__ import print_function
import unittest

import mock
from google.cloud import exceptions
from retrying import RetryError

from gcs_bucket_mover import bucket_details
from gcs_bucket_mover import bucket_mover_service
from tests import common


class TestBucketMoverService(unittest.TestCase):
    """Tests for the logic in the bucket_mover_service module.

    That module is very much an iceberg module that should be split into smaller
    classes. Until that happens, these tests are run against private methods.
    """

    @mock.patch('gcs_bucket_mover.bucket_mover_service._lock_down_bucket')
    def test_bucket_lock_true(self, mock_lock_down_bucket):
        """Tests that the --disable_bucket_lock flag is handled correctly"""
        mock_source_bucket_details = mock.MagicMock()
        mock_source_bucket_details.iam_policy.to_api_repr.return_value = ''
        mock_config = mock.MagicMock()
        mock_config.disable_bucket_lock = False

        bucket_mover_service._check_bucket_lock(mock.MagicMock(), mock_config,
                                                mock.MagicMock(),
                                                mock_source_bucket_details)

        mock_lock_down_bucket.assert_called_once()

    @mock.patch('gcs_bucket_mover.bucket_mover_service._lock_down_bucket')
    def test_bucket_lock_false(self, mock_lock_down_bucket):
        """Tests that the --disable_bucket_lock flag is handled correctly"""
        mock_config = mock.MagicMock()
        mock_config.disable_bucket_lock = True

        bucket_mover_service._check_bucket_lock(mock.MagicMock(), mock_config,
                                                mock.MagicMock(),
                                                mock.MagicMock())

        mock_lock_down_bucket.assert_not_called()

    @mock.patch('google.cloud.storage.Blob')
    def test_lock_file_found(self, mock_blob):
        """Tests that the lock file is found."""
        mock_blob_instance = mock.MagicMock()
        mock_blob.return_value = mock_blob_instance
        mock_blob_instance.exists.return_value = True

        spinner_mock = mock.MagicMock()
        with self.assertRaises(SystemExit) as context:
            bucket_mover_service._lock_down_bucket(spinner_mock,
                                                   mock.MagicMock(),
                                                   mock.MagicMock(),
                                                   mock.MagicMock(),
                                                   mock.MagicMock())

            spinner_mock.fail.assert_called_once_with('X')
            self.assertIn('lock file exists', context.exception)

    @mock.patch('google.cloud.storage.Blob')
    def test_lock_file_not_found(self, mock_blob):
        """Tests that the lock file is not found."""
        mock_blob_instance = mock.MagicMock()
        mock_blob.return_value = mock_blob_instance
        mock_blob_instance.exists.return_value = False

        spinner_mock = mock.MagicMock()
        cloud_logger_mock = mock.MagicMock()
        bucket_mock = common.get_mock_source_bucket()
        bucket_mover_service._lock_down_bucket(spinner_mock, cloud_logger_mock,
                                               bucket_mock, None, 'email')

        spinner_mock.ok.assert_called_once_with(bucket_mover_service._CHECKMARK)
        #bucket_mock.acl.save_predefined.assert_called_once_with('private')
        bucket_mock.set_iam_policy.assert_called_once()

    @mock.patch('google.cloud.storage.Bucket')
    @mock.patch(
        'gcs_bucket_mover.bucket_mover_service._add_target_project_to_kms_key')
    @mock.patch('gcs_bucket_mover.bucket_mover_service._create_bucket_api_call')
    @mock.patch('gcs_bucket_mover.bucket_mover_service._update_acl_entities')
    @mock.patch('gcs_bucket_mover.bucket_mover_service._update_iam_policies')
    @mock.patch('gcs_bucket_mover.bucket_mover_service._update_notifications')
    @mock.patch('gcs_bucket_mover.bucket_mover_service._write_spinner_and_log',
                mock.MagicMock())
    def test_create_bucket_all_features(
            self, mock_update_notifications, mock_update_iam_policies,
            mock_update_acl_entities, mock_create_bucket_api_call,
            mock_add_target_project_to_kms_key, mock_bucket):
        """Tests that the create bucket happens with all associated features"""
        self.parsed_args = common.get_mock_args()
        self.source_bucket = common.get_mock_source_bucket()
        details = bucket_details.BucketDetails(
            conf=self.parsed_args, source_bucket=self.source_bucket)

        mock_bucket_instance = mock.MagicMock()
        mock_bucket.return_value = mock_bucket_instance

        bucket_mover_service._create_bucket(mock.MagicMock(), mock.MagicMock(),
                                            mock.MagicMock(), mock.MagicMock(),
                                            details)

        self.assertEqual(details.default_kms_key_name,
                         mock_bucket_instance.default_kms_key_name)
        mock_add_target_project_to_kms_key.assert_called_once()
        mock_bucket_instance.enable_logging.assert_called_once_with(
            details.logging['logBucket'], details.logging['logObjectPrefix'])
        mock_create_bucket_api_call.assert_called_once()
        mock_update_iam_policies.assert_called_once()
        self.assertEqual(2, mock_update_acl_entities.call_count)
        mock_bucket_instance.acl.save.assert_called_once()
        mock_bucket_instance.default_object_acl.save.assert_called_once()
        mock_update_notifications.assert_called_once()

    @mock.patch('google.cloud.storage.Bucket')
    @mock.patch(
        'gcs_bucket_mover.bucket_mover_service._add_target_project_to_kms_key')
    @mock.patch('gcs_bucket_mover.bucket_mover_service._create_bucket_api_call')
    @mock.patch('gcs_bucket_mover.bucket_mover_service._update_acl_entities')
    @mock.patch('gcs_bucket_mover.bucket_mover_service._update_iam_policies')
    @mock.patch('gcs_bucket_mover.bucket_mover_service._update_notifications')
    @mock.patch('gcs_bucket_mover.bucket_mover_service._write_spinner_and_log',
                mock.MagicMock())
    def test_create_bucket_skip_kms_key(
            self, mock_update_notifications, mock_update_iam_policies,
            mock_update_acl_entities, mock_create_bucket_api_call,
            mock_add_target_project_to_kms_key, mock_bucket):
        """Tests that the create bucket happens without the kms key"""
        self.parsed_args = common.get_mock_args()
        self.source_bucket = common.get_mock_source_bucket()
        details = bucket_details.BucketDetails(
            conf=self.parsed_args, source_bucket=self.source_bucket)
        details.default_kms_key_name = None

        mock_bucket_instance = mock.MagicMock()
        mock_bucket.return_value = mock_bucket_instance

        bucket_mover_service._create_bucket(mock.MagicMock(), mock.MagicMock(),
                                            mock.MagicMock(), mock.MagicMock(),
                                            details)

        mock_add_target_project_to_kms_key.assert_not_called()
        mock_bucket_instance.enable_logging.assert_called_once_with(
            details.logging['logBucket'], details.logging['logObjectPrefix'])
        mock_create_bucket_api_call.assert_called_once()
        mock_update_iam_policies.assert_called_once()
        self.assertEqual(2, mock_update_acl_entities.call_count)
        mock_bucket_instance.acl.save.assert_called_once()
        mock_bucket_instance.default_object_acl.save.assert_called_once()
        mock_update_notifications.assert_called_once()

    @mock.patch('google.cloud.storage.Bucket')
    @mock.patch(
        'gcs_bucket_mover.bucket_mover_service._add_target_project_to_kms_key')
    @mock.patch('gcs_bucket_mover.bucket_mover_service._create_bucket_api_call')
    @mock.patch('gcs_bucket_mover.bucket_mover_service._update_acl_entities')
    @mock.patch('gcs_bucket_mover.bucket_mover_service._update_iam_policies')
    @mock.patch('gcs_bucket_mover.bucket_mover_service._update_notifications')
    @mock.patch('gcs_bucket_mover.bucket_mover_service._write_spinner_and_log',
                mock.MagicMock())
    def test_create_bucket_logging_skip(
            self, mock_update_notifications, mock_update_iam_policies,
            mock_update_acl_entities, mock_create_bucket_api_call,
            mock_add_target_project_to_kms_key, mock_bucket):
        """Tests that the create bucket happens without the logging set"""
        self.parsed_args = common.get_mock_args()
        self.source_bucket = common.get_mock_source_bucket()
        details = bucket_details.BucketDetails(
            conf=self.parsed_args, source_bucket=self.source_bucket)
        details.logging = None

        mock_bucket_instance = mock.MagicMock()
        mock_bucket.return_value = mock_bucket_instance

        bucket_mover_service._create_bucket(mock.MagicMock(), mock.MagicMock(),
                                            mock.MagicMock(), mock.MagicMock(),
                                            details)

        self.assertEqual(details.default_kms_key_name,
                         mock_bucket_instance.default_kms_key_name)
        mock_add_target_project_to_kms_key.assert_called_once()
        mock_bucket_instance.enable_logging.assert_not_called()
        mock_create_bucket_api_call.assert_called_once()
        mock_update_iam_policies.assert_called_once()
        self.assertEqual(2, mock_update_acl_entities.call_count)
        mock_bucket_instance.acl.save.assert_called_once()
        mock_bucket_instance.default_object_acl.save.assert_called_once()
        mock_update_notifications.assert_called_once()

    @mock.patch('google.cloud.storage.Bucket')
    @mock.patch(
        'gcs_bucket_mover.bucket_mover_service._add_target_project_to_kms_key')
    @mock.patch('gcs_bucket_mover.bucket_mover_service._create_bucket_api_call')
    @mock.patch('gcs_bucket_mover.bucket_mover_service._update_acl_entities')
    @mock.patch('gcs_bucket_mover.bucket_mover_service._update_iam_policies')
    @mock.patch('gcs_bucket_mover.bucket_mover_service._update_notifications')
    @mock.patch('gcs_bucket_mover.bucket_mover_service._write_spinner_and_log',
                mock.MagicMock())
    def test_create_bucket_iam_skip(
            self, mock_update_notifications, mock_update_iam_policies,
            mock_update_acl_entities, mock_create_bucket_api_call,
            mock_add_target_project_to_kms_key, mock_bucket):
        """Tests that the create bucket happens without the iam policy set"""
        self.parsed_args = common.get_mock_args()
        self.source_bucket = common.get_mock_source_bucket()
        details = bucket_details.BucketDetails(
            conf=self.parsed_args, source_bucket=self.source_bucket)
        details.iam_policy = None

        mock_bucket_instance = mock.MagicMock()
        mock_bucket.return_value = mock_bucket_instance

        bucket_mover_service._create_bucket(mock.MagicMock(), mock.MagicMock(),
                                            mock.MagicMock(), mock.MagicMock(),
                                            details)
        

        self.assertEqual(details.default_kms_key_name,
                         mock_bucket_instance.default_kms_key_name)
        mock_add_target_project_to_kms_key.assert_called_once()
        mock_bucket_instance.enable_logging.assert_called_once_with(
            details.logging['logBucket'], details.logging['logObjectPrefix'])
        mock_create_bucket_api_call.assert_called_once()
        mock_update_iam_policies.assert_not_called()
        self.assertEqual(2, mock_update_acl_entities.call_count)
        mock_bucket_instance.acl.save.assert_called_once()
        mock_bucket_instance.default_object_acl.save.assert_called_once()
        mock_update_notifications.assert_called_once()

    @mock.patch('google.cloud.storage.Bucket')
    @mock.patch(
        'gcs_bucket_mover.bucket_mover_service._add_target_project_to_kms_key')
    @mock.patch('gcs_bucket_mover.bucket_mover_service._create_bucket_api_call')
    @mock.patch('gcs_bucket_mover.bucket_mover_service._update_acl_entities')
    @mock.patch('gcs_bucket_mover.bucket_mover_service._update_iam_policies')
    @mock.patch('gcs_bucket_mover.bucket_mover_service._update_notifications')
    @mock.patch('gcs_bucket_mover.bucket_mover_service._write_spinner_and_log',
                mock.MagicMock())
    def test_create_bucket_acl_skip(
            self, mock_update_notifications, mock_update_iam_policies,
            mock_update_acl_entities, mock_create_bucket_api_call,
            mock_add_target_project_to_kms_key, mock_bucket):
        """Tests that the create bucket happens without the acls set"""
        self.parsed_args = common.get_mock_args()
        self.source_bucket = common.get_mock_source_bucket()
        details = bucket_details.BucketDetails(
            conf=self.parsed_args, source_bucket=self.source_bucket)
        details.acl_entities = None

        mock_bucket_instance = mock.MagicMock()
        mock_bucket.return_value = mock_bucket_instance

        bucket_mover_service._create_bucket(mock.MagicMock(), mock.MagicMock(),
                                            mock.MagicMock(), mock.MagicMock(),
                                            details)

        self.assertEqual(details.default_kms_key_name,
                         mock_bucket_instance.default_kms_key_name)
        mock_add_target_project_to_kms_key.assert_called_once()
        mock_bucket_instance.enable_logging.assert_called_once_with(
            details.logging['logBucket'], details.logging['logObjectPrefix'])
        mock_create_bucket_api_call.assert_called_once()
        mock_update_iam_policies.assert_called_once()
        mock_update_acl_entities.assert_called_once()
        mock_bucket_instance.acl.save.assert_not_called()
        mock_bucket_instance.default_object_acl.save.assert_called_once()
        mock_update_notifications.assert_called_once()

    @mock.patch('google.cloud.storage.Bucket')
    @mock.patch(
        'gcs_bucket_mover.bucket_mover_service._add_target_project_to_kms_key')
    @mock.patch('gcs_bucket_mover.bucket_mover_service._create_bucket_api_call')
    @mock.patch('gcs_bucket_mover.bucket_mover_service._update_acl_entities')
    @mock.patch('gcs_bucket_mover.bucket_mover_service._update_iam_policies')
    @mock.patch('gcs_bucket_mover.bucket_mover_service._update_notifications')
    @mock.patch('gcs_bucket_mover.bucket_mover_service._write_spinner_and_log',
                mock.MagicMock())
    def test_create_bucket_default_obj_acl_skip(
            self, mock_update_notifications, mock_update_iam_policies,
            mock_update_acl_entities, mock_create_bucket_api_call,
            mock_add_target_project_to_kms_key, mock_bucket):
        """Tests the create bucket happens without the default obj acls set"""
        self.parsed_args = common.get_mock_args()
        self.source_bucket = common.get_mock_source_bucket()
        details = bucket_details.BucketDetails(
            conf=self.parsed_args, source_bucket=self.source_bucket)
        details.default_obj_acl_entities = None

        mock_bucket_instance = mock.MagicMock()
        mock_bucket.return_value = mock_bucket_instance

        bucket_mover_service._create_bucket(mock.MagicMock(), mock.MagicMock(),
                                            mock.MagicMock(), mock.MagicMock(),
                                            details)

        self.assertEqual(details.default_kms_key_name,
                         mock_bucket_instance.default_kms_key_name)
        mock_add_target_project_to_kms_key.assert_called_once()
        mock_bucket_instance.enable_logging.assert_called_once_with(
            details.logging['logBucket'], details.logging['logObjectPrefix'])
        mock_create_bucket_api_call.assert_called_once()
        mock_update_iam_policies.assert_called_once()
        mock_update_acl_entities.assert_called_once()
        mock_bucket_instance.acl.save.assert_called_once()
        mock_bucket_instance.default_object_acl.save.assert_not_called()
        mock_update_notifications.assert_called_once()

    @mock.patch('google.cloud.storage.Bucket')
    @mock.patch(
        'gcs_bucket_mover.bucket_mover_service._add_target_project_to_kms_key')
    @mock.patch('gcs_bucket_mover.bucket_mover_service._create_bucket_api_call')
    @mock.patch('gcs_bucket_mover.bucket_mover_service._update_acl_entities')
    @mock.patch('gcs_bucket_mover.bucket_mover_service._update_iam_policies')
    @mock.patch('gcs_bucket_mover.bucket_mover_service._update_notifications')
    @mock.patch('gcs_bucket_mover.bucket_mover_service._write_spinner_and_log',
                mock.MagicMock())
    def test_create_bucket_default_obj_acl_skip(
            self, mock_update_notifications, mock_update_iam_policies,
            mock_update_acl_entities, mock_create_bucket_api_call,
            mock_add_target_project_to_kms_key, mock_bucket):
        """Tests that the create bucket happens without the notifications set"""
        self.parsed_args = common.get_mock_args()
        self.source_bucket = common.get_mock_source_bucket()
        details = bucket_details.BucketDetails(
            conf=self.parsed_args, source_bucket=self.source_bucket)
        details.notifications = None

        mock_bucket_instance = mock.MagicMock()
        mock_bucket.return_value = mock_bucket_instance

        bucket_mover_service._create_bucket(mock.MagicMock(), mock.MagicMock(),
                                            mock.MagicMock(), mock.MagicMock(),
                                            details)

        self.assertEqual(details.default_kms_key_name,
                         mock_bucket_instance.default_kms_key_name)
        mock_add_target_project_to_kms_key.assert_called_once()
        mock_bucket_instance.enable_logging.assert_called_once_with(
            details.logging['logBucket'], details.logging['logObjectPrefix'])
        mock_create_bucket_api_call.assert_called_once()
        mock_update_iam_policies.assert_called_once()
        self.assertEqual(2, mock_update_acl_entities.call_count)
        mock_bucket_instance.acl.save.assert_called_once()
        mock_bucket_instance.default_object_acl.save.assert_called_once()
        mock_update_notifications.assert_not_called()

    @unittest.skip(
        'Retry logic with exponential backoff makes this test take several minutes.'
    )
    @mock.patch('google.cloud.storage.Bucket')
    @mock.patch('gcs_bucket_mover.bucket_mover_service._write_spinner_and_log')
    def test_create_bucket_api_call_retry(self, mock_write_spinner_and_log,
                                          mock_bucket):
        """Tests the method is retried 5 times when the exception happens."""
        mock_bucket.create.side_effect = exceptions.ServiceUnavailable('503')
        with self.assertRaises(RetryError):
            result = bucket_mover_service._create_bucket_api_call(
                mock.MagicMock(), mock.MagicMock(), mock_bucket)
            self.assertEqual(5, mock_bucket.create.call_count)
            self.assertEqual(5, mock_write_spinner_and_log.call_count)
            self.assertFalse(result)

    @mock.patch('gcs_bucket_mover.bucket_mover_service._write_spinner_and_log')
    def test_create_bucket_api_call_no_retry(self, mock_write_spinner_and_log):
        """Tests the method is run once when there are no exceptions."""
        mock_bucket = mock.MagicMock()
        result = bucket_mover_service._create_bucket_api_call(
            mock.MagicMock(), mock.MagicMock(), mock_bucket)
        mock_bucket.create.assert_called_once()
        mock_write_spinner_and_log.assert_not_called()
        self.assertTrue(result)

    @unittest.skip('Not implemented')
    def test_update_iam_policies_logic(self):
        self.assertTrue(True)

    @unittest.skip('Not implemented')
    def test_update_acl_entities_logic(self):
        self.assertTrue(True)

    @unittest.skip('Not implemented')
    def test_assign_sts_iam_roles_logic(self):
        self.assertTrue(True)

    @unittest.skip('Not implemented')
    def test_remove_sts_iam_roles_logic(self):
        self.assertTrue(True)

    @unittest.skip('Not implemented')
    def test_add_target_project_to_kms_key_logic(self):
        self.assertTrue(True)

    @unittest.skip('Not implemented')
    def test_assign_target_project_to_topic_logic(self):
        self.assertTrue(True)

    @unittest.skip('Not implemented')
    def test_run_and_wait_for_sts_job_logic(self):
        self.assertTrue(True)

    @unittest.skip('Not implemented')
    def test_check_sts_job_logic(self):
        self.assertTrue(True)

    @unittest.skip('Not implemented')
    def test_print_sts_counters_logic(self):
        self.assertTrue(True)


if __name__ == '__main__':
    unittest.main()
