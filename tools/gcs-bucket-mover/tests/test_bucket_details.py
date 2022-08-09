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
"""Tests for the bucket_details.py file"""

from __future__ import absolute_import
from __future__ import division
from __future__ import print_function
import unittest

from gcs_bucket_mover import bucket_details
from tests import common


class TestBucketDetails(unittest.TestCase):
    """Tests for the logic in the BucketDetails class."""

    def setUp(self):
        self.parsed_args = common.get_mock_args()
        self.source_bucket = common.get_mock_source_bucket()

    def test_default_constructor(self):
        """Tests the default object is successfully created."""
        details = bucket_details.BucketDetails(
            conf=self.parsed_args, source_bucket=self.source_bucket)

        # Test that the properties are set to the parsed_args/source_bucket values
        self.assertEqual(self.parsed_args.location, details.location)
        self.assertEqual(self.parsed_args.storage_class, details.storage_class)
        self.assertEqual(self.parsed_args.is_uniform_bucket,details.is_uniform_bucket)
        self.assertEqual(self.source_bucket.get_iam_policy(),
                         details.iam_policy)
        self.assertEqual(self.source_bucket.acl.get_entities(),
                         details.acl_entities)
        self.assertEqual(self.source_bucket.default_object_acl.get_entities(),
                         details.default_obj_acl_entities)
        self.assertEqual(self.source_bucket.requester_pays,
                         details.requester_pays)
        self.assertEqual(self.source_bucket.cors, details.cors)
        self.assertEqual(self.source_bucket.default_kms_key_name,
                         details.default_kms_key_name)
        self.assertEqual(self.source_bucket.labels, details.labels)
        self.assertEqual(self.source_bucket.lifecycle_rules,
                         details.lifecycle_rules)
        self.assertEqual(self.source_bucket.get_logging(), details.logging)
        self.assertEqual(self.source_bucket.versioning_enabled,
                         details.versioning_enabled)
        self.assertEqual(self.source_bucket.list_notifications(),
                         details.notifications)

        # Test that the bucket properties can be overridden
        value = 'test'
        details.iam_policy = details.acl_entities = details.default_obj_acl_entities = value
        details.requester_pays = details.cors = details.default_kms_key_name = value
        details.labels = details.lifecycle_rules = details.logging = value
        details.versioning_enabled = details.notifications = value
        self.assertEqual(value, details.iam_policy)
        self.assertEqual(value, details.acl_entities)
        self.assertEqual(value, details.default_obj_acl_entities)
        self.assertEqual(value, details.requester_pays)
        self.assertEqual(value, details.cors)
        self.assertEqual(value, details.default_kms_key_name)
        self.assertEqual(value, details.labels)
        self.assertEqual(value, details.lifecycle_rules)
        self.assertEqual(value, details.logging)
        self.assertEqual(value, details.versioning_enabled)
        self.assertEqual(value, details.notifications)

    def test_skip_everything(self):
        """Tests the object constructor when the skip_everything flag is True."""
        self.parsed_args.skip_everything = True
        details = bucket_details.BucketDetails(
            conf=self.parsed_args, source_bucket=self.source_bucket)

        self.assertEqual(self.parsed_args.location, details.location)
        self.assertEqual(self.parsed_args.storage_class, details.storage_class)
        self.assertIsNone(details.iam_policy)
        self.assertIsNone(details.acl_entities)
        self.assertIsNone(details.default_obj_acl_entities)
        self.assertIsNone(details.requester_pays)
        self.assertIsNone(details.cors)
        self.assertIsNone(details.default_kms_key_name)
        self.assertEqual(details.labels, {})
        self.assertIsNone(details.lifecycle_rules)
        self.assertIsNone(details.logging)
        self.assertIsNone(details.versioning_enabled)
        self.assertListEqual(details.notifications, [])

        # Test that the bucket properties cannot be overridden
        value = 'test'
        details.iam_policy = details.acl_entities = details.default_obj_acl_entities = value
        details.requester_pays = details.cors = details.default_kms_key_name = value
        details.labels = details.lifecycle_rules = details.logging = value
        details.versioning_enabled = details.notifications = value
        self.assertIsNone(details.iam_policy)
        self.assertIsNone(details.acl_entities)
        self.assertIsNone(details.default_obj_acl_entities)
        self.assertIsNone(details.requester_pays)
        self.assertIsNone(details.cors)
        self.assertIsNone(details.default_kms_key_name)
        self.assertEqual(details.labels, {})
        self.assertIsNone(details.lifecycle_rules)
        self.assertIsNone(details.logging)
        self.assertIsNone(details.versioning_enabled)
        self.assertListEqual(details.notifications, [])

    def test_skip_acl(self):
        """Tests the --skip_acl flag works correctly."""
        self.parsed_args.skip_acl = True
        details = bucket_details.BucketDetails(
            conf=self.parsed_args, source_bucket=self.source_bucket)

        self.assertEqual(self.parsed_args.location, details.location)
        self.assertEqual(self.parsed_args.storage_class, details.storage_class)
        self.assertEqual(self.source_bucket.get_iam_policy(),
                         details.iam_policy)
        self.assertIsNone(details.acl_entities)
        self.assertEqual(self.source_bucket.default_object_acl.get_entities(),
                         details.default_obj_acl_entities)
        self.assertEqual(self.source_bucket.requester_pays,
                         details.requester_pays)
        self.assertEqual(self.source_bucket.cors, details.cors)
        self.assertEqual(self.source_bucket.default_kms_key_name,
                         details.default_kms_key_name)
        self.assertEqual(self.source_bucket.labels, details.labels)
        self.assertEqual(self.source_bucket.lifecycle_rules,
                         details.lifecycle_rules)
        self.assertEqual(self.source_bucket.get_logging(), details.logging)
        self.assertEqual(self.source_bucket.versioning_enabled,
                         details.versioning_enabled)
        self.assertEqual(self.source_bucket.list_notifications(),
                         details.notifications)

        details.acl_entities = 'test'
        self.assertIsNone(details.acl_entities)

    def test_skip_cors(self):
        """Tests the --skip_cors flag works correctly."""
        self.parsed_args.skip_cors = True
        details = bucket_details.BucketDetails(
            conf=self.parsed_args, source_bucket=self.source_bucket)

        self.assertEqual(self.parsed_args.location, details.location)
        self.assertEqual(self.parsed_args.storage_class, details.storage_class)
        self.assertEqual(self.source_bucket.get_iam_policy(),
                         details.iam_policy)
        self.assertEqual(self.source_bucket.acl.get_entities(),
                         details.acl_entities)
        self.assertEqual(self.source_bucket.default_object_acl.get_entities(),
                         details.default_obj_acl_entities)
        self.assertEqual(self.source_bucket.requester_pays,
                         details.requester_pays)
        self.assertIsNone(details.cors)
        self.assertEqual(self.source_bucket.default_kms_key_name,
                         details.default_kms_key_name)
        self.assertEqual(self.source_bucket.labels, details.labels)
        self.assertEqual(self.source_bucket.lifecycle_rules,
                         details.lifecycle_rules)
        self.assertEqual(self.source_bucket.get_logging(), details.logging)
        self.assertEqual(self.source_bucket.versioning_enabled,
                         details.versioning_enabled)
        self.assertEqual(self.source_bucket.list_notifications(),
                         details.notifications)

        details.cors = 'test'
        self.assertIsNone(details.cors)

    def test_skip_default_obj_acl(self):
        """Tests the --skip_default_obj_acl flag works correctly."""
        self.parsed_args.skip_default_obj_acl = True
        details = bucket_details.BucketDetails(
            conf=self.parsed_args, source_bucket=self.source_bucket)

        self.assertEqual(self.parsed_args.location, details.location)
        self.assertEqual(self.parsed_args.storage_class, details.storage_class)
        self.assertEqual(self.source_bucket.get_iam_policy(),
                         details.iam_policy)
        self.assertEqual(self.source_bucket.acl.get_entities(),
                         details.acl_entities)
        self.assertIsNone(details.default_obj_acl_entities)
        self.assertEqual(self.source_bucket.requester_pays,
                         details.requester_pays)
        self.assertEqual(self.source_bucket.cors, details.cors)
        self.assertEqual(self.source_bucket.default_kms_key_name,
                         details.default_kms_key_name)
        self.assertEqual(self.source_bucket.labels, details.labels)
        self.assertEqual(self.source_bucket.lifecycle_rules,
                         details.lifecycle_rules)
        self.assertEqual(self.source_bucket.get_logging(), details.logging)
        self.assertEqual(self.source_bucket.versioning_enabled,
                         details.versioning_enabled)
        self.assertEqual(self.source_bucket.list_notifications(),
                         details.notifications)

        details.default_obj_acl_entities = 'test'
        self.assertIsNone(details.default_obj_acl_entities)

    def test_skip_iam(self):
        """Tests the --skip_iam flag works correctly."""
        self.parsed_args.skip_iam = True
        details = bucket_details.BucketDetails(
            conf=self.parsed_args, source_bucket=self.source_bucket)

        self.assertEqual(self.parsed_args.location, details.location)
        self.assertEqual(self.parsed_args.storage_class, details.storage_class)
        self.assertIsNone(details.iam_policy)
        self.assertEqual(self.source_bucket.acl.get_entities(),
                         details.acl_entities)
        self.assertEqual(self.source_bucket.default_object_acl.get_entities(),
                         details.default_obj_acl_entities)
        self.assertEqual(self.source_bucket.requester_pays,
                         details.requester_pays)
        self.assertEqual(self.source_bucket.cors, details.cors)
        self.assertEqual(self.source_bucket.default_kms_key_name,
                         details.default_kms_key_name)
        self.assertEqual(self.source_bucket.labels, details.labels)
        self.assertEqual(self.source_bucket.lifecycle_rules,
                         details.lifecycle_rules)
        self.assertEqual(self.source_bucket.get_logging(), details.logging)
        self.assertEqual(self.source_bucket.versioning_enabled,
                         details.versioning_enabled)
        self.assertEqual(self.source_bucket.list_notifications(),
                         details.notifications)

        details.iam_policy = 'test'
        self.assertIsNone(details.iam_policy)

    def test_skip_kms_key(self):
        """Tests the --skip_kms_key flag works correctly."""
        self.parsed_args.skip_kms_key = True
        details = bucket_details.BucketDetails(
            conf=self.parsed_args, source_bucket=self.source_bucket)

        self.assertEqual(self.parsed_args.location, details.location)
        self.assertEqual(self.parsed_args.storage_class, details.storage_class)
        self.assertEqual(self.source_bucket.get_iam_policy(),
                         details.iam_policy)
        self.assertEqual(self.source_bucket.acl.get_entities(),
                         details.acl_entities)
        self.assertEqual(self.source_bucket.default_object_acl.get_entities(),
                         details.default_obj_acl_entities)
        self.assertEqual(self.source_bucket.requester_pays,
                         details.requester_pays)
        self.assertEqual(self.source_bucket.cors, details.cors)
        self.assertIsNone(details.default_kms_key_name)
        self.assertEqual(self.source_bucket.labels, details.labels)
        self.assertEqual(self.source_bucket.lifecycle_rules,
                         details.lifecycle_rules)
        self.assertEqual(self.source_bucket.get_logging(), details.logging)
        self.assertEqual(self.source_bucket.versioning_enabled,
                         details.versioning_enabled)
        self.assertEqual(self.source_bucket.list_notifications(),
                         details.notifications)

        details.default_kms_key_name = 'test'
        self.assertIsNone(details.default_kms_key_name)

    def test_skip_labels(self):
        """Tests the --skip_labels flag works correctly."""
        self.parsed_args.skip_labels = True
        details = bucket_details.BucketDetails(
            conf=self.parsed_args, source_bucket=self.source_bucket)

        self.assertEqual(self.parsed_args.location, details.location)
        self.assertEqual(self.parsed_args.storage_class, details.storage_class)
        self.assertEqual(self.source_bucket.get_iam_policy(),
                         details.iam_policy)
        self.assertEqual(self.source_bucket.acl.get_entities(),
                         details.acl_entities)
        self.assertEqual(self.source_bucket.default_object_acl.get_entities(),
                         details.default_obj_acl_entities)
        self.assertEqual(self.source_bucket.requester_pays,
                         details.requester_pays)
        self.assertEqual(self.source_bucket.cors, details.cors)
        self.assertEqual(self.source_bucket.default_kms_key_name,
                         details.default_kms_key_name)
        self.assertEqual(details.labels, {})
        self.assertEqual(self.source_bucket.lifecycle_rules,
                         details.lifecycle_rules)
        self.assertEqual(self.source_bucket.get_logging(), details.logging)
        self.assertEqual(self.source_bucket.versioning_enabled,
                         details.versioning_enabled)
        self.assertEqual(self.source_bucket.list_notifications(),
                         details.notifications)

        details.labels = 'test'
        self.assertEqual(details.labels, {})

    def test_skip_logging(self):
        """Tests the --skip_logging flag works correctly."""
        self.parsed_args.skip_logging = True
        details = bucket_details.BucketDetails(
            conf=self.parsed_args, source_bucket=self.source_bucket)

        self.assertEqual(self.parsed_args.location, details.location)
        self.assertEqual(self.parsed_args.storage_class, details.storage_class)
        self.assertEqual(self.source_bucket.get_iam_policy(),
                         details.iam_policy)
        self.assertEqual(self.source_bucket.acl.get_entities(),
                         details.acl_entities)
        self.assertEqual(self.source_bucket.default_object_acl.get_entities(),
                         details.default_obj_acl_entities)
        self.assertEqual(self.source_bucket.requester_pays,
                         details.requester_pays)
        self.assertEqual(self.source_bucket.cors, details.cors)
        self.assertEqual(self.source_bucket.default_kms_key_name,
                         details.default_kms_key_name)
        self.assertEqual(self.source_bucket.labels, details.labels)
        self.assertEqual(self.source_bucket.lifecycle_rules,
                         details.lifecycle_rules)
        self.assertIsNone(details.logging)
        self.assertEqual(self.source_bucket.versioning_enabled,
                         details.versioning_enabled)
        self.assertEqual(self.source_bucket.list_notifications(),
                         details.notifications)

        details.logging = 'test'
        self.assertIsNone(details.logging)

    def test_skip_lifecycle_rules(self):
        """Tests the --skip_lifecycle_rules flag works correctly."""
        self.parsed_args.skip_lifecycle_rules = True
        details = bucket_details.BucketDetails(
            conf=self.parsed_args, source_bucket=self.source_bucket)

        self.assertEqual(self.parsed_args.location, details.location)
        self.assertEqual(self.parsed_args.storage_class, details.storage_class)
        self.assertEqual(self.source_bucket.get_iam_policy(),
                         details.iam_policy)
        self.assertEqual(self.source_bucket.acl.get_entities(),
                         details.acl_entities)
        self.assertEqual(self.source_bucket.default_object_acl.get_entities(),
                         details.default_obj_acl_entities)
        self.assertEqual(self.source_bucket.requester_pays,
                         details.requester_pays)
        self.assertEqual(self.source_bucket.cors, details.cors)
        self.assertEqual(self.source_bucket.default_kms_key_name,
                         details.default_kms_key_name)
        self.assertEqual(self.source_bucket.labels, details.labels)
        self.assertIsNone(details.lifecycle_rules)
        self.assertEqual(self.source_bucket.get_logging(), details.logging)
        self.assertEqual(self.source_bucket.versioning_enabled,
                         details.versioning_enabled)
        self.assertEqual(self.source_bucket.list_notifications(),
                         details.notifications)

        details.lifecycle_rules = 'test'
        self.assertIsNone(details.lifecycle_rules)

    def test_skip_notifications(self):
        """Tests the --skip_notifications flag works correctly."""
        self.parsed_args.skip_notifications = True
        details = bucket_details.BucketDetails(
            conf=self.parsed_args, source_bucket=self.source_bucket)

        self.assertEqual(self.parsed_args.location, details.location)
        self.assertEqual(self.parsed_args.storage_class, details.storage_class)
        self.assertEqual(self.source_bucket.get_iam_policy(),
                         details.iam_policy)
        self.assertEqual(self.source_bucket.acl.get_entities(),
                         details.acl_entities)
        self.assertEqual(self.source_bucket.default_object_acl.get_entities(),
                         details.default_obj_acl_entities)
        self.assertEqual(self.source_bucket.requester_pays,
                         details.requester_pays)
        self.assertEqual(self.source_bucket.cors, details.cors)
        self.assertEqual(self.source_bucket.default_kms_key_name,
                         details.default_kms_key_name)
        self.assertEqual(self.source_bucket.labels, details.labels)
        self.assertEqual(self.source_bucket.lifecycle_rules,
                         details.lifecycle_rules)
        self.assertEqual(self.source_bucket.get_logging(), details.logging)
        self.assertEqual(self.source_bucket.versioning_enabled,
                         details.versioning_enabled)
        self.assertListEqual(details.notifications, [])

        details.notifications = 'test'
        self.assertListEqual(details.notifications, [])

    def test_skip_requester_pays(self):
        """Tests the --skip_requester_pays flag works correctly."""
        self.parsed_args.skip_requester_pays = True
        details = bucket_details.BucketDetails(
            conf=self.parsed_args, source_bucket=self.source_bucket)

        self.assertEqual(self.parsed_args.location, details.location)
        self.assertEqual(self.parsed_args.storage_class, details.storage_class)
        self.assertEqual(self.source_bucket.get_iam_policy(),
                         details.iam_policy)
        self.assertEqual(self.source_bucket.acl.get_entities(),
                         details.acl_entities)
        self.assertEqual(self.source_bucket.default_object_acl.get_entities(),
                         details.default_obj_acl_entities)
        self.assertIsNone(details.requester_pays)
        self.assertEqual(self.source_bucket.cors, details.cors)
        self.assertEqual(self.source_bucket.default_kms_key_name,
                         details.default_kms_key_name)
        self.assertEqual(self.source_bucket.labels, details.labels)
        self.assertEqual(self.source_bucket.lifecycle_rules,
                         details.lifecycle_rules)
        self.assertEqual(self.source_bucket.get_logging(), details.logging)
        self.assertEqual(self.source_bucket.versioning_enabled,
                         details.versioning_enabled)
        self.assertEqual(self.source_bucket.list_notifications(),
                         details.notifications)

        details.requester_pays = 'test'
        self.assertIsNone(details.requester_pays)

    def test_skip_versioning(self):
        """Tests the --skip_versioning flag works correctly."""
        self.parsed_args.skip_versioning = True
        details = bucket_details.BucketDetails(
            conf=self.parsed_args, source_bucket=self.source_bucket)

        self.assertEqual(self.parsed_args.location, details.location)
        self.assertEqual(self.parsed_args.storage_class, details.storage_class)
        self.assertEqual(self.source_bucket.get_iam_policy(),
                         details.iam_policy)
        self.assertEqual(self.source_bucket.acl.get_entities(),
                         details.acl_entities)
        self.assertEqual(self.source_bucket.default_object_acl.get_entities(),
                         details.default_obj_acl_entities)
        self.assertEqual(self.source_bucket.requester_pays,
                         details.requester_pays)
        self.assertEqual(self.source_bucket.cors, details.cors)
        self.assertEqual(self.source_bucket.default_kms_key_name,
                         details.default_kms_key_name)
        self.assertEqual(self.source_bucket.labels, details.labels)
        self.assertEqual(self.source_bucket.lifecycle_rules,
                         details.lifecycle_rules)
        self.assertEqual(self.source_bucket.get_logging(), details.logging)
        self.assertIsNone(details.versioning_enabled)
        self.assertEqual(self.source_bucket.list_notifications(),
                         details.notifications)

        details.versioning_enabled = 'test'
        self.assertIsNone(details.versioning_enabled)


if __name__ == '__main__':
    unittest.main()
