# Copyright 2019 Google LLC.
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

"""Main module orchestrating the generation of the training and validation datasets

Example use:
    # Create a test DataPreparator configuration with the BigQuery source table, BigQuery
    # destination dataset and the GCS destination path.
    class Params():
        __dict__ = {}
    config = Params()
    config.source_project = 'analytics_project_id'
    config.source_dataset = 'analytics_dataset'
    config.source_table = 'analytics_table'
    config.destination_project = 'ml_project_id'
    config.destination_dataset = 'ml_dataset'
    config.destination_gcs_path = 'gs://ml_datasets'
    config.split_ratio = 0.75
    config.all_columns = {
        'feature_columns': ['age', 'status'],
        'target_columns_shuffle': ['income'],
        'target_columns_export': ['income']
    }

    # Create a DataPreparator object with a given configuration
    data_preparator = bigquery.DataPreparator()

    # Generate training and validation data from the BigQuery source table
    dataprep.extract_all_ml_datasets()
"""
from __future__ import absolute_import
from __future__ import print_function

import datetime
import logging
from google.cloud.exceptions import GoogleCloudError
from ml_dataprep import bqclient
from ml_dataprep import exceptions
from ml_dataprep import queries


TIMESTAMP_FORMAT = '%Y%m%d%H%M%S'
TRAINING_DATASET = 'training'
VALIDATION_DATASET = 'validation'
TEMP_TABLE_SUFFIX = 'temp'
COLUMNS_SEPARATOR = ','
ERR_CALCULATE_DATASET_SIZE = 1
ERR_CREATE_TEMP_TABLE = 2
ERR_GENERATE_ML_DATASET = 3

class DataPreparator:
    """Data preparation class.

    Generates training and validation ML datasets from a BigQuery table.

    Attributes:
        _source_project: GCP project id containing the source BigQuery dataset.
        _source_dataset: BigQuery dataset source dataset containing the source table.
        _source_table: BigQuery table containing all the data for the ML model.
        _destination_project: GCP project id containing the destination BQ dataset.
        _destination_dataset: BigQuery destination dataset hosting the tables.
        containing the training and validation datasets.
        _destination_gcs_path: Cloud Storage path hosting the files containing the
        training and validation datasets.
        _split_ratio: The percentage of the source data (in number of rows) to be
        exported as training data. The rest is exported as validation data.
        _column_parameters: The parameters to generate dynamic column names.
        _bq_client: BigQuery client.
        _source_table_uri: Fully qualified name of the source BigQuery table.
        _columns: Feature columns to be used in the SQL extraction statements.
        _target_columns_shuffle: Target columns to be used in the SQL statement
        to generate the shuffled temporary table.
        _target_columns_export: Target columns to be used in the SQL statements to
        generate the training and validation datasets.
    """

    def __init__(self, config):
        """Initialize all class attributes from the input configuration.

        Args:
            config: an object containg all configuration parameters for the
            data extraction
        """
        self._source_project = config.source_project
        self._source_dataset = config.source_dataset
        self._source_table = config.source_table
        self._destination_project = config.destination_project
        self._destination_dataset = config.destination_dataset
        self._destination_gcs_path = config.destination_gcs_path
        self._split_ratio = config.split_ratio
        self._column_parameters = [] if config.parameters is None else config.parameters
        self._bq_client = bqclient.BqClient(key_file=config.key_file)
        self._source_table_uri = self._bq_client.build_table_uri(self._source_project,
                                                                 self._source_dataset,
                                                                 self._source_table)
        self._columns, self._target_columns_shuffle, self._target_columns_export =\
            self._build_columns(config.all_columns)

    def _build_columns(self, columns_config):
        """Create columns to be used in the data extraction SQL statements."""
        columns = COLUMNS_SEPARATOR.join(
            [x.format(*self._column_parameters) for x in columns_config['feature_columns']])
        target_columns_shuffle = COLUMNS_SEPARATOR.join(
            [x.format(*self._column_parameters) for x in columns_config['target_columns_shuffle']])
        target_columns_export = COLUMNS_SEPARATOR.join(
            [x.format(*self._column_parameters) for x in columns_config['target_columns_export']])
        return columns, target_columns_shuffle, target_columns_export

    def _build_destination_table(self, timestamp, suffix):
        """Create the name of a destination table based on the source table."""
        table_id = '{}_{}_{}'.format(self._source_table,
                                     suffix,
                                     timestamp)
        table_uri = self._bq_client.build_table_uri(self._destination_project,
                                                    self._destination_dataset,
                                                    table_id)
        return table_id, table_uri

    def _calculate_dataset_sizes(self):
        """Calculate the size of the training and validation datasets."""
        try:
            total_lines = self._bq_client.count_lines_in_table(self._source_project,
                                                               self._source_dataset,
                                                               self._source_table)
            split_index = int(self._split_ratio * total_lines)
            return total_lines, split_index
        except GoogleCloudError as gcp_exception:
            raise exceptions.MLDataPrepException(
                'Could not count lines in table {}'.format(self._source_table),
                ERR_CREATE_TEMP_TABLE,
                gcp_exception)

    def _create_temp_table(self, timestamp, total_lines):
        """Save in a temporary table the data in the source table shuffled."""
        _, temp_table_uri = self._build_destination_table(timestamp, TEMP_TABLE_SUFFIX)
        try:
            logging.info('Creating temporary table %s', temp_table_uri)
            query = queries.QUERY_TEMP_DATA_TEMPLATE.format(
                temp_table=temp_table_uri,
                feature_columns=self._columns,
                target_columns_shuffle=self._target_columns_shuffle,
                source_table=self._source_table_uri,
                total_lines=total_lines)
            self._bq_client.run_query(query)
            return temp_table_uri
        except GoogleCloudError as gcp_exception:
            raise exceptions.MLDataPrepException(
                'Could not create table {}'.format(temp_table_uri),
                ERR_CALCULATE_DATASET_SIZE,
                gcp_exception)

    def _build_gcs_destination_uri(self, timestamp, ml_dataset):
        """Create the complete GCS path to a CSV file containing a ML dataset."""
        return '{}/{}_{}/{}_*.csv'.format(self._destination_gcs_path,
                                          self._source_table,
                                          timestamp,
                                          ml_dataset)

    def _extract_ml_dataset(self, ml_dataset, temp_table_uri, timestamp, split_index):
        """Extract to Cloud Storage the training or the validation dataset."""
        table_id, table_uri = self._build_destination_table(
            timestamp, ml_dataset)
        logging.info('Exporting %s dataset to the table %s', ml_dataset, table_uri)
        try:
            query_template = queries.QUERY_TRAINING_DATA_TEMPLATE\
                if ml_dataset == TRAINING_DATASET else queries.QUERY_VALIDATION_DATA_TEMPLATE
            query = query_template.format(destination_table=table_uri,
                                          feature_columns=self._columns,
                                          target_columns_export=self._target_columns_export,
                                          temp_table=temp_table_uri,
                                          split_index=split_index)
            self._bq_client.run_query(query)
            destination_uri = self._build_gcs_destination_uri(
                timestamp, ml_dataset)
            logging.info('Exporting %s dataset to the GCS location %s', ml_dataset, destination_uri)
            self._bq_client.export_table_as_csv(self._destination_project,
                                                self._destination_dataset,
                                                table_id,
                                                destination_uri)
        except GoogleCloudError as gcp_exception:
            raise exceptions.MLDataPrepException(
                'Could not generate {} dataset'.format(ml_dataset),
                ERR_GENERATE_ML_DATASET,
                gcp_exception)

    def _extract_training_dataset(self, temp_table_uri, timestamp, split_index):
        """"Extract the training dataset from the shuffled temporary table. """
        self._extract_ml_dataset(TRAINING_DATASET,
                                 temp_table_uri,
                                 timestamp,
                                 split_index)

    def _extract_validation_dataset(self, temp_table_uri, timestamp, split_index):
        """"Extract the validation dataset from the shuffled temporary table."""
        self._extract_ml_dataset(VALIDATION_DATASET,
                                 temp_table_uri,
                                 timestamp,
                                 split_index)

    def extract_all_ml_datasets(self):
        """Extract the ML training and validation datasets from BigQuery.

        Extract the ML training and validation datasets from BigQuery
        in the following sequence of steps:
            1) Shuffle the source data and save it in a temporary
            table.
            2) Calculate the split index where to separate training and
            validation data.
            3) Extract training and validation data from the temporary
            table into separate BigQuery tables.
            4) Export the training and validation data BigQuery tables
            in CSV format to Cloud Storage.
        """
        temp_table_uri = None
        try:
            total_lines, split_index = self._calculate_dataset_sizes()
            timestamp = datetime.datetime.today().strftime(TIMESTAMP_FORMAT)
            temp_table_uri = self._create_temp_table(timestamp, total_lines)
            self._extract_training_dataset(
                temp_table_uri, timestamp, split_index)
            self._extract_validation_dataset(
                temp_table_uri, timestamp, split_index)
        except exceptions.MLDataPrepException as dataprep_exception:
            logging.error(dataprep_exception)
            if dataprep_exception.code <= ERR_CREATE_TEMP_TABLE:
                # Don't need to execute finally block, temp table not created
                return
        finally:
            if temp_table_uri is not None:
                logging.info('Deleting temporary table %s', temp_table_uri)
                self._bq_client.delete_table(temp_table_uri)
