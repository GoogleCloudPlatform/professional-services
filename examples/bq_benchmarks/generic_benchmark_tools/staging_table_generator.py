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
import os

from google.cloud import bigquery

MB_IN_GB = 1000
KB_IN_GB = 1000000
BYTES_IN_GB = 1000000000


class StagingTableGenerator(object):
    """Generating staging tables in BigQuery of particular sizes that can later
        be extracted into files.

    Utilizes the Dataflow Data Generator tool from the PSO library. Uses the
    dataflow_data_generator module to create staging tables using the columnType
    and numColumn parameters, and then the bq_table_resizer module to create r
    resized staging tables with the targetDataSizes parameter.

    Attributes:
         project(str): ID of the project that holds the staging tables and
            resized staging tables.
         staging_dataset_id(str): ID of the dataset that holds the staging
            tables.
         resized_dataset_id(str): ID of the dataset that holds the
            resized staging tables.
         json_schema_path(str): Directory that holds the json schemas used
            to create the staging tables.

    """

    def __init__(self, project, staging_dataset_id, resized_dataset_id,
                 json_schema_path, file_params, num_rows):
        self.bq_client = bigquery.Client()
        self.project = project
        self.staging_dataset_id = staging_dataset_id
        self.resized_dataset_id = resized_dataset_id
        self.json_schema_path = json_schema_path
        self.file_params = file_params
        self.num_rows = num_rows

    def create_staging_tables(
            self,
            dataflow_staging_location,
            dataflow_temp_location,
    ):
        """Creates staging tables using the columnType and numColumn parameters.

        Utilizes the data_generator_pipeline module from the Dataflow Data
        Generator tool to create staging tables. Names of schema combinations
        are created using the columnTypes and numColumn parameters. Then the
        schema names are used to obtain json schemas from the provided
        self.json_schema_path, which are then fed into to data generator
        pipeline to create staging tables.

        Args:
            dataflow_staging_location(str): GCS staging path.
            dataflow_temp_location(str): GCS temp path.
        """

        def _create_table(table_details):

            column_type, num_column = table_details
            schema_name = '{0:s}_{1:d}'.format(column_type, num_column)
            logging.info(
                'Creating staging table for schema: {0:s}'.format(schema_name))
            command = ('python {0:s}/data_generator_pipeline.py '
                       '--schema_file={1:s}/{2:s}.json '
                       '--num_records={3:d} '
                       '--output_bq_table={4:s}:{5:s}.{2:s} '
                       '--project={4:s} '
                       '--setup_file={0:s}/setup.py '
                       '--staging_location={6:s} '
                       '--temp_location={7:s} '
                       '--save_main_session '
                       '--worker_machine_type=n1-highcpu-32 '
                       '--runner=DataflowRunner ').format(
                           data_gen_path,
                           self.json_schema_path,
                           schema_name,
                           self.num_rows,
                           self.project,
                           self.staging_dataset_id,
                           dataflow_staging_location,
                           dataflow_temp_location,
                       )
            os.system(command)

        column_types = self.file_params['columnTypes']
        num_columns = self.file_params['numColumns']
        abs_path = os.path.abspath(os.path.dirname(__file__))
        data_gen_path = os.path.join(
            abs_path, '../../dataflow-data-generator/data-generator-pipeline')
        with ThreadPoolExecutor() as p:
            p.map(_create_table, itertools.product(column_types, num_columns))

    def create_resized_tables(self):
        """Creates resized staging tables using the targetDataSizes parameters.

        Utilizes the bq_table_resizer module from the Dataflow Data
        Generator tool to create resized staging tables.

        """
        staging_dataset_ref = self.bq_client.dataset(self.staging_dataset_id)
        staging_dataset = bigquery.Dataset(staging_dataset_ref)
        sizes = self.file_params['targetDataSizes']
        sizes.sort()
        abs_path = os.path.abspath(os.path.dirname(__file__))
        bq_resizer_path = os.path.join(
            abs_path, '../../dataflow-data-generator/bigquery-scripts')
        # Gather staging tables that were created in
        # self.create_staging_tables()
        tables = list(self.bq_client.list_tables(staging_dataset))
        for table in tables:
            for i in range(0, len(sizes)):
                # If the size of the current iteration is the smallest size
                # in the sizes list, use the corresponding staging table
                # created in create_resized_table() as the source base table.
                # Otherwise, if the file size of the current iteration is
                # greater than the last iteration, use the resized table from
                # the previous iteration as the source base table when running
                # so that each table can take advantage of the size of the last.
                size = sizes[i]
                if size > sizes[i - 1]:
                    base = sizes[i - 1]
                    source_table = get_resized_table_name(table.table_id, base)
                    source_dataset = self.resized_dataset_id
                else:
                    source_table = table.table_id
                    source_dataset = self.staging_dataset_id

                destination_table = get_resized_table_name(table.table_id, size)
                target_gb = size
                command_str = ('python {0:s}/bq_table_resizer.py '
                               '--project {1:s} '
                               '--source_dataset {2:s} '
                               '--source_table {3:s} '
                               '--destination_dataset {4:s} '
                               '--destination_table {5:s} '
                               '--target_gb {6:f} ')
                command = command_str.format(
                    bq_resizer_path,
                    self.project,
                    source_dataset,
                    source_table,
                    self.resized_dataset_id,
                    destination_table,
                    target_gb,
                )
                os.system(command)
                logging.info(
                    'Created resized table from {0:s}'.format(source_table))
                logging.info(
                    'Resized table complete: {0:s}'.format(destination_table))


def get_resized_table_name(table_id, size):
    """Creates a name for resized tables.

    Ensures that the file size in the resized staging table name is greater
    than 1, since BiqQuery tables names can not have '.' characters.

    Args:
        table_id(str): Name of the staging table used to generate the
            resized staging table.
        size(float): Size of the resized staging table in GB.

    Returns:
        The name of the resized staging table containing a size and unit
        without decimals in a string format. For example, if the provided
        table_id was 100_STRING_10 and the provided size was .01, the returned
        name would be 100_STRING_10_10MB.
    """
    if size >= 1:
        label_size = size
        label_unit = 'GB'
    elif size >= .001:
        label_size = int(size * MB_IN_GB)
        label_unit = 'MB'
    elif size >= .000001:
        label_size = int(size * KB_IN_GB)
        label_unit = 'KB'
    else:
        label_size = int(size * BYTES_IN_GB)
        label_unit = 'B'

    return '{0:s}_{1:d}{2:s}'.format(table_id, label_size, label_unit)
