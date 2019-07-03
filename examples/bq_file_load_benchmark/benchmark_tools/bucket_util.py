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

from __future__ import absolute_import
from __future__ import division
from __future__ import print_function
import logging

from google.cloud import storage

from benchmark_tools import file_constants


class BucketUtil(object):
    """Assists with GCS Bucket interaction.

    Attributes:
        bucket_name(str): Name of the bucket to interact with.
        project_id(str): ID of the project that holds the GCS bucket.
        file_params(dict): Dictionary containing each file parameter and
            its possible values.

    """

    def __init__(self, bucket_name, project_id, file_params):
        self.bucket_name = bucket_name
        self.project_id = project_id
        self.file_params = file_params

    def get_existing_paths(self):
        """Gathers existing paths in a bucket.

        Faster alternative to using native google.cloud.storage.bucket.Bucket's
        list_blobs() method. Generates all combinations of files using
        FILE_PARAMETERS, and checks if the first file in that combination
        exists. If so, it is added to existing_paths set. Creating a set of the
        first files rather for each combinations rather than generating a list
        of all 1, 100, 1000, or 10000 files per combination
        (depending on the number of files in the combination)
        saves time and space.

        Returns:
            existing_paths: set containing paths that already exist in given
            bucket
        """

        logging.info('Gathering files from parameters list that exist'
                     ' in bucket {0:s}.'.format(self.bucket_name))
        file_types = self.file_params['fileType']
        compression_types = self.file_params['fileCompressionTypes']
        num_columns = self.file_params['numColumns']
        column_types = self.file_params['columnTypes']
        num_files = self.file_params['numFiles']
        table_sizes = self.file_params['stagingDataSizes']
        compression_extensions = (file_constants.FILE_CONSTANTS
                                  ['compressionExtensions'])
        path_set = set()
        path_string = ('fileType={0:s}/compression={1:s}/numColumns={2:d}/'
                       'columnTypes={3:s}/numFiles={4:d}/tableSize={5:s}/' 
                       'file1.{6:s}')

        gcs_client = storage.Client(
            project=self.project_id
        )
        bucket = gcs_client.get_bucket(self.bucket_name)
        for file_type in file_types:
            for compression_type in compression_types[file_type]:
                for num_column in num_columns:
                    for c_type in column_types:
                        for num_file in num_files:
                            for table_size in table_sizes:
                                if compression_type == 'none':
                                    extension = file_type
                                else:
                                    extension = compression_extensions[
                                        compression_type]
                                path = path_string.format(
                                    file_type,
                                    compression_type,
                                    num_column,
                                    c_type,
                                    num_file,
                                    table_size,
                                    extension,
                                )
                                exists = storage.Blob(
                                    bucket=bucket,
                                    name=path,
                                ).exists(gcs_client)
                                if exists:
                                    # print('adding {0:s}'.format(path))
                                    path_set.add(path)

        logging.info('Done gathering {0:d} existing files.'.format(
            len(path_set)
        ))
        return path_set
