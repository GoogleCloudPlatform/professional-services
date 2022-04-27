# Copyright 2018 Google Inc.
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

import os
import unittest

from google.cloud import bigquery

from bq_benchmarks.generic_benchmark_tools import table_util
from bq_benchmarks.query_benchmark_tools import query_generator

SELECT_ALL_ID = 'SIMPLE_SELECT_*'
SELECT_ONE_STRING_ID = 'SELECT_ONE_STRING'
SELECT_50_PERCENT_ID = 'SELECT_50_PERCENT'


class TestQueryGenerator(unittest.TestCase):
    """Tests functionality of query_benchmark_tools.query_generator.

    Attributes:
        bq_client(google.cloud.bigquery.client.Client): Client to hold
            configurations needed for BigQuery API requests.
        dataset_id(str): ID of the dataset that holds the test table.
        dataset_ref(google.cloud.bigquery.dataset.DatasetReference): Pointer
            to the dataset that holds the test table.
        dataset(google.cloud.bigquery.dataset.Dataset): Dataset that holds the
            test table.
        table_id(str): The name of the test table.
        table_util(generic_benchmark.TableUtil): BigQuery to handle test table.

    """

    def setUp(self):
        """Sets up resources for tests.
        """
        self.bq_client = bigquery.Client()
        self.dataset_id = 'bq_benchmark_test_dataset'
        self.dataset_ref = self.bq_client.dataset(self.dataset_id)
        dataset = bigquery.Dataset(self.dataset_ref)
        self.dataset = self.bq_client.create_dataset(dataset)
        self.table_id = 'test_table'
        abs_path = os.path.abspath(os.path.dirname(__file__))
        json_schema_filename = os.path.join(abs_path,
                                            'test_schemas/test_schema.json')
        self.table_util = table_util.TableUtil(
            table_id=self.table_id,
            dataset_id=self.dataset_id,
            json_schema_filename=json_schema_filename,
        )
        self.table_util.create_table()
        self.test_query_generator = query_generator.QueryGenerator(
            table_id=self.table_id, dataset_id=self.dataset_id)

    def test_get_query_strings(self):
        """Tests QueryGenerator.get_query_strings().

        Tests QueryGenerators's ability to create queries for a given table.

        Returns:
            True if test passes, else False.
        """
        query_strings = self.test_query_generator.get_query_strings()
        expected_query_strings = {
            SELECT_ALL_ID: 'SELECT * FROM `{0:s}`',
            SELECT_ONE_STRING_ID: 'SELECT string1 FROM `{0:s}`',
            SELECT_50_PERCENT_ID: 'SELECT string1 FROM `{0:s}`'
        }
        assert query_strings == expected_query_strings

    def tearDown(self):
        """Deletes any resources used by tests.
        """
        self.bq_client.delete_dataset(dataset=self.dataset_ref,
                                      delete_contents=True)
