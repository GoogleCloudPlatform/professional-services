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

       # create test params that will result in 2 files
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

        # create sample staging table
        self.bq_client = bigquery.Client()
        self.dataset_id = 'bqbm_test_resized_staging_dataset'
        self.dataset_ref = self.bq_client.dataset(self.dataset_id)
        dataset = bigquery.Dataset(self.dataset_ref)
        self.dataset = self.bq_client.create_dataset(dataset)
        staging_table_id = '50_STRING_50_NUMERIC_10_213B'
        staging_table_ref = self.dataset_ref.table(staging_table_id)

        abs_path = os.path.abspath(os.path.dirname(__file__))
        sample_data_file = os.path.join(
            abs_path,
            ('test_data/fileType=csv/compression=none/'
             'numColumns=10/columnTypes=50_STRING_50_NUMERIC/numFiles=1/'
             'tableSize=10MB/file1.csv')
        )
        load_job_config = bigquery.LoadJobConfig()
        load_job_config.source_format = bigquery.SourceFormat.CSV
        load_job_config.skip_leading_rows = 1
        load_job_config.autodetect = True

        with open(sample_data_file, "rb") as source_file:
            job = self.bq_client.load_table_from_file(
                source_file,
                staging_table_ref,
                job_config=load_job_config
            )

        job.result()

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

    def test_create_files(self, project_id):
        self.file_generator = file_generator.FileGenerator(
            project_id,
            self.dataset_id,
            self.bucket_name,
            self.test_file_parameters,
            self.df_staging_path,
            self.df_temp_path
        )

        # assert that the file names/numbers are correct
        self.file_generator.create_files()
        files = [blob.name for blob in self.file_bucket.list_blobs()]
        # pylint: disable=line-too-long
        expect_files = [
            u'fileType=csv/compression=none/numColumns=10/columnTypes=50_INTEGER_50_STRING/numFiles=1/tableSize=0MB/file1.csv',
            u'fileType=csv/compression=none/numColumns=10/columnTypes=50_INTEGER_50_STRING/numFiles=10/tableSize=0MB/file1.csv',
            u'fileType=csv/compression=none/numColumns=10/columnTypes=50_INTEGER_50_STRING/numFiles=10/tableSize=0MB/file10.csv',
            u'fileType=csv/compression=none/numColumns=10/columnTypes=50_INTEGER_50_STRING/numFiles=10/tableSize=0MB/file2.csv',
            u'fileType=csv/compression=none/numColumns=10/columnTypes=50_INTEGER_50_STRING/numFiles=10/tableSize=0MB/file3.csv',
            u'fileType=csv/compression=none/numColumns=10/columnTypes=50_INTEGER_50_STRING/numFiles=10/tableSize=0MB/file4.csv',
            u'fileType=csv/compression=none/numColumns=10/columnTypes=50_INTEGER_50_STRING/numFiles=10/tableSize=0MB/file5.csv',
            u'fileType=csv/compression=none/numColumns=10/columnTypes=50_INTEGER_50_STRING/numFiles=10/tableSize=0MB/file6.csv',
            u'fileType=csv/compression=none/numColumns=10/columnTypes=50_INTEGER_50_STRING/numFiles=10/tableSize=0MB/file7.csv',
            u'fileType=csv/compression=none/numColumns=10/columnTypes=50_INTEGER_50_STRING/numFiles=10/tableSize=0MB/file8.csv',
            u'fileType=csv/compression=none/numColumns=10/columnTypes=50_INTEGER_50_STRING/numFiles=10/tableSize=0MB/file9.csv',
            u'fileType=json/compression=none/numColumns=10/columnTypes=50_INTEGER_50_STRING/numFiles=1/tableSize=0MB/file1.json',
            u'fileType=json/compression=none/numColumns=10/columnTypes=50_INTEGER_50_STRING/numFiles=10/tableSize=0MB/file1.json',
            u'fileType=json/compression=none/numColumns=10/columnTypes=50_INTEGER_50_STRING/numFiles=10/tableSize=0MB/file10.json',
            u'fileType=json/compression=none/numColumns=10/columnTypes=50_INTEGER_50_STRING/numFiles=10/tableSize=0MB/file2.json',
            u'fileType=json/compression=none/numColumns=10/columnTypes=50_INTEGER_50_STRING/numFiles=10/tableSize=0MB/file3.json',
            u'fileType=json/compression=none/numColumns=10/columnTypes=50_INTEGER_50_STRING/numFiles=10/tableSize=0MB/file4.json',
            u'fileType=json/compression=none/numColumns=10/columnTypes=50_INTEGER_50_STRING/numFiles=10/tableSize=0MB/file5.json',
            u'fileType=json/compression=none/numColumns=10/columnTypes=50_INTEGER_50_STRING/numFiles=10/tableSize=0MB/file6.json',
            u'fileType=json/compression=none/numColumns=10/columnTypes=50_INTEGER_50_STRING/numFiles=10/tableSize=0MB/file7.json',
            u'fileType=json/compression=none/numColumns=10/columnTypes=50_INTEGER_50_STRING/numFiles=10/tableSize=0MB/file8.json',
            u'fileType=json/compression=none/numColumns=10/columnTypes=50_INTEGER_50_STRING/numFiles=10/tableSize=0MB/file9.json'
        ]
        assert files == expect_files

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