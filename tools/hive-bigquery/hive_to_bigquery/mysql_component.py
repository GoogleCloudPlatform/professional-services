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
"""Module to handle MySQL related utilities."""

import logging

import pymysql

from hive_to_bigquery import custom_exceptions
from hive_to_bigquery.database_component import DatabaseComponent
from hive_to_bigquery.properties_reader import PropertiesReader

logger = logging.getLogger('Hive2BigQuery')


class MySQLComponent(DatabaseComponent):
    """MySQL component to handle functions related to it.

    Has utilities which perform MySQL operations using the pymysql
    connection, such as creating table, dropping a table, executing a query,
    executing a transaction etc.

    Attributes:
        host (str): Hostname of the Cloud SQL instance.
        user (str): Username to be used.
        password (str): Password to be used.
        database (str): Database to be connected.
        port (int): Port to be used.
        connection (pymysql.connections.Connection): Connection to Cloud SQL
        instance.

    """
    def __init__(self, **kwargs):

        logger.debug("Initializing Cloud SQL Component")
        super(MySQLComponent, self).__init__(**kwargs)

    def __str__(self):
        return "MySQL - Host {0} username {1} database {2} port {3}".format(
            self.host, self.user, self.database, self.port)

    def get_connection(self):
        """Connects to the MySQL database.

        Returns:
            pymysql.connections.Connection: pymysql connection object.
        """

        logger.debug("Getting MySQL Connection")
        try:
            logger.debug(self)
            connection = pymysql.connect(host=self.host,
                                         user=self.user,
                                         password=self.password,
                                         database=self.database,
                                         port=self.port)
            return connection
        except pymysql.err.DatabaseError as error:
            raise custom_exceptions.ConnectionError from error

    def get_cursor(self):
        """Gets the cursor object.

        Returns:
            pymysql.cursors.Cursor: pymysql cursor object.
        """

        logger.debug("Getting cursor")
        cursor = self.connection.cursor()
        return cursor

    def execute_transaction(self, query):
        """Executes a transaction and commits to the database.

        Args:
            query (str): Transaction query to be executed.
        """

        try:
            cursor = self.get_cursor()
            cursor.execute(query)
            self.connection.commit()
        except pymysql.err.OperationalError as error:
            self.connection.rollback()
            logger.error("Failed to commit transaction {} to Cloud SQL "
                         "table".format(query))
            raise custom_exceptions.MySQLExecutionError from error

    def execute_query(self, query):
        """Executes query and returns the results.

        Args:
            query (str): Query to be executed.

        Returns:
            List: Results of the query.
        """

        cursor = self.get_cursor()
        try:
            cursor.execute(query)
            return cursor.fetchall()
        except pymysql.err.OperationalError as error:
            logger.error(
                "Failed in querying Cloud SQL table - {}".format(query))
            raise custom_exceptions.MySQLExecutionError from error

    def check_table_exists(self, table_name):
        """Checks whether the provided MySQL table exists.

        Args:
            table_name (str): MySQL table name.
        """

        results = self.execute_query("SHOW TABLES")
        for name in results:
            if table_name == name[0]:
                return True
        return False

    def drop_table(self, table_name):
        """Drops tracking table.

        Args:
            table_name (str): MySQL table name.
        """

        cursor = self.get_cursor()

        if self.check_table_exists(table_name):
            try:
                cursor.execute("DROP TABLE {}".format(table_name))
                logger.debug("Dropped table %s", table_name)
            except pymysql.err.DatabaseError as error:
                logger.error("Failed dropping table %s", table_name)
                raise custom_exceptions.MySQLExecutionError from error

    def drop_table_if_empty(self, table_name):
        """Drops tracking table if empty.

        Args:
            table_name (str): MySQL table name.
        """

        if self.check_table_exists(table_name):
            results = self.execute_query(
                "SELECT COUNT(*) FROM {}".format(table_name))
            n_rows = results[0][0]
            if n_rows == 0:
                self.drop_table(table_name)
                logger.info(
                    "Dropped the empty tracking table {}".format(table_name))

    def check_tracking_table_exists(self, hive_table_model):
        """Checks whether the tracking table exists.

        Checks whether the tracking table exists from the previous migration
        run (if any) and updates the attributes (is_first_run,
        tracking_table_name, is_inc_col_present, inc_col, inc_col_type) of the
        HiveTableModel instance.

        Args:
            hive_table_model (:class:`HiveTableModel`): Wrapper to Hive table
                details.
        """

        results = self.execute_query(
            "SELECT tracking_table_name,inc_col_present,inc_col_name,"
            "inc_col_type from {} WHERE hive_database='{}' AND "
            "hive_table='{}' AND bq_table='{}'".format(
                PropertiesReader.get('tracking_metatable_name'),
                hive_table_model.db_name, hive_table_model.table_name,
                hive_table_model.bq_table_name))
        if results:
            hive_table_model.is_first_run = False
            hive_table_model.tracking_table_name = results[0][0]
            hive_table_model.inc_col = results[0][2]
            hive_table_model.inc_col_type = results[0][3]
            if hive_table_model.inc_col == 'None':
                hive_table_model.inc_col = None
                hive_table_model.inc_col_type = None

        if hive_table_model.is_first_run:
            logger.debug("Tracking table does not exist")
        else:
            logger.debug("Tracking table %s found",
                         hive_table_model.tracking_table_name)

    def update_tracking_meta_table(self, hive_table_model, mode):
        """Updates the tracking metatable with details of the Hive table."""

        if mode == "INSERT":
            query = "INSERT INTO {} (hive_database,hive_table,bq_table," \
                    "tracking_table_name,inc_col_present,inc_col_name," \
                    "inc_col_type) VALUES('{}','{}','{}','{}',{},'{}'," \
                    "'{}')".format(
                PropertiesReader.get('tracking_metatable_name'),
                hive_table_model.db_name, hive_table_model.table_name,
                hive_table_model.bq_table_name,
                hive_table_model.tracking_table_name,
                hive_table_model.is_inc_col_present, hive_table_model.inc_col,
                hive_table_model.inc_col_type)

        if mode == "DELETE":
            query = "DELETE FROM {} WHERE hive_database='{}' AND " \
                    "hive_table='{}' AND bq_table='{}'".format(
                PropertiesReader.get('tracking_metatable_name'),
                hive_table_model.db_name, hive_table_model.table_name,
                hive_table_model.bq_table_name)
        self.execute_query(query)

    def create_tracking_table(self, hive_table_model):
        """Creates tracking table in CloudSQL instance.

        Args:
            hive_table_model (:class:`HiveTableModel`): Wrapper to Hive table
                details.
        """

        self.update_tracking_meta_table(hive_table_model, "INSERT")

        logger.info("Tracking meta table {} is updated".format(
            PropertiesReader.get('tracking_metatable_name')))

        if hive_table_model.is_inc_col_present:

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

        self.execute_query(query)
        logger.info("Tracking table {} is created".format(
            hive_table_model.tracking_table_name))
