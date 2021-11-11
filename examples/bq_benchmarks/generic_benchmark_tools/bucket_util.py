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

from concurrent.futures import ThreadPoolExecutor
import itertools
import logging

from google.cloud import storage

from generic_benchmark_tools import file_constants

MB_IN_TB = 1000000


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

    def get_existing_paths(self, run_federated_query_benchmark):
        """Discovers existing paths in a bucket.

        Faster alternative to using native google.cloud.storage.bucket.Bucket's
        list_blobs() method. Generates all combinations of files using
        FILE_PARAMETERS, and checks if the first file in that combination
        exists. If so, it is added to existing_paths set. Creating a set of the
        first files for each combinations rather than generating a list
        of all 1, 100, 1000, or 10000 files per combination
        (depending on the number of files in the combination)
        saves time and space.

        Args:
            run_federated_query_benchmark(Bool): Flag to indicate that the
                Federated Query Benchmark is being run, which means snappy
                compressed files should be skipped due to lack of support.

        Returns:
            existing_paths: set containing paths that already exist in given
            bucket
        """

        def _path_exists(path_details):
            """Adds a path to the path_set if it exists.

            Constructs a path based off of the parameters in the path_details
            tuple. Checks that the constructed path exists in the bucket
            defined in the outer function. If so, the path is added to path_set.

            Args:
                path_details (tuple):  of
                    (file_type,
                    num_column,
                    column_type,
                    num_file,
                    table_size)
            """
            file_type, \
                num_column, \
                column_type, \
                num_file, \
                table_size = path_details
            for compression_type in compression_types[file_type]:
                if compression_type == 'none':
                    extension = file_type
                else:
                    extension = compression_extensions[compression_type]

                path = path_string.format(
                    file_type,
                    compression_type,
                    num_column,
                    column_type,
                    num_file,
                    table_size,
                    extension,
                )
                exists = storage.Blob(
                    bucket=bucket,
                    name=path,
                ).exists(gcs_client)
                total_table_size = int(num_file) * \
                    int(table_size.split('MB')[0])
                if exists:
                    if run_federated_query_benchmark and \
                            (compression_type == 'snappy' or
                             total_table_size > MB_IN_TB):
                        continue
                    path_set.add(path)

        logging.info('Discovering files from parameters list that exist'
                     ' in bucket {0:s}.'.format(self.bucket_name))
        if run_federated_query_benchmark:
            logging.info(
                'External queries on snappy compressed files are not '
                'supported. Snappy files will not be added to set of existing '
                'paths.')
            logging.info(
                'Only paths that will result in table less than 1 TB will be '
                'added to the set of existing paths to ensure limit query cost.'
            )
        file_types = self.file_params['fileType']
        compression_types = self.file_params['fileCompressionTypes']
        num_columns = self.file_params['numColumns']
        column_types = self.file_params['columnTypes']
        num_files = self.file_params['numFiles']
        table_sizes = self.file_params['stagingDataSizes']
        compression_extensions = (
            file_constants.FILE_CONSTANTS['compressionExtensions'])
        path_set = set()
        path_string = ('fileType={0:s}/compression={1:s}/numColumns={2:d}/'
                       'columnTypes={3:s}/numFiles={4:d}/tableSize={5:s}/'
                       'file1.{6:s}')

        gcs_client = storage.Client(project=self.project_id)
        bucket = gcs_client.get_bucket(self.bucket_name)

        with ThreadPoolExecutor() as p:
            p.map(
                _path_exists,
                itertools.product(
                    file_types,
                    num_columns,
                    column_types,
                    num_files,
                    table_sizes,
                ))

        logging.info('Done discovering {0:d} existing files.'.format(
            len(path_set)))
        return path_set
