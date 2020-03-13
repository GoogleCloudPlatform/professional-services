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
from google.cloud.exceptions import NotFound

from bq_benchmarks.generic_benchmark_tools import table_util


class TestTableUtil(unittest.TestCase):
    """Tests functionality of load_benchmark_tools.table_util.TableUtil.

    Attributes:
        bq_client(google.cloud.bigquery.client.Client): Client to hold
            configurations needed for BigQuery API requests.
        dataset_id(str): ID of the dataset that holds the test table.
        dataset_ref(google.cloud.bigquery.dataset.DatasetReference): Pointer
            to the dataset that holds the test table.
        dataset(google.cloud.bigquery.dataset.Dataset): Dataset that holds the
            test table.
        table_id(str): The name of the test table.
        table_util(generic_benchmark_tools.TableUtil): BigQuery utility class to be
            testsed.

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

    def test_check_if_table_exists(self):
        """Tests TableUtil.check_if_table_exists().

        Tests TableUtil's ability to check if a table exists.

        Returns:
            True if test passes, else False.
        """
        exists = self.table_util.check_if_table_exists()
        assert exists is False

    def test_get_bq_translated_schema(self):
        """Tests TableUtil.get_bq_translated_schema().

        Tests TableUtil's ability to translate a json schema to a BigQuery
        schema in List[google.cloud.bigquery.schema.SchemaField] format.

        Returns:
            True if test passes, else False.
        """
        expected_bq_schema = [
            bigquery.SchemaField('string1', 'STRING', 'REQUIRED',
                                 'description1'),
            bigquery.SchemaField('numeric1', 'NUMERIC', 'REQUIRED',
                                 'description2')
        ]
        bq_schema = self.table_util.get_bq_translated_schema()

        assert expected_bq_schema == bq_schema

    def test_create_table(self):
        """Tests TableUtil.create_table().

        Tests TableUtil's ability to translate create a table in the specified
        dataset.

        Returns:
            True if test passes, else False.
        """
        self.table_util.create_table()
        try:
            self.bq_client.get_table(self.table_util.table)
        except NotFound:
            self.fail("Table not created.")

    def test_set_table_properites(self):
        """Tests TableUtil.set_table_properites).

        Tests TableUtil's ability to set num_columns, num_rows, table_size,
        and column_types properties after a table has been created and data
        has been loaded into the table.

        Returns:
            True if test passes, else False.
        """
        self.table_util.create_table()
        job_config = bigquery.LoadJobConfig()
        job_config.source_format = bigquery.SourceFormat.CSV
        job_config.skip_leading_rows = 1
        abs_path = os.path.abspath(os.path.dirname(__file__))
        data_file = os.path.join(abs_path, 'test_data/test.csv')
        with open(data_file, 'rb') as file_obj:
            load_job = self.bq_client.load_table_from_file(
                file_obj=file_obj,
                destination=self.table_util.table_ref,
                job_config=job_config,
            )
            load_job.result()
        self.table_util.set_table_properties()
        assert self.table_util.num_columns == 2
        assert self.table_util.num_rows == 3
        assert self.table_util.table_size == 75
        assert self.table_util.column_types == '50_STRING_50_NUMERIC'

    def test_get_column_types(self):
        """Tests TableUtil.get_column_types().

        Tests TableUtil's ability to determine a table's column_types
        properties after the table has been created and table properties have
        been set.

        Returns:
            True if test passes, else False.
        """
        self.table_util.create_table()
        self.table_util.set_table_properties()
        column_types = self.table_util.get_column_types()
        assert column_types == '50_STRING_50_NUMERIC'

    def tearDown(self):
        """Deletes any resources used by tests.
        """
        self.bq_client.delete_dataset(dataset=self.dataset_ref,
                                      delete_contents=True)


if __name__ == '__main__':
    unittest.main()
