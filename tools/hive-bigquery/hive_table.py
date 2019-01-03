"""Module to check properties of the Hive table"""

import json
import logging
from collections import OrderedDict

from hive_table_model import HiveTableModel

logger = logging.getLogger('Hive2BigQuery')


class HiveTable(object):
    """Class to get information on the source Hive table

    Runs the descriptive 'DESCRIBE EXTENDED' query on the Hive table and
    fetches details of the Hive table such as schema, columns and their data
    types, partition columns, input format of the table, location of the data
    etc. and initializes the HiveTableModel class

    Attributes:
        database_name: Hive database name
        table_name: Hive Table name
        hive_table_model: Instance of HiveTableModel which contains the Hive
            table details
    """

    def __init__(self, hive_component, database_name, table_name,
                 incremental_col):

        logger.debug('Initializing HiveTable object')
        self._database_name = database_name
        self._table_name = table_name
        self.hive_table_model = self.initialize_hive_table_model(
            hive_component, incremental_col)

    @property
    def database_name(self):
        return self._database_name

    @property
    def table_name(self):
        return self._table_name

    def initialize_hive_table_model(self, hive_component, incremental_col):
        """Fetches details of the Hive table by executing describe query

        Args:
            hive_component (:class:`HiveComponent`): Instance of
                HiveComponent to connect to Hive
            incremental_col (str): Incremental column name either provided or
                obtained from the tracking table
        Returns:
            HiveTableModel: Wrapper to Hive table details
        """

        # Executes DESCRIBE EXTENDED <table_name> query
        queries = ["set hive.ddl.output.format=json",
                   "desc extended %s.%s" % (self.database_name, self.table_name)]
        results = json.loads(hive_component.execute_query(queries)[0][0])

        # Gets columns information
        schema = OrderedDict()
        for item in results['columns']:
            schema[str(item['name'])] = str(item['type'])

        # Input format of the data
        input_format = str(results['tableInfo']['sd']['inputFormat']).lower()

        logger.debug('Extracted information about Hive table columns')

        # Checks whether loading the data in same format is supported in
        # BigQuery
        # Avro, ORC, and Parquet formats are supported directly in BigQuery
        if "avro" in input_format:
            destination_data_format = "Avro"
            is_table_type_supported = True
        elif "orc" in input_format:
            destination_data_format = "ORC"
            is_table_type_supported = True
        elif "parquet" in input_format:
            destination_data_format = "Parquet"
            is_table_type_supported = True
        else:
            destination_data_format = "Avro"
            is_table_type_supported = False

        # Gets information of partition columns
        partition_info = OrderedDict()
        for item in results['tableInfo']['partitionKeys']:
            partition_info[str(item['name'])] = str(item['type'])
        logger.debug('Extracted information about Hive table partition columns')

        # Fetches column names of integer/timestamp/date types
        int_type_col = []
        timestamp_type_col = []

        for item in schema.keys():
            if item in partition_info.keys():
                pass
            else:
                if schema[item] in ["tinyint", "smallint", "int", "bigint"]:
                    int_type_col.append(item)
                elif schema[item] in ["timestamp", "date"]:
                    timestamp_type_col.append(item)
                else:
                    pass

        # CREATE TABLE statement for the Hive staging table
        create_statement = "CREATE TABLE default.TABLE_NAME_HERE ("
        create_statement += ','.join(
            "{} {}".format(key, value) for key, value in schema.iteritems())
        create_statement += ") STORED AS " + destination_data_format
        logger.debug('Formed Hive stage table CREATE TABLE statement')

        # Initializes HiveTableModel
        hive_table_model = HiveTableModel(
            table_details={
                "database_name": self.database_name,
                "table_name": self.table_name,
                "schema": schema,
                "input_format": input_format,
                "partition_info": partition_info,
                "is_table_type_supported": is_table_type_supported,
            },
            inc_col=incremental_col,
            inc_col_options={
                "int": int_type_col,
                "timestamp": timestamp_type_col},
            destination_data_format=destination_data_format,
            create_statement=create_statement)

        return hive_table_model
