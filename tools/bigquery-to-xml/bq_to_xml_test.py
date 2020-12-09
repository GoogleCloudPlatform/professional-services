# python3

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
# ==============================================================================

"""Test bigquery_to_xml.py."""


import unittest

import bq_to_xml


class BqToXmlTest(unittest.TestCase):

    def test_nested_xml(self):
        # Check that the out_path_prefix is present in output CSV
        with open("test/results.txt", "r") as want:
            want = want.read()
            got = bq_to_xml.bigquery_to_xml("""SELECT * FROM `bigquery-public-data.samples.github_nested` ORDER BY repository.url DESC LIMIT 5""") + "\n"
            self.assertEqual(got, want)

if __name__ == '__main__':
    unittest.main()
