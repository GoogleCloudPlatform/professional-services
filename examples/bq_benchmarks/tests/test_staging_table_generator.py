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

import json
import os

from google.cloud import bigquery
from google.cloud import storage

from bq_benchmarks.generic_benchmark_tools import staging_table_generator


class TestStagingTableGenerator(object):
    """Tests functionality of
        load_benchmark_tools.staging_table_generator.StagingTableGenerator.

    Attributes:
        staging_dataset_id(str): ID of the dataset that holds the staging
            tables.
        resized_dataset_id(str): ID of the dataset that holds the
            resized staging tables.
        bq_client(google.cloud.bigquery.client.Client): Client to hold
            configurations needed for BigQuery API requests.
        staging_dataset(google.cloud.bigquery.dataset.Dataset): Dataset that
            holds the staging tables.
        resized_dataset(google.cloud.bigquery.dataset.Dataset): Dataset that
            holds the resized staging tables.
        json_schema_path(str): Directory that holds the test json schemas used
            to create the staging tables.
        test_file_parameters(dict): Dictionary containing each test file
            parameter and its possible values.
        df_staging_path(str): GCS staging path for dataflow job.
        df_temp_path(str): GCS temp path for dataflow job.
        df_staging_bucket(google.cloud.storage.bucket.Bucket): Bucket for
            storing staging and temp resources for dataflow data generator
            and resizer tools.
    """

    def setup(self):
        """Sets up resources for tests.
        """
        # set up bq datasets to hold staging tables
        self.staging_dataset_id = "bqbml_test_staging_dataset"
        self.resized_dataset_id = "bqbml_test_resized_staging_dataset"
        self.bq_client = bigquery.Client()
        staging_dataset_ref = self.bq_client.dataset(self.staging_dataset_id)
        self.staging_dataset = bigquery.Dataset(staging_dataset_ref)
        resized_staging_dataset_ref = self.bq_client.dataset(
            self.resized_dataset_id)
        self.resized_dataset = bigquery.Dataset(resized_staging_dataset_ref)

        # define path that holds schemas used for creating staging tables
        abs_path = os.path.abspath(os.path.dirname(__file__))
        self.json_schema_path = os.path.join(abs_path, 'test_schemas')

        # add test schemas to schema path
        schema_50_string_50_numeric = {
            "fields": [{
                "type": "STRING",
                "name": "string1",
                "mode": "REQUIRED"
            }, {
                "type": "STRING",
                "name": "string2",
                "mode": "REQUIRED"
            }, {
                "type": "NUMERIC",
                "name": "numeric1",
                "mode": "REQUIRED"
            }, {
                "type": "NUMERIC",
                "name": "numeric2",
                "mode": "REQUIRED"
            }]
        }
        with open(self.json_schema_path + '/50_STRING_50_NUMERIC_4.json',
                  'w') as sch2:
            json.dump(schema_50_string_50_numeric, sch2)

        # set up test params
        self.test_file_parameters = {
            'fileType': ['csv', 'json'],
            'fileCompressionTypes': {
                'csv': ['none'],
                'json': ['none']
            },
            'numColumns': [4],
            'numFiles': [1, 100, 1000, 10000],
            'targetDataSizes': [.000001],
            'stagingDataSizes': ['1KB'],
            'columnTypes': ['50_STRING_50_NUMERIC'],
        }

        # set up GCS resources needed for dataglow job
        df_staging_bucket_id = 'bq_benchmark_dataflow_test'
        gcs_client = storage.Client()
        self.df_staging_bucket = gcs_client.create_bucket(df_staging_bucket_id)
        staging_blob = self.df_staging_bucket.blob('staging/')
        temp_blob = self.df_staging_bucket.blob('temp/')
        staging_blob.upload_from_string('')
        temp_blob.upload_from_string('')
        self.df_staging_path = 'gs://{0:1}/staging'.format(df_staging_bucket_id)
        self.df_temp_path = 'gs://{0:1}/temp'.format(df_staging_bucket_id)

    def test_create_staging_tables(self, project_id):
        """Tests StagingTableGenerator.create_staging_tables().

        Tests StagingTableGenerator's ability to use the data_generator_pipeline
            module from the Dataflow Data Generator tool to create staging
            tables.

        Args:
            project_id(str): ID of the project that holds the test BQ and GCS
                resources.

        Returns:
            True if test passes, else False.
        """
        if not project_id:
            raise Exception(
                'Test needs project_id to pass. '
                'Add --project_id={your project ID} to test command')

        self.bq_client.create_dataset(self.staging_dataset)
        self.bq_client.create_dataset(self.resized_dataset)

        self.test_staging_table_generator = \
            staging_table_generator.StagingTableGenerator(
                project=project_id,
                staging_dataset_id=self.staging_dataset_id,
                resized_dataset_id=self.resized_dataset_id,
                json_schema_path=self.json_schema_path,
                file_params=self.test_file_parameters,
                num_rows=10
            )

        self.test_staging_table_generator.create_staging_tables(
            dataflow_staging_location=self.df_staging_path,
            dataflow_temp_location=self.df_temp_path)

        expected_table_id = "50_STRING_50_NUMERIC_4"
        dataset_ref = self.bq_client.dataset(self.staging_dataset_id)
        table_ref = dataset_ref.table(expected_table_id)
        table = self.bq_client.get_table(table_ref)

        expected_num_rows = 10
        assert table.num_rows == expected_num_rows

        expected_schema = [
            bigquery.SchemaField('string1', 'STRING', 'REQUIRED', None, ()),
            bigquery.SchemaField('string2', 'STRING', 'REQUIRED', None, ()),
            bigquery.SchemaField('numeric1', 'NUMERIC', 'REQUIRED', None, ()),
            bigquery.SchemaField('numeric2', 'NUMERIC', 'REQUIRED', None, ())
        ]

        assert table.schema == expected_schema

    def test_create_resized_tables(self, project_id):
        """Tests StagingTableGenerator.create_resized_tables().

        Tests StagingTableGenerator's ability to use the bq_table_resizer module
            from the Dataflow Data Generator tool to create resized staging
            tables from previously generated staging tables.

        Args:
            project_id(str): ID of the project that holds the test BQ and GCS
                resources.

        Returns:
            True if test passes, else False.
        """
        if not project_id:
            raise Exception(
                'Test needs project_id to pass. '
                'Add --project_id={your project ID} to test command')
        self.test_staging_table_generator = \
            staging_table_generator.StagingTableGenerator(
                project=project_id,
                staging_dataset_id=self.staging_dataset_id,
                resized_dataset_id=self.resized_dataset_id,
                json_schema_path=self.json_schema_path,
                file_params=self.test_file_parameters,
                num_rows=10
            )
        # resize the staging table created in test_create_staging_table()
        self.test_staging_table_generator.create_resized_tables()
        expected_table_id_1 = "50_STRING_50_NUMERIC_4_1KB"
        dataset_ref = self.bq_client.dataset(self.resized_dataset_id)
        table_ref = dataset_ref.table(expected_table_id_1)
        table = self.bq_client.get_table(table_ref)

        expected_schema = [
            bigquery.SchemaField('string1', 'STRING', 'REQUIRED', None, ()),
            bigquery.SchemaField('string2', 'STRING', 'REQUIRED', None, ()),
            bigquery.SchemaField('numeric1', 'NUMERIC', 'REQUIRED', None, ()),
            bigquery.SchemaField('numeric2', 'NUMERIC', 'REQUIRED', None, ())
        ]

        assert table.schema == expected_schema

        expected_gb = float(self.test_file_parameters['targetDataSizes'][0])
        expected_bytes = expected_gb * 1073741824

        # Check if resizing worked.
        # The resizer tool will get as close as possible to target size,
        # so use round() function to compare if it got close to target size.

        assert round(table.num_bytes, -3) == round(expected_bytes, -3)

        self.bq_client.delete_dataset(self.staging_dataset,
                                      delete_contents=True)

        self.bq_client.delete_dataset(self.resized_dataset,
                                      delete_contents=True)

    def teardown(self):
        """Tears down resources created in setup().
        """
        self.df_staging_bucket.delete(force=True)

        os.remove(self.json_schema_path + '/50_STRING_50_NUMERIC_4.json')
