#!/usr/bin/env python3

# Copyright 2019 Google Inc. All Rights Reserved.
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
# =============================================================================

import unittest
from bigquery_to_xml import bigquery_to_xml


class BqToXmlTest(unittest.TestCase):
    """BqToXmlTest contains tests for the bigquery_to_xml.py script.

    Current tests include:
    test_nested_xml; tests that the script can handle nested and repeated
    fields"""
    def test_nested_xml(self):
        """
        Test that nested and repeated fields are appropriately represented
        in the XML output.
        """
        with open("tests/results.txt", "r") as want:
            want = want.read()
            got = bigquery_to_xml.bigquery_to_xml(
                """SELECT * FROM `bigquery-public-data.samples.github_nested`
                WHERE repository.url LIKE "%/JetBrains/kotlin%"
                ORDER BY repository.created_at DESC LIMIT 5""") + "\n\n"
            self.assertEqual(got, want)

if __name__ == '__main__':
    unittest.main()
