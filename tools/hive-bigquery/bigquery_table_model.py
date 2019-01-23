"""Module to wrap BigQuery table as a model"""

import json
import logging
import os
from collections import OrderedDict

from properties_reader import PropertiesReader

logger = logging.getLogger('Hive2BigQuery')


class BigQueryTableModel(object):
    """Wrapper for resource describing a BigQuery table

    Bundles information of how Hive table will be considered when migrated to
    BigQuery, such as partitioning and clustering fields

    Attributes:
        table_details: BigQuery table details such as dataset id, table name,
            partition column name of the table(if any), list of clustering
            columns names(if any applicable) upto a maximum of 4 values
        data_format: Format of the data to be loaded from GCS, which can be
            one of Avro, ORC, and Parquet
        flat_schema: Flattened schema of the table
    """

    def __init__(self, **kwargs):
        logger.info('Initializing BigQueryTableModel object')
        self._table_details = kwargs['table_details']
        self.data_format = kwargs['data_format']
        self._flat_schema = None

    def __str__(self):
        """Iterates over the attributes dictionary of BigQueryTableModel
        object and returns a string which contains all the attribute values"""

        model = 'BigQuery Table Model\n'
        for key, value in self.__dict__.iteritems():
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
            os.system(
                'bq show --format=prettyjson {0}.{1} > bq_schema.json'.format(
                    self.dataset_id, self.table_name))
            with open('bq_schema.json', 'rb') as file_content:
                schema = json.load(file_content)
            os.remove('bq_schema.json')
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
        """Returns BigQuery table schema in flat structure

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
        Uses string extraction to flatten the schema"""

        def recursively_flatten(schema, col_name):
            """Iterates through the nested fields and gets the data types

            Args:
                schema (List[dict]): schema of the BigQuery fields
                col_name (str): Flattened column name
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
            for key in flat_schema.keys():
                find_string = '__bag__array_element'
                try:
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

                except KeyError:
                    pass

            for key in flat_schema.keys():
                value = flat_schema[key]
                if '__bag__array_element' in key:
                    flat_schema[key.replace('__bag__array_element', '')] = value
                    flat_schema.pop(key, None)
                if '__map__key' in key:
                    flat_schema[key.replace('__map__key', '__key')] = value
                    flat_schema.pop(key, None)
                if '__map__value' in key:
                    flat_schema[key.replace('__map__value', '__value')] = value
                    flat_schema.pop(key, None)

        return flat_schema
