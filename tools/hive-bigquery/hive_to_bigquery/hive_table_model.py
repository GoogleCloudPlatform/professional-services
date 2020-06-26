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
"""Module to wrap Hive table as a model."""

import logging
from collections import OrderedDict
from uuid import uuid4
import hashlib

logger = logging.getLogger('Hive2BigQuery')


class HiveTableModel(object):
    """Wrapper for resource describing a Hive table.

    Bundles information of different properties of the source Hive table such
    as schema, location of the table, input format, partition column etc.

    Attributes:
        table_details (dict): Hive table details such as database name,
            table name, schema, input format of the table, partition
            information and a boolean indicating whether the table data format
            is supported by BigQuery.
        inc_col_details (dict): Incremental column(if any) and it's data type.
        destination_details (dict): Dictionary containing destination data
            format of BigQuery, one of [Avro,ORC,Parquet] and BigQuery table name.
        create_statement (str): CREATE TABLE statement for Hive staging table.
        tracking_table_name (str): Cloud SQL tracking table name.
        is_first_run (boolean): A boolean indicating whether the table is being
            migrated for the first time.
        flat_schema (dict): Flattened schema of the table.
    """
    def __init__(self, **kwargs):

        logger.debug('Initializing HiveTableModel Object')

        self._table_details = kwargs['table_details']
        self._inc_col_details = {
            "name": kwargs['inc_col'],
            "type": None,
            "options": kwargs['inc_col_options']
        }
        self._destination_details = {
            "data_format": kwargs['destination_data_format'],
            "bq_table": kwargs['bq_table_name']
        }
        self.create_statement = kwargs['create_statement']
        encode_string = "{}_{}_{}".format(
            self.db_name, self.table_name,
            self._destination_details['bq_table'])
        self._tracking_table_name = "hive_bq_" + hashlib.md5(
            encode_string.encode('utf-8')).hexdigest()
        self._is_first_run = True
        self._flat_schema = None

    def __str__(self):
        """Iterates over the attributes dictionary of HiveTableModel object
        and returns a string which contains all the attribute values."""

        model = 'Hive Table Model\n'
        for key, value in self.__dict__.items():
            model += key + ' : ' + str(value) + '\n'
        return model

    @property
    def db_name(self):
        return self._table_details['database_name']

    @property
    def table_name(self):
        return self._table_details['table_name']

    @property
    def schema(self):
        return self._table_details['schema']

    @property
    def input_format(self):
        return self._table_details['input_format']

    @property
    def partition_info(self):
        return self._table_details['partition_info']

    @property
    def is_table_type_supported(self):
        return self._table_details['is_table_type_supported']

    @property
    def n_cols(self):
        return len(self.schema)

    @property
    def is_partitioned(self):
        if self._table_details['partition_info']:
            return True
        return False

    @property
    def flat_schema(self):
        if self._flat_schema is None:
            self._flat_schema = self.flatten_schema()
        return self._flat_schema

    @property
    def is_inc_col_present(self):
        if self._inc_col_details['name']:
            return 1
        return 0

    # @is_inc_col_present.setter
    # def is_inc_col_present(self, value):
    #     logger.debug("Setting value is_inc_col_present to %s", value)
    #     if value in [True, False]:
    #         self._inc_col_details['type'] = value
    #     else:
    #         logger.debug(
    #             "Can't set is_inc_col_present to other than True/False")

    @property
    def inc_col(self):
        return self._inc_col_details['name']

    @inc_col.setter
    def inc_col(self, value):
        logger.debug("Setting value inc_col to %s", value)
        self._inc_col_details['name'] = value

    @property
    def inc_col_type(self):
        return self._inc_col_details['type']

    @inc_col_type.setter
    def inc_col_type(self, value):
        logger.debug("Setting value inc_col_type to %s", value)
        self._inc_col_details['type'] = value

    @property
    def int_type_col(self):
        return self._inc_col_details['options']['int']

    @property
    def timestamp_type_col(self):
        return self._inc_col_details['options']['timestamp']

    @property
    def staging_table_name(self):
        return 'stage__{}__{}'.format(self.table_name,
                                      str(uuid4()).replace("-", "_"))

    @property
    def destination_data_format(self):
        return self._destination_details['data_format']

    @property
    def bq_table_name(self):
        return self._destination_details['bq_table']

    @property
    def tracking_table_name(self):
        return self._tracking_table_name

    @tracking_table_name.setter
    def tracking_table_name(self, value):
        logger.debug("Setting value tracking_table_name to %s", value)
        self._tracking_table_name = value

    @property
    def is_first_run(self):
        return self._is_first_run

    @is_first_run.setter
    def is_first_run(self, value):
        logger.debug("Setting value is_first_run to %s", value)
        if value in [True, False]:
            self._is_first_run = value
        else:
            logger.debug("Can't set is_first_run to other than True/False")

    def flatten_schema(self):
        """Returns Hive table schema in flat structure.

        Nested data types in Hive schema are represented using '<'. For
        example, array of integers is represented as 'array<int>'. Similarly,
        maps and structs are represented too. To compare the data types in
        Hive and BigQuery, this schema needs to be flattened out and then the
        internal data type can be compared.

        For example col_name(map<string,array<int>>) in Hive is flattened as
        {
            "col_name"          : "map",
            "col_name__key"     : "string",
            "col_name__value"   : "array_int"
        }
        Uses string extraction to flatten the schema.

        Returns:
            dict: A dictionary mapping flattened columns and their data types.
        """
        def recursively_flatten(name, item_type):
            """Iterates through the nested fields and gets the data types.

            Args:
                name (str): Flattened column name.
                item_type (str): Flattened column type.
            """
            columns.append(name)
            if '<' in item_type:
                col_type = item_type.split('<')[0]
                # If type is array, recursively flatten the nested structure.
                if col_type == 'array':
                    col_types.append('array')
                    recursively_flatten(
                        name, '<'.join(item_type.split('<')[1:])[:-1])
                # If type is map, recursively flatten the value in the map.
                elif col_type == 'map':
                    col_types.append('map')
                    columns.append(name + '__key')
                    col_types.append('string')

                    recursively_flatten(
                        name + '__value', ','.join('<'.join(
                            item_type.split('<')[1:])[:-1].split(',')[1:]))

                elif col_type == "uniontype":
                    col_types.append('union')
                # If type is struct, recursively flatten all the fields inside.
                elif col_type == 'struct':
                    col_types.append('struct')
                    struct_info = '<'.join(item_type.split('<')[1:])[:-1]
                    rand = []
                    struct_split = struct_info.split(',')
                    for i, struct_item in enumerate(struct_split):
                        if struct_item.count('<') == struct_item.count('>'):
                            rand.append(struct_item)
                        else:
                            struct_split[i + 1] = struct_item + ',' + \
                                                  struct_split[i + 1]
                    for item in rand:
                        recursively_flatten(name + '__' + item.split(':')[0],
                                            ':'.join(item.split(':')[1:]))

            else:
                col_types.append(item_type)

        columns = []
        col_types = []
        for name, col_type in self.schema.items():
            recursively_flatten(name, col_type)

        list_tuple = zip(columns, col_types)
        col_dict = OrderedDict()

        for item in list_tuple:
            if item[0] in col_dict.keys():
                col_dict[str(item[0])].append(str(item[1]))
            else:
                col_dict[str(item[0])] = [str(item[1])]

        for key, value in col_dict.items():
            if len(value) >= 2:
                collapse_string = "array_" * value.count('array') + \
                                  [item for item in value if item != 'array'][0]
                col_dict[key] = collapse_string
            else:
                col_dict[key] = value[0]

        for key, value in col_dict.items():
            if 'decimal' in value:
                col_dict[key] = 'decimal'
            elif 'varchar' in value:
                col_dict[key] = 'varchar'
            elif 'char' in value:
                col_dict[key] = 'char'

        return col_dict
