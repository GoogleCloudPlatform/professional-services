from __future__ import absolute_import
from __future__ import division
from __future__ import print_function
import os

from google.cloud import bigquery
from google.cloud import storage

from bq_file_load_benchmark.benchmark_tools import file_generator


class TestFileGenerator(object):
    """Tests functionality of benchmark_tools.file_generator.FileGenerator.

    Attributes:

    """

    def setup(self):
        """Sets up resources for tests.
        """
        # create bucket
        self.bucket_name = 'bq_benchmark_test_bucket'
        gcs_client = storage.Client()
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
        dataset = bigquery.Dataset(self.dataset_ref)
        self.dataset = self.bq_client.create_dataset(dataset)

        # set up GCS resources needed for dataglow job
        df_staging_bucket_id = 'bq_benchmark_dataflow_test'
        gcs_client = storage.Client()
        self.df_staging_bucket = gcs_client.create_bucket(
            df_staging_bucket_id
        )
        staging_blob = self.df_staging_bucket.blob('staging/')
        temp_blob = self.df_staging_bucket.blob('temp/')
        staging_blob.upload_from_string('')
        temp_blob.upload_from_string('')
        self.df_staging_path = 'gs://{0:1}/staging'.format(
            df_staging_bucket_id
        )
        self.df_temp_path = 'gs://{0:1}/temp'.format(
            df_staging_bucket_id
        )

    def test_compose_sharded_blobs(self, project_id):
        self.file_generator = file_generator.FileGenerator(
            project_id,
            self.dataset_id,
            self.bucket_name,
            self.test_file_parameters,
            self.df_staging_path,
            self.df_temp_path
        )

        abs_path = os.path.abspath(os.path.dirname(__file__))
        sample_file = os.path.join(
            abs_path,
            ('test_data/fileType=csv/compression=none/'
             'numColumns=10/columnTypes=50_STRING_50_NUMERIC/numFiles=1/'
             'tableSize=10MB/file1.csv')
        )
        num_sample_blobs = 3
        for i in range(1, num_sample_blobs + 1):
            blob = self.file_bucket.blob('blob{0:d}'.format(i))
            blob.upload_from_filename(sample_file)
        composed_blob_name = 'blob'
        self.file_generator._compose_sharded_blobs(
            blob_name=composed_blob_name,
            max_composable_blobs=2
        )

        assert storage.Blob(composed_blob_name, self.file_bucket).exists()
        for i in range(1, num_sample_blobs + 1):
            assert not storage.Blob(
                'blob{0:d}'.format(i),
                self.file_bucket).exists()

    def teardown(self):
        """Tears down resources created in setup().
        """
        self.df_staging_bucket.delete(
            force=True
        )

        self.file_bucket.delete(
            force=True
        )

        self.bq_client.delete_dataset(
            self.dataset_ref,
            delete_contents=True
        )