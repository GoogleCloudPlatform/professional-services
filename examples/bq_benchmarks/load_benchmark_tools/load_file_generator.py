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
import hashlib
import itertools
import logging

import apache_beam as beam
from apache_beam.io.gcp.internal.clients import bigquery as beam_bigquery
from apache_beam.options import pipeline_options
from google.cloud import bigquery
from google.api_core import exceptions
from google.cloud import storage

from generic_benchmark_tools import avro_util
from generic_benchmark_tools import bucket_util
from generic_benchmark_tools import file_constants
from generic_benchmark_tools import parquet_util
from generic_benchmark_tools import table_util

MAX_COMPOSABLE_BLOBS = 32


class FileGenerator(object):
    """Generates files in GCS for loading into benchmark tables.

    Gathers all combinations of files from the parameters in the
    file_parameters.FILE_PARAMETERS dictionary. Generates each file combination
    from the resized staging tables in BigQuery and stores in the provided GCS
    bucket. If the file type is csv, json, or avro (generated from a table 1 GB
    or less), it is generated using BigQUery extract jobs. If the file type is
    parquet or avro (generated from a table greater than 1 GB), it is generated
    using DataFlow.

    Attributes:
        bq_client(google.cloud.bigquery.client.Client): Client to hold
            configurations needed for BigQuery API requests.
        gcs_client(google.cloud.storage.client.Client): Client to hold
            configurations needed for GCS API requests.
        project_id(str): ID of the project that holds the GCS bucket
            where the generated files will be stored.
        primitive_staging_dataset_id(str): ID of the dataset that contains the
            staging tables (with primitive data types) that the files loaded
            into the benchmark table are generated from.
        primitive_dataset_ref(google.cloud.bigquery.dataset.DatasetReference):
            Pointer to the dataset that contains the staging tables
            (with primitive data types) that the files loaded
            into the benchmark table are generated from.
        primitive_staging_tables(List[google.cloud.bigquery.table.TableListItem]):
            List representing all the tables in the primitive staging dataset.
        bucket_name(str): Name of the bucket that the generated files will be
            saved in.
        bucket(google.cloud.storage.bucket.Bucket): Bucket that the generated
            files will be saved in.
        bucket_util(load_benchmark_tools.bucket_util.BucketUtil): Helper class for
            interacting with the bucket that the generated files will be
            saved in.
        dataflow_staging_location(str): GCS staging path for dataflow jobs.
        dataflow_temp_location(str): GCS temp path for dataflow jobs.
    """

    def __init__(
            self,
            project_id,
            primitive_staging_dataset_id,
            bucket_name,
            file_params,
            dataflow_staging_location,
            dataflow_temp_location,
    ):
        self.bq_client = bigquery.Client()
        self.gcs_client = storage.Client()
        self.project_id = project_id
        self.primitive_staging_dataset_id = primitive_staging_dataset_id
        self.primitive_dataset_ref = self.bq_client.dataset(
            self.primitive_staging_dataset_id)
        self.primitive_staging_tables = self._get_staging_tables(
            self.primitive_dataset_ref)
        self.bucket_name = bucket_name
        self.bucket = self.gcs_client.get_bucket(self.bucket_name)
        self.file_params = file_params
        self.bucket_util = bucket_util.BucketUtil(bucket_name=bucket_name,
                                                  project_id=project_id,
                                                  file_params=file_params)
        self.dataflow_staging_location = dataflow_staging_location
        self.dataflow_temp_location = dataflow_temp_location

    def restart_incomplete_combination(self, restart_file):
        """Restarts file generation at a specific file if program was stopped.

        When the extract_tables_to_files() method runs, it will skip any
        combination that contains at least one file. However, sometimes the
        program may time out, or a backend error will occur, meaning a
        combination may not have a complete set of files. When this happens,
        restart_incomplete_combination can be used to restart file generation
        for a combination at the last file that was successfully created.

        Args:
            restart_file(str): the file last successful file that was created
                in an incomplete perumtation. The string should start with
                'fileType=' and end with the file extension.
                # pylint: disable=line-too-long
                Ex: fileType=csv/compression=none/numColumns=10/columnTypes=100_STRING/numFiles=10000/tableSize=2147MB/file3876.csv
        """

        source_blob_name = restart_file
        restart_file_split = restart_file.split('/')
        destination_path = '/'.join(
            restart_file_split[:len(restart_file_split) - 1]) + '/'
        restart_file_num = int(
            restart_file_split[len(restart_file_split) -
                               1].split('file')[1].split('.')[0])
        extension = restart_file.split('.')[1]
        num_files = int(restart_file.split('numFiles=')[1].split('/')[0])
        self.copy_blobs(
            source_blob_name,
            destination_path,
            extension,
            restart_file_num + 1,
            num_files,
        )

    def _get_staging_tables(self, dataset_ref):
        """Internal method for getting list of staging tables.

        Args:
            dataset_ref(google.cloud.bigquery.dataset.DatasetReference):
            Pointer to the dataset that contains the staging tables.

        Returns:
            List of google.cloud.bigquery.table.TableListItem, representing
            tables that are in the staging dataset.
        """

        primitive_staging_dataset = bigquery.Dataset(dataset_ref)
        return list(self.bq_client.list_tables(primitive_staging_dataset))

    def _create_parquet_file(self, blob_name, staging_table_util,
                             destination_prefix):
        """Creates a parquet file from a staging table and stores in GCS.

        The parquet file is generated using DataFLow, since BigQuery Extract
        Jobs do not support the parquet file type as a destination format.

        Args:
            blob_name(str): Name of the file (or blob) to be generated. Starts
                with 'fileType=' and end with the file extension.
                Ex: fileType=csv/compression=none/numColumns=10/columnTypes=100_STRING/numFiles=10000/tableSize=2147MB/file3876.csv  # pylint: disable=line-too-long
            staging_table_util(load_benchmark_tools.table_util.TableUtil): Util
                object for interacting with the staging table that the parquet
                file will be generated from.
            destination_prefix(str): String containing the 'gs://' prefix, the
                bucket name, and the path of the file, without the extension.
                This is needed by the WriteToParquet class.
                Ex: gs://annarudy_test_files/fileType=csv/compression=none/numColumns=10/columnTypes=100_STRING/numFiles=10000/tableSize=2147MB/file3876 # pylint: disable=line-too-long
        """
        logging.info('Attempting to create file ' '{0:s}'.format(blob_name))
        pipeline_args = [
            '--project', self.project_id, '--staging_location',
            self.dataflow_staging_location, '--temp_location',
            self.dataflow_temp_location, '--save_main_session',
            '--worker_machine_type', 'n1-highcpu-32', '--runner',
            'DataflowRunner', '--setup_file', './setup.py'
        ]
        options = pipeline_options.PipelineOptions(pipeline_args)
        table_spec = beam_bigquery.TableReference(
            projectId=self.project_id,
            datasetId=self.primitive_staging_dataset_id,
            tableId=staging_table_util.table_id)
        bq_schema = staging_table_util.table.schema
        pa_schema = parquet_util.ParquetUtil(
            bq_schema).get_pa_translated_schema()
        p = beam.Pipeline(options=options)
        table = (
            p | 'ReadTable' >> beam.io.Read(beam.io.BigQuerySource(table_spec)))
        (table | beam.io.WriteToParquet(
            file_path_prefix=destination_prefix,
            schema=pa_schema,
            file_name_suffix='.parquet',
            num_shards=1,
            shard_name_template='',
        ))
        p.run().wait_until_finish()
        logging.info('Created file: {0:s}'.format(blob_name))

    def _create_large_avro_file(self, blob_name, staging_table_util,
                                destination_prefix, compression, extension):
        """Creates avro files from a staging table and stores in GCS.

        The avro file is generated in this method using DataFlow. BigQuery
        extract jobs do support avro as a destination format. However, if the
        size of the staging table is greater than 1 GB, the generated files
        must be sharded and then composed into a single file. The composition
        process causes errors when the destination format is avro, since some
        of the composed avro files end up with negative row counts. Therefore,
        this method can be called when generating an avro file from a staging
        table greater than 1 GB.

        Args:
            blob_name(str): Name of the file (or blob) to be generated. Starts
                with 'fileType=' and end with the file extension.
                Ex: fileType=csv/compression=none/numColumns=10/columnTypes=100_STRING/numFiles=10000/tableSize=2147MB/file3876.csv # pylint: disable=line-too-long
            staging_table_util(load_benchmark_tools.table_util.TableUtil): Util
                object for interacting with the staging table that the avro
                file will be generated from.
            destination_prefix(str): String containing the 'gs://' prefix, the
                bucket name, and the path of the file, without the extension.
                This is needed by the WriteToParquet class.
                Ex: gs://annarudy_test_files/fileType=csv/compression=none/numColumns=10/columnTypes=100_STRING/numFiles=10000/tableSize=2147MB/file3876 # pylint: disable=line-too-long
            compression(str): String representing the compression format that
                the generated file should have. Options are 'none' if no
                compression is to be used, 'snappy', or 'deflate'.
            extension(str): String to be used as the extension for the avro
                file. Options are 'avro' if no compression is to be used,
                'snappy', or 'deflate'.
        """
        pipeline_args = [
            '--project', self.project_id, '--staging_location',
            self.dataflow_staging_location, '--temp_location',
            self.dataflow_temp_location, '--save_main_session',
            '--worker_machine_type', 'n1-highcpu-32', '--runner',
            'DataflowRunner', '--setup_file', './setup.py'
        ]
        options = pipeline_options.PipelineOptions(pipeline_args)
        table_spec = beam_bigquery.TableReference(
            projectId=self.project_id,
            datasetId=self.primitive_staging_dataset_id,
            tableId=staging_table_util.table_id,
        )
        codec = 'null' if compression == 'none' else compression
        bq_schema = staging_table_util.table.schema
        table_name = staging_table_util.table.table_id
        avro_schema = avro_util.AvroUtil(
            bq_schema=bq_schema,
            schema_name=table_name).get_avro_translated_schema()
        p = beam.Pipeline(options=options)
        table = (
            p | 'ReadTable' >> beam.io.Read(beam.io.BigQuerySource(table_spec)))
        (table | beam.io.WriteToAvro(
            file_path_prefix=destination_prefix,
            schema=avro_schema,
            file_name_suffix='.' + extension,
            use_fastavro=True,
            codec=codec,
            num_shards=1,
            shard_name_template='',
        ))
        p.run().wait_until_finish()
        logging.info('Created file: {0:s}'.format(blob_name))

    def _compose_sharded_blobs(self, blob_name, max_composable_blobs):
        """Composes multiple files (or blobs) into one file.

        Args:
            blob_name(str): Both the prefix that the sharded files share, and the
                name of the single file that the sharded files will be composed
                into.
                # pylint: disable=line-too-long
                Ex: fileType=csv/compression=none/numColumns=10/columnTypes=100_STRING/numFiles=10000/tableSize=2147MB/file3876.csv
            max_composable_blobs(int): The maximum number of blobs that
                can be composed at once.
        """

        def _compose_blobs(group):
            """Composes a group of blobs into one blob then deletes the group
                of blobs.

            Args:
                group(dict): A dictionary of blob objects.

            Returns:
                A blob object created by composing blobs in the group dict.
            :return:
            """
            # If length of indexed_groups is 1, then this is the final
            # composition that needs to be completed, in which case the
            # composed blob needs to have the name stored in blob_name.
            if len(indexed_groups) == 1:
                composed_blob_name = blob_name
            # Otherwise, create a name based off of the hash of all the blob
            # names in the group concatenated together. Note that using the hash
            # creates a shorter and simpler name than using the
            # concatenated string as the composed blob name, especially if the
            # total number of shards is quite large.
            else:
                composed_blob_name = hashlib.md5(','.join(
                    [blob.name for blob in group]).encode('utf-8')).hexdigest()

            # Compose the group of blobs into one, and delete the group of
            # blobs since only the composed blob is needed.
            logging.info('Composing {0:d} shards into one blob.'.format(
                len(group)))
            self.bucket.blob(composed_blob_name).compose(group)
            self.bucket.delete_blobs(group)
            return self.bucket.get_blob(composed_blob_name)

        sharded_blobs = list(self.bucket.list_blobs(prefix=blob_name))

        # break the sharded blobs up into groups the size of
        # max_composable_blobs, and store groups in list indexed_groups
        indexed_groups = [
            (sharded_blobs[i:i + max_composable_blobs])
            for i in range(0, len(sharded_blobs), max_composable_blobs)
        ]
        # Initialize a list to hold recently composed blobs. The composition
        # process will continue until the size of last_composed_group is one,
        # meaning all blobs have been composed into one.
        last_composed_group = []

        with ThreadPoolExecutor() as p:
            while len(last_composed_group) != 1:

                # Concurrently call _compose_blobs on a list of groups of blobs
                # to compose the blobs in each group into one blob.
                last_composed_group = list(p.map(_compose_blobs,
                                                 indexed_groups))

                # Regroup the newly composed blobs into groups the size of
                # max_composable_blobs, and store groups in list indexed_groups.
                indexed_groups = [
                    (last_composed_group[i:i + MAX_COMPOSABLE_BLOBS])
                    for i in range(0, len(last_composed_group),
                                   MAX_COMPOSABLE_BLOBS)
                ]

        logging.info('Composition of sharded blobs complete.')
        logging.info('Created file: {0:s}'.format(blob_name))

    def _extract_tables_to_files(self, blob_name, compression_type,
                                 destination_format, destination_prefix,
                                 extension, staging_table_util):
        """Creates files from staging tables and stores in GCS.

        Uses BigQuery extract jobs to create the files. Only files of type
        csv, json, or avro (if the staging table is 1 GB or less) can be
        generated using this method.

        Args:
            blob_name(str): Name of the file (or blob) to be generated. Starts
                with 'fileType=' and end with the file extension.
                Ex: fileType=csv/compression=none/numColumns=10/columnTypes=100_STRING/numFiles=10000/tableSize=2147MB/file3876.csv # pylint: disable=line-too-long
            compression_type(str): String representing the compression format
                that the generated file should have. Options are 'none' if no
                compression is to be used, 'gzip', 'snappy', or 'deflate'.
            destination_format(google.cloud.bigquery.job.DestinationFormat):
                Class representing the format that the file should be in. Options
                are AVRO, CSV, and NEWLINE_DELIMITED_JSON.
            destination_prefix(str): String containing the 'gs://' prefix, the
                bucket name, and the path of the file, without the extension.
                This is needed by the WriteToParquet class.
                Ex: gs://annarudy_test_files/fileType=csv/compression=none/numColumns=10/columnTypes=100_STRING/numFiles=10000/tableSize=2147MB/file3876 # pylint: disable=line-too-long
            extension(str): String to be used as the extension for the file.
                Options include 'avro', 'csv', 'json', 'deflate', 'gzip', and
                'snappy'.
            staging_table_util(load_benchmark_tools.table_util.TableUtil): Helper
                class for interacting with the staging table that the file is to
                be generated from.
        """
        logging.info('Attempting to create file ' '{0:s}'.format(blob_name))
        # Create and and try the extract job.
        extract_job_config = bigquery.ExtractJobConfig()
        compression = (file_constants.FILE_CONSTANTS['compressionFormats']
                       [compression_type])
        extract_job_config.compression = compression
        extract_job_config.destination_format = destination_format
        extract_job_config.print_header = False
        destination = destination_prefix + '.' + extension
        extract_job = self.bq_client.extract_table(
            source=staging_table_util.table_ref,
            destination_uris=destination,
            job_config=extract_job_config,
        )

        try:
            # If the job succeeds, the data in the staging table will be
            # written to GCS
            extract_job.result()
            logging.info('Created file: {0:s}'.format(blob_name))
        # An exception will be thrown if the staging table is too large (greater
        # than 1 GB) to be extracted to a single file.
        except exceptions.BadRequest as e:
            # If the file type is avro, use _create_large_avro_file to create
            # the file via DataFlow. Using the shard and compose methods below
            # will cause errors if the file type is avro.
            if 'avro' in blob_name:
                self._create_large_avro_file(
                    blob_name,
                    staging_table_util,
                    destination_prefix,
                    compression_type,
                    extension,
                )
            else:
                # Use a wildcard appended to the end of the file name to shard
                # the extract into multiple files. Each file will have the
                # provided blob_name as a prefix.
                logging.info(e.message)
                logging.info('Sharding output files since table is too big to '
                             'export to one file.')
                extract_job = self.bq_client.extract_table(
                    source=staging_table_util.table_ref,
                    destination_uris=destination + '/*',
                    job_config=extract_job_config,
                )
                extract_job.result()
                # Compose the sharded files that have the provided blob_name
                # as a prefix into one single file with the name of blob_name.
                self._compose_sharded_blobs(blob_name, MAX_COMPOSABLE_BLOBS)

    def copy_blobs(
            self,
            source_blob_name,
            destination_path,
            extension,
            start_num,
            num_files,
    ):
        """Copies files (or blobs).

        Copies the file with provided source_blob_name n number of times,
        where n is the number of files (numFiles) in the combination
        (i.e. 10000 copies if numFiles in the combination is 100000). This is
        a faster method than extracting the staging table to a file n number
        of times.

        Args:
            source_blob_name(str): Name of the file to be copied.
                Ex: fileType=csv/compression=none/numColumns=10/columnTypes=100_STRING/numFiles=1/tableSize=2147MB/file1.csv # pylint: disable=line-too-long
            destination_path(str): Component of the path that the source blob
                will share with the copied blob.
                Ex: fileType=csv/compression=none/numColumns=10/columnTypes=100_STRING/numFiles=1/tableSize=2147MB/ # pylint: disable=line-too-long
            extension(str): extension(str): String to be used as the extension
                for the file. Options include 'avro', 'csv', 'json', 'parquet',
                'deflate', 'gzip', and 'snappy'.
            start_num(int): The file number that the first blob to be copied
                should have. For example, if the program timed out, and the last
                file for a combination that was successfully copied is
                file4320, the start_num would 4321. That way, the first copied
                file will be file4321. When the create_files() method calls
                copy_blobs(), the start_num will be 1.
            num_files(int): The number of files in the combination. This
                allows copy_files() to know what file number the last copied
                file should have. For exapmle, if the combination has
                numFiles=10000, num_files should be 10000.
        """

        source_blob = self.bucket.get_blob(source_blob_name)
        # Copy the source file until the combination has the correct number
        # of files.
        for n in range(start_num, num_files + 1):
            file_string = 'file{0:d}'.format(n)
            copied_destination = '{0:s}{1:s}.{2:s}'.format(
                destination_path,
                file_string,
                extension,
            )
            copied_blob = self.bucket.copy_blob(
                blob=source_blob,
                destination_bucket=self.bucket,
                new_name=copied_destination,
            )
            logging.info('Created file: {0:s}'.format(copied_blob.name))

    def create_files(self):
        """Creates all file combinations and store in GCS.

        Generates list of file combination from parameters in
        file_parameters.FILE_PARAMETERS dictionary, and creates each file in
        the list, as long as it doesn't yet exist in self.bucket.
        While each file is generated from a BigQuery staging table and stored
        in GCS, the method of creating the file varies depending on the
        parameters in the combination.
        """
        # Gather file parameters and constants.
        files_consts = file_constants.FILE_CONSTANTS
        file_types = self.file_params['fileType']
        extract_formats = files_consts['extractFormats']
        file_compression_types = self.file_params['fileCompressionTypes']
        file_counts = self.file_params['numFiles']

        # Begin the process of iterating through each combination.
        logging.info('Starting to create files by exporting staging tables to '
                     'bucket {0:s}'.format(self.bucket_name))
        skip_message = 'Skipped path and its subsequent files: {0:s}'

        # Gather a list of the staging tables. The staging tables already
        # include the columnTypes, numColumns, and stagingDataSizes
        # parameters (ex: the staging table 100_STRING_10_10MB has
        # columnType=100_STRING, numColumns=10, and stagingDataSizes=10MB).
        tables = self.primitive_staging_tables
        if len(tables) == 0:
            logging.info('Dataset {0:s} contains no tables. Please create '
                         'staging tables in {0:s}.'.format(
                             self.primitive_staging_dataset_id))
        # For each staging table, extract to each fileType, each
        # compressionType, and copy each file so that the combination has
        # the correct numFiles.
        for (table_list_item, file_type, num_files) in \
                itertools.product(tables, file_types, file_counts):
            for compression_type in file_compression_types[file_type]:

                staging_table_util = table_util.TableUtil(
                    table_list_item.table_id,
                    table_list_item.dataset_id,
                )
                staging_table_util.set_table_properties()

                gcs_prefix = 'gs://{0:s}/'.format(self.bucket_name)
                dest_string = ('fileType={0:s}/'
                               'compression={1:s}/'
                               'numColumns={2:d}/'
                               'columnTypes={3:s}/'
                               'numFiles={4:d}/'
                               'tableSize={5:d}MB/')
                destination_path = dest_string.format(
                    file_type,
                    compression_type,
                    staging_table_util.num_columns,
                    staging_table_util.column_types,
                    num_files,
                    int(staging_table_util.table_size / 1000000),
                )

                if compression_type == 'none':
                    extension = file_type
                else:
                    extensions = (files_consts['compressionExtensions'])
                    extension = extensions[compression_type]

                file_string = 'file1'

                destination_prefix = '{0:s}{1:s}{2:s}'.format(
                    gcs_prefix,
                    destination_path,
                    file_string,
                )

                if num_files == 1:
                    # If the number of files in the current combination is 1,
                    # check to see if the one file doesn't yet exist.
                    blob_name = '{0:s}{1:s}.{2:s}'.format(
                        destination_path,
                        file_string,
                        extension,
                    )
                    if not storage.Blob(
                            bucket=self.bucket,
                            name=blob_name,
                    ).exists(self.gcs_client):
                        # If the one file doesn't yet exist, it needs to be
                        # created. The method of creation depends on the file
                        # type.
                        if file_type == 'parquet':
                            # If the file type is parquet, use the
                            # _create_parquet_files() method, which uses
                            # DataFlow for file creation.
                            self._create_parquet_file(
                                blob_name,
                                staging_table_util,
                                destination_prefix,
                            )
                        else:
                            # Otherwise, use the_extract_tables_to_files()
                            # method, which uses BigQuery extract jobs.
                            destination_format = extract_formats[file_type]
                            self._extract_tables_to_files(
                                blob_name,
                                compression_type,
                                destination_format,
                                destination_prefix,
                                extension,
                                staging_table_util,
                            )
                    else:
                        # If the one file one file already exists,
                        # skip its creation.
                        logging.info(skip_message.format(blob_name))
                else:
                    # If the numFiles parameter in the current iteration is not
                    # 1, that means multiple files need to be created for the
                    # combination. In this case, obtain the file from the
                    # combination in which all parameters are identical to the
                    # current combination, except in which numFiles=1. file will
                    # be used to make copies for the combinations where numFiles
                    # > 1, since copying files is faster than running a new
                    # extraction or DataFlow job. For example, if the current
                    # combination is fileType=csv/compression=none/numColumns=10/columnTypes=100_STRING/numFiles=100/tableSize=10MB/ # pylint: disable=line-too-long
                    # then  fileType=csv/compression=none/numColumns=10/columnTypes=100_STRING/numFiles=1/tableSize=10MB/file1.csv # pylint: disable=line-too-long
                    # will be used to make copies for the current  combination.
                    file1_destination_path = dest_string.format(
                        file_type,
                        compression_type,
                        staging_table_util.num_columns,
                        staging_table_util.column_types,
                        1,
                        int(staging_table_util.table_size / 1000000),
                    )
                    file1_blob_name = '{0:s}{1:s}.{2:s}'.format(
                        file1_destination_path,
                        file_string,
                        extension,
                    )
                    # Before making copies for the current combination, check
                    # that the first file in the combination doesn't yet exist.
                    # If it doesn't, then proceed. If it does exist, assume that
                    # all other files in the combination already exist too.
                    # While this can be a risky assumption, it saves a lot of
                    # time, since combinations can contain as many as 10000
                    # files. If a combination is stopped in the middle of
                    # generating a large number of files, the restart_
                    # incomplete_combination() method can be used to ensure the
                    # combination gets completed without taking the time to
                    # check each file's existence here.
                    first_of_n_blobs = '{0:s}{1:s}.{2:s}'.format(
                        destination_path,
                        file_string,
                        extension,
                    )
                    if not storage.Blob(
                            bucket=self.bucket,
                            name=first_of_n_blobs,
                    ).exists(self.gcs_client):
                        # If the first file in the combination doesn't exist,
                        # run copy_blobs() to create each file in the
                        # combination.
                        start_num = 1
                        self.copy_blobs(
                            file1_blob_name,
                            destination_path,
                            extension,
                            start_num,
                            num_files,
                        )
                    else:
                        # Otherwise, skip creating the first file and all
                        # subsequent files in the combination.
                        logging.info(skip_message.format(first_of_n_blobs))
