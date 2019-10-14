#!/usr/bin/env python3

# Copyright 2019 Google Inc.
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#     http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.
"""Test file  for main.py in app.python module."""

import unittest
from app.python import gcs_transcript_utils
from google.cloud import storage
from google.api_core.exceptions import NotFound

class TestAppGCSTranscriptUtilsFunction(unittest.TestCase):
    """Tests the logic in app.python module."""

    def setUp(self) -> None:
        self.gcs_client = storage.Client()
        self.foo_name = 'foo'
        self.bar_name = 'bar'

    def test_find_bucket_found_with_prefix(self):
        """Tests that bucket is found when given prefix."""
        bucket_foo = storage.Bucket(self.gcs_client, self.foo_name)
        bucket_bar = storage.Bucket(self.gcs_client, self.bar_name)
        bucket_iterator = iter([bucket_foo, bucket_bar])
        actual_output = gcs_transcript_utils.find_bucket_with_prefix(
            bucket_iterator,
            self.foo_name)
        expected_output = self.foo_name
        self.assertEqual(actual_output, expected_output)

    def test_find_bucket_not_found_with_prefix(self):
        """Tests that exception is raised if bucket is not found.S"""
        bucket_foo = storage.Bucket(self.gcs_client, self.foo_name)
        bucket_iterator = iter([bucket_foo])
        self.assertRaises(NotFound,
                          gcs_transcript_utils.find_bucket_with_prefix,
                          bucket_iterator,
                          self.bar_name)

if __name__ == '__main__':
    unittest.main()
