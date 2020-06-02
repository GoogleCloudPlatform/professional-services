# Copyright 2019 Google Inc.
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#     http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.
"""Module to decide on the properties of the BigQuery table to be created"""

import logging

from hive_to_bigquery.bigquery_table_model import BigQueryTableModel

logger = logging.getLogger('Hive2BigQuery')


class BigQueryTable(object):
    """Class to decide on how the Hive table should be translated in BigQuery.

    Gets information of the Hive table from the HiveTableModel class and
    decides on the BigQuery table properties such as whether the table should
    be partitioned, partition column if any, whether the table should be
    clustered, clustering columns if any etc. and initialize the
    BigQueryTableModel wrapper class.

    Attributes:
        dataset_id (str): BigQuery dataset ID.
        table_name (str): BigQuery table name.
        bq_table_model (bigquery_table_model.BigQueryTableModel): Instance of
            BigQueryTableModel which contains the BigQuery table details.

    """
    def __init__(self, dataset_id, table_name, hive_table_model):

        logger.debug('Initializing BigQueryTable object')
        self._dataset_id = dataset_id
        self._table_name = table_name
        self.bq_table_model = self.initialize_bq_table_model(hive_table_model)

    @property
    def dataset_id(self):
        return self._dataset_id

    @property
    def table_name(self):
        return self._table_name

    def initialize_bq_table_model(self, hive_table_model):
        """Generates information about how BigQuery considers the Hive table.

        Args:
            hive_table_model (:class:`HiveTableModel`): Wrapper to Hive table
                details.

        Returns:
            BigQueryTableModel: Wrapper to BigQuery table details.
        """

        # Allowed data types in Hive for clustering in BigQuery.
        hive_allowed_types = [
            'tinyint', 'smallint', 'int', 'bigint', 'decimal', 'char',
            'varchar', 'string', 'timestamp', 'date', 'boolean'
        ]
        # Sets to default values.
        partition_column = None
        clustering_columns = list()

        # Finds if there are any partition columns present of type
        # timestamp/date in the Hive table.
        for name, col_type in hive_table_model.partition_info.items():
            if col_type == "timestamp" or col_type == "date":
                partition_column = name
                break

        # Gets a list of clustering columns, if any applicable.
        if partition_column is not None:
            for name, col_type in hive_table_model.partition_info.items():
                if (col_type in hive_allowed_types
                        and name != partition_column):
                    clustering_columns.append(name)

        bq_table_model = BigQueryTableModel(
            table_details={
                "dataset_id": self.dataset_id,
                "table_name": self.table_name,
                "schema": None,
                "partition_column": partition_column,
                "clustering_columns": clustering_columns[:4]
            },
            data_format=hive_table_model.destination_data_format)

        return bq_table_model
