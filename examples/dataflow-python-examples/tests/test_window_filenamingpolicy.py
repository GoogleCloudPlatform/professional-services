# Copyright 2020 Google Inc.
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#      http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

"""This script contains various tests to validate the functionality of window_filenamingpolicy"""

import unittest
from collections import namedtuple
from datetime import datetime, timedelta

from apache_beam.utils.timestamp import Timestamp

from dataflow_python_examples.streaming import window_filenamingpolicy


class TestSideInputRefresh(unittest.TestCase):

    def test_subscription_path_with_fullpath(self):
        """Validate the format of subscription path when subscription name contains valid path"""
        subsciption_path = window_filenamingpolicy.get_subscription_path(
            "project-id",
            "projects/test-project/subscriptions/test-subscription")
        self.assertEqual(
            subsciption_path,
            "projects/test-project/subscriptions/test-subscription")

    def test_subscription_path_with_subscripbername(self):
        """Validate the format of subscription path when subscription name contains valid path"""
        subsciption_path = window_filenamingpolicy.get_subscription_path(
            "test-project", "test-subscription")
        self.assertEqual(
            subsciption_path,
            "projects/test-project/subscriptions/test-subscription")

    def test_window_file_naming_policy(self):
        """Validate the extraction of key value from an event based on field names """
        # Arrange the input data
        current_window = namedtuple("window", "start,end")
        window_start_time = datetime.utcnow()
        window_end_time = window_start_time + timedelta(seconds=300)
        current_window.start = Timestamp.of(
            int((window_start_time - datetime(1970, 1, 1)).total_seconds()))
        current_window.end = Timestamp.of(current_window.start + 300)

        filenaming_options = dict()
        filenaming_options[
            "file_naming_template"] = "{windowstart}-{windowend}/{shard:05d}-of-{total_shards:05d}{suffix}"
        filenaming_options["windowstart_format"] = "%Y%m%d%H%M"
        filenaming_options["windowend_format"] = "%H%M"
        filenaming_options["timezone"] = "utc"
        filenaming_options["file_suffix"] = ".txt"

        # Act
        window_file_naming_policy = window_filenamingpolicy.window_file_naming_policy(
            filenaming_options)
        actual_file_name = window_file_naming_policy(current_window, None, 1, 5,
                                                     None, None)

        # Assert
        expected_file_name = f"{window_start_time.strftime('%Y%m%d%H%M')}-{window_end_time.strftime('%H%M')}/00001-of-00005.txt"
        self.assertEqual(actual_file_name, expected_file_name,
                         "Mismatch found in dynamic file path")


if __name__ == '__main__':
    unittest.main()
