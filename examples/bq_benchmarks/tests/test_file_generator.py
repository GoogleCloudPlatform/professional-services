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

import csv
import os

from google.api_core import exceptions
from google.cloud import bigquery
from google.cloud import storage

from bq_benchmarks.load_benchmark_tools import load_file_generator


class TestFileGenerator(object):
    """Tests functionality of load_benchmark_tools.file_generator.FileGenerator.

    Attributes:
        bucket_name(str): Name of the bucket used for testing.
        file_bucket(google.cloud.storage.bucket.Bucket): Bucket
            that will hold the generated files.
        test_file_parameters(dict): Dictionary containing each test file
            parameter and its possible values.
        bq_client(google.cloud.bigquery.client.Client): Client to hold
            configurations needed for BigQuery API requests.
        dataset_id(str): ID of the dataset that will hold the staging table
            used for generating files.
        dataset_ref(google.cloud.bigquery.dataset.DatasetReference): Pointer
            to the dataset that holds the staging table.
        df_staging_bucket(google.cloud.storage.bucket.Bucket): Bucket for
            storing staging and temp resources for for dataflow jobs needed
            for generating files.
        df_staging_path(str): GCS staging path for dataflow job.
        df_temp_path(str): GCS temp path for dataflow job.


    """

    def setup(self):
        """Sets up resources for tests.
        """
        # create bucket
        self.bucket_name = 'bq_benchmark_test_bucket'
        gcs_client = storage.Client()
        try:
            gcs_client.get_bucket(self.bucket_name).delete(force=True)
            self.file_bucket = gcs_client.create_bucket(self.bucket_name)
        except exceptions.NotFound:
            self.file_bucket = gcs_client.create_bucket(self.bucket_name)
        # create test params
        self.test_file_parameters = {
            'fileType': ['csv', 'json'],
            'fileCompressionTypes': {
                'csv': ['none'],
                'json': ['none']
            },
            'numColumns': [10],
            'numFiles': [1, 10],
            'targetDataSizes': [],
            'stagingDataSizes': ['213B'],
            'columnTypes': [
                '50_STRING_50_NUMERIC',
            ],
        }

        # Define BQ resources
        self.bq_client = bigquery.Client()
        self.dataset_id = 'bqbm_test_resized_staging_dataset'
        self.dataset_ref = self.bq_client.dataset(self.dataset_id)
        self.bq_client.create_dataset(bigquery.Dataset(self.dataset_ref))

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

    def test_create_files(self, project_id):
        """Tests FileGenerator.create_files().

        Tests FileGenerator's ability to properly create files in GCS by
            running extract jobs on staging tables.

        Args:
            project_id(str): ID of the project that holds the test GCS
                resources.

        Returns:
            True if test passes, else False.
        """
        if not project_id:
            raise Exception(
                'Test needs project_id to pass. '
                'Add --project_id={your project ID} to test command')
        # create sample staging table

        staging_table_id = '50_STRING_50_NUMERIC_10_213B'
        staging_table_ref = self.dataset_ref.table(staging_table_id)

        abs_path = os.path.abspath(os.path.dirname(__file__))
        sample_data_file = os.path.join(
            abs_path,
            ('test_data/fileType=csv/compression=none/'
             'numColumns=10/columnTypes=50_STRING_50_NUMERIC/numFiles=1/'
             'tableSize=10MB/file1.csv'))
        load_job_config = bigquery.LoadJobConfig()
        load_job_config.source_format = bigquery.SourceFormat.CSV
        load_job_config.skip_leading_rows = 1
        load_job_config.autodetect = True

        with open(sample_data_file, "rb") as source_file:
            job = self.bq_client.load_table_from_file(
                source_file, staging_table_ref, job_config=load_job_config)

        job.result()

        self.file_generator = load_file_generator.FileGenerator(
            project_id, self.dataset_id, self.bucket_name,
            self.test_file_parameters, self.df_staging_path, self.df_temp_path)

        # assert that the file names/numbers are correct
        self.file_generator.create_files()
        files = [blob.name for blob in self.file_bucket.list_blobs()]
        # pylint: disable=line-too-long
        expected_files = [
            'fileType=csv/compression=none/numColumns=10/columnTypes=50_STRING_50_INTEGER/numFiles=1/tableSize=0MB/file1.csv',
            'fileType=csv/compression=none/numColumns=10/columnTypes=50_STRING_50_INTEGER/numFiles=10/tableSize=0MB/file1.csv',
            'fileType=csv/compression=none/numColumns=10/columnTypes=50_STRING_50_INTEGER/numFiles=10/tableSize=0MB/file10.csv',
            'fileType=csv/compression=none/numColumns=10/columnTypes=50_STRING_50_INTEGER/numFiles=10/tableSize=0MB/file2.csv',
            'fileType=csv/compression=none/numColumns=10/columnTypes=50_STRING_50_INTEGER/numFiles=10/tableSize=0MB/file3.csv',
            'fileType=csv/compression=none/numColumns=10/columnTypes=50_STRING_50_INTEGER/numFiles=10/tableSize=0MB/file4.csv',
            'fileType=csv/compression=none/numColumns=10/columnTypes=50_STRING_50_INTEGER/numFiles=10/tableSize=0MB/file5.csv',
            'fileType=csv/compression=none/numColumns=10/columnTypes=50_STRING_50_INTEGER/numFiles=10/tableSize=0MB/file6.csv',
            'fileType=csv/compression=none/numColumns=10/columnTypes=50_STRING_50_INTEGER/numFiles=10/tableSize=0MB/file7.csv',
            'fileType=csv/compression=none/numColumns=10/columnTypes=50_STRING_50_INTEGER/numFiles=10/tableSize=0MB/file8.csv',
            'fileType=csv/compression=none/numColumns=10/columnTypes=50_STRING_50_INTEGER/numFiles=10/tableSize=0MB/file9.csv',
            'fileType=json/compression=none/numColumns=10/columnTypes=50_STRING_50_INTEGER/numFiles=1/tableSize=0MB/file1.json',
            'fileType=json/compression=none/numColumns=10/columnTypes=50_STRING_50_INTEGER/numFiles=10/tableSize=0MB/file1.json',
            'fileType=json/compression=none/numColumns=10/columnTypes=50_STRING_50_INTEGER/numFiles=10/tableSize=0MB/file10.json',
            'fileType=json/compression=none/numColumns=10/columnTypes=50_STRING_50_INTEGER/numFiles=10/tableSize=0MB/file2.json',
            'fileType=json/compression=none/numColumns=10/columnTypes=50_STRING_50_INTEGER/numFiles=10/tableSize=0MB/file3.json',
            'fileType=json/compression=none/numColumns=10/columnTypes=50_STRING_50_INTEGER/numFiles=10/tableSize=0MB/file4.json',
            'fileType=json/compression=none/numColumns=10/columnTypes=50_STRING_50_INTEGER/numFiles=10/tableSize=0MB/file5.json',
            'fileType=json/compression=none/numColumns=10/columnTypes=50_STRING_50_INTEGER/numFiles=10/tableSize=0MB/file6.json',
            'fileType=json/compression=none/numColumns=10/columnTypes=50_STRING_50_INTEGER/numFiles=10/tableSize=0MB/file7.json',
            'fileType=json/compression=none/numColumns=10/columnTypes=50_STRING_50_INTEGER/numFiles=10/tableSize=0MB/file8.json',
            'fileType=json/compression=none/numColumns=10/columnTypes=50_STRING_50_INTEGER/numFiles=10/tableSize=0MB/file9.json'
        ]
        assert files == expected_files

    def test_compose_sharded_blobs(self, project_id):
        """Tests FileGenerator._compose_sharded_blobs().

        Tests FileGenerator's ability to properly compose multiple sharded
            blobs into one blob.

        Args:
            project_id(str): ID of the project that holds the test GCS
                resources.

        Returns:
            True if test passes, else False.
        """
        if not project_id:
            raise Exception(
                'Test needs project_id to pass. '
                'Add --project_id={your project ID} to test command')
        self.file_generator = load_file_generator.FileGenerator(
            project_id, self.dataset_id, self.bucket_name,
            self.test_file_parameters, self.df_staging_path, self.df_temp_path)

        abs_path = os.path.abspath(os.path.dirname(__file__))
        sample_file = os.path.join(
            abs_path,
            ('test_data/fileType=csv/compression=none/'
             'numColumns=10/columnTypes=50_STRING_50_NUMERIC/numFiles=1/'
             'tableSize=10MB/file1.csv'))
        num_sample_blobs = 3
        for i in range(1, num_sample_blobs + 1):
            blob = self.file_bucket.blob('blob{0:d}'.format(i))
            blob.upload_from_filename(sample_file)
        composed_blob_name = 'blob'
        self.file_generator._compose_sharded_blobs(blob_name=composed_blob_name,
                                                   max_composable_blobs=2)

        # assert that the final composed blob exists and all sharded blobs
        # have been deleted
        assert storage.Blob(composed_blob_name, self.file_bucket).exists()
        for i in range(1, num_sample_blobs + 1):
            assert not storage.Blob('blob{0:d}'.format(i),
                                    self.file_bucket).exists()

        # check that the correct number of rows exists in the composed blob
        with open(sample_file) as opened_sample_file:
            csv_reader = list(csv.reader(opened_sample_file))
            sample_file_num_rows = len(csv_reader)

        abs_path = os.path.abspath(os.path.dirname(__file__))
        downloaded_blob_name = '{0:s}.csv'.format(composed_blob_name)
        downloaded_blob_path = os.path.join(abs_path, downloaded_blob_name)
        self.file_bucket.get_blob(composed_blob_name).download_to_filename(
            downloaded_blob_path)

        with open(downloaded_blob_path) as opened_downloaded_blob:
            csv_reader = list(csv.reader(opened_downloaded_blob))
            composed_blob_num_rows = len(csv_reader)

        expected_composed_blob_num_rows = \
            sample_file_num_rows * num_sample_blobs

        assert composed_blob_num_rows == expected_composed_blob_num_rows

        os.remove(downloaded_blob_path)

    def teardown(self):
        """Tears down resources created in setup().
        """
        self.df_staging_bucket.delete(force=True)

        self.file_bucket.delete(force=True)

        self.bq_client.delete_dataset(self.dataset_ref, delete_contents=True)
