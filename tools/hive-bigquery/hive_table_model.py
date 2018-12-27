"""Module to wrap Hive table as a model"""

import logging

logger = logging.getLogger('Hive2BigQuery')


class HiveTableModel:
    """Wrapper for resource describing a Hive table

    Bundles information of different properties of the source Hive table such
    as schema, location of the table, input format, partition column etc.

    Attributes:
        database_name: Hive database name
        table_name: Hive table name
        schema: Hive table schema
        column_info: A dictionary mapping column names to column data types
        columns: List of all the column names
        n_cols: Number of columns
        location: Location of the Hive table where data is stored
        inputformat: Format of the underlying Hive data
        partition_info: A dictionary mapping partition column names to their
            data types
        partition_columns: List of partition column names
        is_table_partitioned: A boolean indicating whether the table is
            partitioned
        int_type_col: List of integer type columns
        timestamp_type_col: List of timestamp/date type columns
        destination_data_format: Destination data format of BigQuery, one of
        [Avro,ORC,Parquet]
        is_table_type_supported: A boolean indicating whether the table data
            format is supported by BigQuery
        create_statement: CREATE TABLE statement for Hive staging table
        inc_col: Incremental column name, if any present/provided
        tracking_table_name: Cloud SQL tracking table name
        is_inc_col_present: A boolean indicating whether an
            incremental column is present
        inc_col_type: Data type of the incremental column
        is_first_run: A boolean indicating whether the table is being
            migrated for the first time
    """

    def __init__(self, **kwargs):

        logger.debug('Initializing HiveTableModel Object')

        self.database_name = kwargs['database_name']
        self.table_name = kwargs['table_name']
        self.schema = kwargs['schema']
        self.column_info = kwargs['column_info']
        self.columns = kwargs['columns']
        self.n_cols = kwargs['n_cols']
        self.location = kwargs['location']
        self.inputformat = kwargs['inputformat']
        self.partition_info = kwargs['partition_info']
        self.partition_columns = kwargs['partition_columns']
        self.is_table_partitioned = kwargs['is_table_partitioned']
        self.int_type_col = kwargs['int_type_col']
        self.timestamp_type_col = kwargs['timestamp_type_col']
        self.destination_data_format = kwargs['destination_data_format']
        self.is_table_type_supported = kwargs['is_table_type_supported']
        self.create_statement = kwargs['create_statement']
        self.inc_col = kwargs['inc_col']
        self.tracking_table_name = kwargs['database_name'] + "_" + \
                                   kwargs['table_name'].lower() + "_inc_"
        self.is_inc_col_present = False
        self.inc_col_type = None
        self.is_first_run = True

    def __str__(self):
        """Iterates over the attributes dictionary of HiveTableModel object
        and returns a string which contains all the attribute values"""

        model = 'Hive Table Model\n'
        for key, value in self.__dict__.iteritems():
            model += key + ' : ' + str(value) + '\n'
        return model

    @property
    def tracking_table_name(self):
        return self.tracking_table_name

    @tracking_table_name.setter
    def tracking_table_name(self, value):
        logger.debug("Setting value tracking_table_name to %s", value)
        self.tracking_table_name = value

    @property
    def is_inc_col_present(self):
        return self.is_inc_col_present

    @is_inc_col_present.setter
    def is_inc_col_present(self, value):
        logger.debug("Setting value is_inc_col_present to %s", value)
        if value in [True, False]:
            self.is_inc_col_present = value
        else:
            logger.debug(
                "Can't set is_inc_col_present to other than True/False")

    @property
    def inc_col(self):
        return self.inc_col

    @inc_col.setter
    def inc_col(self, value):
        logger.debug("Setting value inc_col to %s", value)
        self.inc_col = value

    @property
    def inc_col_type(self):
        return self.inc_col_type

    @inc_col_type.setter
    def inc_col_type(self, value):
        logger.debug("Setting value inc_col_type to %s", value)
        self.inc_col_type = value

    @property
    def is_first_run(self):
        return self.is_first_run

    @is_first_run.setter
    def is_first_run(self, value):
        logger.debug("Setting value is_first_run to %s", value)
        if value in [True, False]:
            self.is_first_run = value
        else:
            logger.debug("Can't set is_first_run to other than True/False")
