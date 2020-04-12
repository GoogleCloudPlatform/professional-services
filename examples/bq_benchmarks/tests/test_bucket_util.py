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

from google.api_core import exceptions
from google.cloud import storage

from bq_benchmarks.generic_benchmark_tools import bucket_util


class TestBucketUtil(object):
    """Tests functionality of load_benchmark_tools.benchmark_result_util.

    Attributes:
        bucket_name(str): Name of the bucket used for testing.
        bucket(google.cloud.storage.bucket.Bucket): Bucket used for testing.
        blob1_name(str): Name of the first blob that will be uploaded to the
            bucket for testing.
        blob2_name(str): Name of the second blob that will be uploaded to the
            bucket for testing.
        test_file_parameters(dict): Dictionary containing each test file
            parameter and its possible values.
    """

    def setup(self):
        """Sets up resources for tests.
        """
        self.bucket_name = 'bq_benchmark_test_bucket'
        gcs_client = storage.Client()
        try:
            gcs_client.get_bucket(self.bucket_name).delete(force=True)
            self.bucket = gcs_client.create_bucket(self.bucket_name)
        except exceptions.NotFound:
            self.bucket = gcs_client.create_bucket(self.bucket_name)
        abs_path = os.path.abspath(os.path.dirname(__file__))
        file1 = os.path.join(
            abs_path,
            ('test_data/fileType=csv/compression=none/'
             'numColumns=10/columnTypes=50_STRING_50_NUMERIC/numFiles=1/'
             'tableSize=10MB/file1.csv'))
        self.blob1_name = file1.split('test_data/')[1]
        blob1 = self.bucket.blob(self.blob1_name)
        blob1.upload_from_filename(file1)
        file2 = os.path.join(abs_path,
                             ('test_data/fileType=json/compression=none/'
                              'numColumns=10/columnTypes=100_STRING/numFiles=1/'
                              'tableSize=10MB/file1.json'))
        self.blob2_name = file2.split('test_data/')[1]
        blob2 = self.bucket.blob(self.blob2_name)
        blob2.upload_from_filename(file2)
        self.test_file_parameters = {
            'fileType': ['csv', 'json'],
            'fileCompressionTypes': {
                'csv': ['none'],
                'json': ['none']
            },
            'numColumns': [10],
            'numFiles': [1, 100, 1000, 10000],
            'targetDataSizes': [.01],
            'stagingDataSizes': ['10MB'],
            'columnTypes': [
                '100_STRING',
                '50_STRING_50_NUMERIC',
            ],
        }

    def test_get_existing_paths(self, project_id):
        """Tests BucketUtil.get_existing_paths().

        Tests BucketUtil's ability to check the existence of each
            blob generated from path combinations of the parameters in a
            file_params dict and to return a set of existing blobs.

        Args:
            project_id(str): ID of the project that holds the test GCS bucket.

        Returns:
            True if test passes, else False.
        """
        if not project_id:
            raise Exception(
                'Test needs project_id to pass. '
                'Add --project_id={your project ID} to test command')
        self.bucket_util = bucket_util.BucketUtil(
            bucket_name=self.bucket_name,
            project_id=project_id,
            file_params=self.test_file_parameters)
        existing_paths = self.bucket_util.get_existing_paths(
            run_federated_query_benchmark=False)
        expected_paths = set([self.blob1_name, self.blob2_name])
        assert existing_paths == expected_paths

    def teardown(self):
        """Tears down resources created in setup().
        """
        self.bucket.delete(force=True)
