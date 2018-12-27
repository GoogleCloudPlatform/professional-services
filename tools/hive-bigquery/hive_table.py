"""Module to check properties of the Hive table"""

import json
import logging

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
        self.database_name = database_name
        self.table_name = table_name
        self.hive_table_model = self.initialize_hive_table_model(
            hive_component, incremental_col)

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
        cursor = hive_component.get_cursor()
        cursor.execute("set hive.ddl.output.format=json")
        cursor.execute(
            "desc extended {}.{}".format(self.database_name, self.table_name))
        results = json.loads(cursor.fetchall()[0][0])

        # Hive table schema
        schema = results['columns']

        # Gets columns information
        column_info = {}
        columns = []
        for item in results['tableInfo']['sd']['cols']:
            column_info[str(item['name'])] = str(item['type'])
            columns.append(str(item['name']))

        # Storage location
        location = results['tableInfo']['sd']['location']
        # Input format of the data
        inputformat = results['tableInfo']['sd']['inputFormat']

        logger.debug('Extracted information about Hive table columns')

        # Checks whether loading the data in same format is supported in
        # BigQuery
        # Avro, ORC, and Parquet formats are supported directly in BigQuery
        if "avro" in inputformat.lower():
            destination_data_format = "Avro"
            is_table_type_supported = True
        elif "orc" in inputformat.lower():
            destination_data_format = "ORC"
            is_table_type_supported = True
        elif "parquet" in inputformat.lower():
            destination_data_format = "Parquet"
            is_table_type_supported = True
        else:
            destination_data_format = "Avro"
            is_table_type_supported = False

        # Gets information of partition columns
        partition_info = {}
        partition_columns = []
        for item in results['tableInfo']['partitionKeys']:
            partition_info[str(item['name'])] = str(item['type'])
            partition_columns.append(str(item['name']))

        # Boolean indicating whether the Hive table is partitioned
        is_table_partitioned = False
        if partition_columns:
            is_table_partitioned = True

        logger.debug('Extracted information about Hive table partition columns')

        # Fetches column names of integer/timestamp/date types
        int_type_col = []
        timestamp_type_col = []

        for item in columns:
            if item in partition_columns:
                pass
            else:
                if column_info[item] in ["tinyint", "smallint", "int",
                                         "bigint"]:
                    int_type_col.append(item)
                elif column_info[item] in ["timestamp", "date"]:
                    timestamp_type_col.append(item)
                else:
                    pass

        # CREATE TABLE statement for the Hive staging table
        create_statement = "CREATE TABLE default.TABLE_NAME_HERE ("
        create_statement += ','.join(
            "{} {}".format(col, column_info[col]) for col in columns)
        create_statement += ") STORED AS " + destination_data_format
        logger.debug('Formed Hive stage table CREATE TABLE statement')

        # Initializes HiveTableModel instance
        hive_table_model = HiveTableModel(
            database_name=self.database_name,
            table_name=self.table_name,
            schema=schema,
            column_info=column_info,
            columns=columns,
            n_cols=len(columns),
            location=location,
            inputformat=inputformat,
            partition_info=partition_info,
            partition_columns=partition_columns,
            is_table_partitioned=is_table_partitioned,
            int_type_col=int_type_col,
            timestamp_type_col=timestamp_type_col,
            destination_data_format=destination_data_format,
            is_table_type_supported=is_table_type_supported,
            create_statement=create_statement,
            inc_col=incremental_col)

        return hive_table_model
