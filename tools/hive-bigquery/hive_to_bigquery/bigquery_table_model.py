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
"""Module to wrap BigQuery table as a model"""

import json
import logging
import os
from collections import OrderedDict
from uuid import uuid4

from hive_to_bigquery.properties_reader import PropertiesReader

logger = logging.getLogger('Hive2BigQuery')


class BigQueryTableModel(object):
    """Wrapper for resource describing a BigQuery table.

    Bundles information of how Hive table will be considered when migrated to
    BigQuery, such as partitioning and clustering fields.

    Attributes:
        table_details (dict): BigQuery table details such as dataset id, table name,
            partition column name of the table(if any), list of clustering
            columns names(if any applicable) upto a maximum of 4 values.
        data_format (str): Format of the data to be loaded from GCS, which can be
            one of Avro, ORC, and Parquet.
        flat_schema (dict): Flattened schema of the table.
    """
    def __init__(self, **kwargs):
        logger.debug('Initializing BigQueryTableModel object')
        self._table_details = kwargs['table_details']
        self.data_format = kwargs['data_format']
        self._flat_schema = None

    def __str__(self):
        """Iterates over the attributes dictionary of BigQueryTableModel
        object and returns a string which contains all the attribute values."""

        model = 'BigQuery Table Model\n'
        for key, value in self.__dict__.items():
            model += key + ' : ' + str(value) + '\n'
        return model

    @property
    def dataset_id(self):
        return self._table_details['dataset_id']

    @property
    def table_name(self):
        return self._table_details['table_name']

    @property
    def schema(self):
        if self._table_details['schema'] is None:
            filename = 'bq_schema_{}.json'.format(uuid4())
            os.system('bq show --format=prettyjson {0}.{1} > {2}'.format(
                self.dataset_id, self.table_name, filename))
            with open(filename, 'r') as file_content:
                schema = json.load(file_content)
            os.remove(filename)
            self._table_details['schema'] = schema['schema']['fields']
        return self._table_details['schema']

    @property
    def partition_column(self):
        return self._table_details['partition_column']

    @property
    def clustering_columns(self):
        return self._table_details['clustering_columns']

    @property
    def n_cols(self):
        return len(self.schema)

    @property
    def is_partitioned(self):
        if self.partition_column:
            return True
        return False

    @property
    def is_clustered(self):
        if PropertiesReader.get('use_clustering') and self.clustering_columns:
            return True
        return False

    @property
    def flat_schema(self):
        if self._flat_schema is None:
            self._flat_schema = self.flatten_schema()
        return self._flat_schema

    def flatten_schema(self):
        """Returns BigQuery table schema in flat structure.

        Nested data types in BigQuery schema are represented using nested
        fields.
        For example, map column col_name(map<string,int>) is represented as
        {
            "fields": [
            {
                "mode": "REQUIRED",
                "name": "key",
                "type": "STRING"
            },
            {
                "mode": "NULLABLE",
                "name": "value",
                "type": "INTEGER"
            }
            ],
            "mode": "REPEATED",
            "name": "col_name",
            "type": "RECORD"
        }
        To compare the data types in Hive and BigQuery, the schema needs to
        be flattened and then the data types can be compared.

        For example the above will be flattened as
        {
            "col_name"          : "RECORD_REPEATED",
            "col_name__key"     : "STRING",
            "col_name__value"   : "INTEGER"
        }
        Uses string extraction to flatten the schema."""
        def recursively_flatten(schema, col_name):
            """Iterates through the nested fields and gets the data types.

            Args:
                schema (List[dict]): schema of the BigQuery fields.
                col_name (str): Flattened column name.
            """
            for item in schema:
                name = col_name + item['name']
                if item['mode'] == 'REPEATED':
                    col_type = item['type'] + '_' + item['mode']
                else:
                    col_type = item['type']

                flat_schema[name] = col_type

                if "RECORD" in col_type:
                    recursively_flatten(item['fields'], name + '__')

        flat_schema = OrderedDict()
        recursively_flatten(self.schema, '')

        if self.data_format == "Parquet":
            match_keys = []
            for key in flat_schema.keys():
                if key.endswith('__bag__array_element'):
                    match_keys.append(key)
                if key.endswith('__map'):
                    match_keys.append(key)
            for key in match_keys:
                find_string = '__bag__array_element'
                value = flat_schema[key]
                if key.endswith(find_string):
                    flat_schema.pop(key, None)
                    flat_schema.pop(key[:-len('__array_element')], None)

                    flat_schema[key[:-len(find_string)]] = value
                    if not value.endswith('_REPEATED'):
                        flat_schema[key[:-len(find_string)]] += '_REPEATED'
                if key.endswith('__map'):
                    flat_schema.pop(key, None)
                    flat_schema[key[:-len('__map')]] = value

            for key in flat_schema.keys():
                value = flat_schema[key]
                if '__bag__array_element' in key:
                    flat_schema[key.replace('__bag__array_element',
                                            '')] = value
                    flat_schema.pop(key, None)
                if '__map__key' in key:
                    flat_schema[key.replace('__map__key', '__key')] = value
                    flat_schema.pop(key, None)
                if '__map__value' in key:
                    flat_schema[key.replace('__map__value', '__value')] = value
                    flat_schema.pop(key, None)

        return flat_schema
