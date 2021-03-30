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
import uuid
from google.cloud import bigquery
from google.api_core.retry import Retry

from bq_table_resizer import BigQueryTableResizer


class TestBigQueryTableResizer(unittest.TestCase):
    """
    This is an integration test to show that the logic in the
    BigQueryTableResizer class behaves as expected.
    Execution Note:
        This script will create a BigQuery Dataset and table to perform it's
        test. These resources will be deleted upon completion of the test script
        but you will be charged for them.
        This script is stored in
        professional-services/data-analytics/dataflow-python-examples/tests
        but should be copied to p
        rofessional-services/data-analytics/dataflow-python-examples/ and
        run from there.
    """
    @classmethod
    def setUpClass(cls):
        cls._bq_cli = bigquery.Client()

    def setUp(self):
        self.client = TestBigQueryTableResizer._bq_cli
        # Create a unique temporary dataset.
        self.test_dataset_id = 'bq_util_test_dataset' \
                               + str(uuid.uuid4()).replace('-', '_')
        self.test_dataset_ref = self.client.dataset(self.test_dataset_id)
        self.client.create_dataset(bigquery.Dataset(self.test_dataset_ref))

        # Copy the public shakespeare sample into our test dataset.
        public_client = bigquery.Client(project='bigquery-public-data')
        public_table_ref = public_client.dataset('samples').table(
            'shakespeare')

        self.source_table_ref = self.client.dataset(
            self.test_dataset_id).table('source_table')

        self.destination_table_id = 'destination_table'
        self.destination_table_ref = \
            self.client.dataset(self.test_dataset_id).table(
                self.destination_table_id
            )

        self.client.copy_table(public_table_ref, self.source_table_ref)

        self.resizer_by_row = BigQueryTableResizer(
            project=self.client.project,
            source_dataset=self.test_dataset_id,
            destination_dataset=self.test_dataset_id,
            source_table='source_table',
            destination_table=self.destination_table_id,
            target_rows=500000,
            location='US')

        self.resizer_by_gb = BigQueryTableResizer(
            project=self.client.project,
            source_dataset=self.test_dataset_id,
            destination_dataset=self.test_dataset_id,
            source_table='source_table',
            destination_table=self.destination_table_id,
            target_gb=.05,
            location='US')
        logging.basicConfig(level=logging.INFO)

    def test_bq_table_resizer_by_row_number(self):
        self.resizer_by_row.resize()
        destination_table = self.client.get_table(self.destination_table_ref)
        self.assertEqual(500000, destination_table.num_rows)

    def test_bq_table_resizer_by_target_gb(self):
        self.resizer_by_gb.resize()
        destination_table = self.client.get_table(self.destination_table_ref)
        num_rows = self.resizer_by_gb.target_rows
        self.assertEqual(num_rows, destination_table.num_rows)

    def tearDown(self):
        dataset = self.client.dataset(self.test_dataset_id)

        self.client.delete_table(self.source_table_ref)

        self.client.delete_table(self.destination_table_ref)

        self.client.delete_dataset(dataset, retry=Retry())


if __name__ == '__main__':
    unittest.main()
