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
    The desired logic is to split files from a gsutil -l
    output into batches of <= 15TB.
    """
    def setUp(self):
        cmd = 'gsutil ls -l gs://python-dataflow-example/data_files/*.csv >> /tmp/files_to_load.txt'
        self.filename = '/tmp/files_to_load.txt'
        os.system(cmd)

    def test_bq_load_batches(self):
        # Test a single batch with an actual gcs bucket.
        actual_batch = parse_gsutil_long_output_file(self.filename)
        expected_batch = [[
            'gs://python-dataflow-example/data_files/head_usa_names.csv',
            'gs://python-dataflow-example/data_files/state_abbreviation.csv',
            'gs://python-dataflow-example/data_files/usa_names.csv'
        ]]
        self.assertEqual(actual_batch, expected_batch)
        BYTES_IN_TB = 10**13

        # Test multiple batches mocking the gsutil output.
        with open(self.filename, 'w') as f:
            # We will mock the output of 3 6 TB files in the directory of
            # interest in our gsutil output file. We expect the first two
            # files in the first batch and the final file in it's own batch
            # based on the 15TB max batch size we are aiming for.
            for i in range(3):
                f.write(
                    '       {}  2017-08-17T22:49:53Z  gs://python-dataflow-example/data_files/dummy_6TB_{}.csv \n'
                    .format(6 * BYTES_IN_TB, i))

            # Add the footer line of the gsutil output.
            f.write('TOTAL: 3 objects, 180000000000000 bytes (18 TB)')

        actual_batches = parse_gsutil_long_output_file(self.filename)
        expected_batches = [
            [
                'gs://python-dataflow-example/data_files/dummy_6TB_0.csv',
                'gs://python-dataflow-example/data_files/dummy_6TB_1.csv'
            ],
            ['gs://python-dataflow-example/data_files/dummy_6TB_2.csv'],
        ]
        self.assertEqual(actual_batches, expected_batches)

    def tearDown(self):
        cmd = 'rm ' + self.filename
        os.system(cmd)


if __name__ == '__main__':
    unittest.main()
