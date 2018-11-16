# Copyright 2018 Google Inc.
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

import logging
import unittest
import os
import uuid
from google.cloud import bigquery
from google.api_core.retry import Retry

from bq_load_batches import parse_gsutil_long_output_file



class TestBigQueryLoadBatches(unittest.TestCase):
    """
    This is a unit test to show that the logic in the
    bigquery load batches script behaves as expected.
    """

    def setUp(self):
        cmd = 'gsutil ls -l gs://python-dataflow-example/data_files/*.csv >> /tmp/files_to_load.txt'
        self.filename='/tmp/files_to_load.txt'
        os.system(cmd)
    def test_bq_load_batches(self):
        actual_batches = parse_gsutil_long_output_file(self.filename)
        expected_batches = [
           ['gs://python-dataflow-example/data_files/head_usa_names.csv',
           'gs://python-dataflow-example/data_files/state_abbreviation.csv',
           'gs://python-dataflow-example/data_files/usa_names.csv']
        ]
        self.assertEquals(actual_batches, expected_batches)

    def tearDown(self):
        cmd = 'rm ' + self.filename
        os.system(cmd)
if __name__ == '__main__':
    unittest.main()
