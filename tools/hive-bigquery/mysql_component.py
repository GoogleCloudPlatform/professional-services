"""Module to handle MySQL related utilities"""

import logging
import sys

import pymysql

import custom_exceptions
from database_component import DatabaseComponent
from utilities import print_and_log

logger = logging.getLogger('Hive2BigQuery')


class MySQLComponent(DatabaseComponent):
    """MySQL component to handle functions related to it

    Has utilities which perform MySQL operations using the pymysql
    connection, such as creating table, dropping a table, executing a query,
    executing a transaction etc.

    Attributes:
        host: Hostname of the Cloud SQL instance
        user: Username to be used
        password: Password to be used
        database: Database to be connected
        port: Port to be used
        connection: Connection to Cloud SQL instance

    """

    def __init__(self, **kwargs):

        logger.debug("Initializing Cloud SQL Component")
        super(MySQLComponent, self).__init__(**kwargs)

    def __str__(self):
        return "MySQL - Host {0} username {1} database {2} port {3}".format(
            self.host, self.user, self.database, self.port)

    def get_connection(self):
        """Connects to the MySQL database

        Returns:
            pymysql.connections.Connection: pymysql connection object
        """

        logger.debug("Getting MySQL Connection")
        try:
            logger.debug(self)
            connection = pymysql.connect(host=self.host,
                                         user=self.user,
                                         password=self.password,
                                         database=self.database,
                                         port=int(self.port))
            return connection
        except pymysql.err.DatabaseError:
            print_and_log("Failed to establish MySQL connection",
                          logging.CRITICAL)
            raise custom_exceptions.ConnectionError, None, sys.exc_info()[2]

    def get_cursor(self):
        """Gets the cursor object

        Returns:
            pymysql.cursors.Cursor: pymysql cursor object
        """

        logger.debug("Getting cursor")
        cursor = self.connection.cursor()
        return cursor

    def execute_transaction(self, query):
        """Executes a transaction and commits to the database

        Args:
            query (str): Transaction query to be executed
        """

        try:
            cursor = self.get_cursor()
            cursor.execute(query)
            self.connection.commit()
        except pymysql.err.OperationalError:
            print_and_log(
                "Failed to commit transaction {} to Cloud SQL table".format(
                    query))
            self.connection.rollback()
            raise custom_exceptions.MySQLExecutionError, None, sys.exc_info()[2]

    def execute_query(self, query):
        """Executes query and returns the results

        Args:
            query (str): Query to be executed

        Returns:
            List: Results of the query
        """

        cursor = self.get_cursor()
        try:
            cursor.execute(query)
            return cursor.fetchall()
        except pymysql.err.OperationalError:
            print_and_log(
                "Failed in querying Cloud SQL table - {}".format(query))
            raise custom_exceptions.MySQLExecutionError, None, sys.exc_info()[2]

    def drop_table(self, table_name):
        """Drops tracking table

        Args:
            table_name (str): MySQL table name
        """

        cursor = self.get_cursor()
        try:
            cursor.execute("DROP TABLE {}".format(table_name))
            logger.debug("Dropped table %s", table_name)
        except pymysql.err.DatabaseError as error:
            logger.debug("Failed dropping table %s with exception %s ",
                         table_name, error)

    def drop_table_if_empty(self, table_name):
        """Drops tracking table if empty

        Args:
            table_name (str): MySQL table name
        """

        results = self.execute_query("SHOW TABLES")
        for name in results:
            if table_name == name[0]:
                results = self.execute_query(
                    "SELECT COUNT(*) FROM {}".format(table_name))
                n_rows = results[0][0]
                if n_rows == 0:
                    self.drop_table(table_name)
                    print_and_log("Dropped the empty tracking table {}".format(
                        table_name), logging.INFO)

    def verify_tracking_table(self, hive_table_model):
        """Checks whether the tracking table exists

        Checks whether the tracking table exists from the previous migration
        run (if any) and updates the attributes (is_first_run,
        tracking_table_name, is_inc_col_present, inc_col, inc_col_type) of the
        HiveTableModel instance

        Args:
            hive_table_model (:class:`HiveTableModel`): Wrapper to Hive table
                details
        """

        results = self.execute_query("SHOW TABLES")
        for name in results:
            if hive_table_model.tracking_table_name in name[0]:
                hive_table_model.is_first_run = False
                hive_table_model.tracking_table_name = name[0]

                if '_inc_T_' in hive_table_model.tracking_table_name:

                    if '_inc_T_ts_' in hive_table_model.tracking_table_name:
                        # Incremental column is of timestamp/date data type
                        hive_table_model.inc_col_type = "ts"
                        hive_table_model.inc_col = \
                            hive_table_model.tracking_table_name.split(
                                '_inc_T_ts_')[1]

                    else:
                        # Incremental column is of int data type
                        hive_table_model.inc_col_type = "int"
                        hive_table_model.inc_col = \
                            hive_table_model.tracking_table_name.split(
                                '_inc_T_int_')[1]

                else:
                    # Incremental column is not present
                    hive_table_model.inc_col = None
        if hive_table_model.is_first_run:
            logger.debug("Tracking table does not exist")
        else:
            logger.debug(
                "Tracking table %s found with incremental column %s of type %s",
                hive_table_model.tracking_table_name, hive_table_model.inc_col,
                hive_table_model.inc_col_type)

    def create_tracking_table(self, hive_table_model):
        """Creates tracking table in CloudSQL instance

        Args:
            hive_table_model (:class:`HiveTableModel`): Wrapper to Hive table
                details
        """

        cursor = self.get_cursor()
        if hive_table_model.is_inc_col_present:
            # Tracking table contains information about the incremental
            # column name and its data type
            hive_table_model.tracking_table_name += "T_" + \
                hive_table_model.inc_col_type + "_" + \
                hive_table_model.inc_col
            query = """CREATE TABLE IF NOT EXISTS {} (
                id INT COMMENT 'Integer counter to identify the migration run 
                in which a data file has been detected',
                table_name VARCHAR(255) COMMENT 'Hive stage table name',
                inc_col_min VARCHAR(255) COMMENT 'Minimum value of the 
                incremental column',
                inc_col_max VARCHAR(255) COMMENT 'Maximum value of the 
                incremental column',
                clause VARCHAR(255) COMMENT 'Clause used while loading data 
                into staging table',
                file_path VARCHAR(255) COMMENT 'HDFS file path',
                gcs_copy_status VARCHAR(10) COMMENT 'Status of Hadoop distcp 
                operation to copy the file to GCS',
                gcs_file_path VARCHAR(255) COMMENT 'Path of the file copied 
                into GCS',
                bq_job_id VARCHAR(255) COMMENT 'BigQuery load job ID',
                bq_job_retries TINYINT COMMENT 'Number of retries of BigQuery 
                load job',
                bq_job_status VARCHAR(10) COMMENT 'Status of BigQuery load job'
                )""".format(hive_table_model.tracking_table_name)
        else:
            # 'F' indicates incremental column is not present
            hive_table_model.tracking_table_name += "F"
            query = """CREATE TABLE IF NOT EXISTS {} (
                table_name VARCHAR(255) COMMENT 'Hive stage table name',
                clause VARCHAR(255) COMMENT 'Clause used while loading data 
                into staging table',
                file_path VARCHAR(255) COMMENT 'HDFS file path',
                gcs_copy_status VARCHAR(10) COMMENT 'Status of Hadoop distcp 
                operation to copy the file to GCS',
                gcs_file_path VARCHAR(255) COMMENT 'Path of the file copied 
                into GCS',
                bq_job_id VARCHAR(255) COMMENT 'BigQuery load job ID',
                bq_job_retries TINYINT COMMENT 'Number of retries of BigQuery 
                load job',
                bq_job_status VARCHAR(10) COMMENT 'Status of BigQuery load job'
                )""".format(hive_table_model.tracking_table_name)

        cursor.execute(query)
        print_and_log("Tracking table {} is created".format(
            hive_table_model.tracking_table_name))
