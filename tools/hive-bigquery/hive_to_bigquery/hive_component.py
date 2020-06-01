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
"""Module to handle Hive related utilities like creating connection to Hive
database, executing a query, check whether the provided database & table
exists etc."""

import json
import logging
import os
import time
from dateutil.parser import parse
from uuid import uuid4

from pyhive import exc, hive
from thrift.transport import TTransport

from hive_to_bigquery import custom_exceptions
from hive_to_bigquery.utilities import calculate_time
from hive_to_bigquery.database_component import DatabaseComponent

logger = logging.getLogger('Hive2BigQuery')


class HiveComponent(DatabaseComponent):
    """Hive component to handle functions related to it.

    Has utilities which do Hive operations using the Hive connection, such as
    creating staging table, loading data into staging table, listing
    underlying files, getting information on data to migrate, migrating data
    to BigQuery, and checking for new data in the source Hive table etc.

    Attributes:
        host (str): Hive server host name.
        port (int): Port to be used.
        user (str): Hive user name.
        connection (pyhive.hive.Connection): Hive connection object.
    """
    def __init__(self, **kwargs):

        logger.debug("Initializing Hive Component")
        super(HiveComponent, self).__init__(**kwargs)

    def get_connection(self):
        """Gets connection to the Hive server.

        Returns:
            pyhive.hive.Connection: Hive Connection object.
        """

        logger.debug("Getting Hive Connection")
        try:
            connection = hive.connect(host=self.host,
                                      port=self.port,
                                      username=self.user)
            return connection
        except TTransport.TTransportException as error:
            logger.error("Failed to establish Hive connection")
            raise custom_exceptions.ConnectionError from error

    def get_cursor(self):
        """Gets the Hive cursor.

        Returns:
            pyhive.hive.Cursor: pyhive cursor object.
        """

        logger.debug("Getting Hive cursor")
        cursor = self.connection.cursor()
        return cursor

    def execute_query(self, query_cmds):
        """Executes Hive query and returns the results.

        Args:
            query_cmds (Union[List,str]): To be executed query/queries.

        Returns:
            List: Results of the query.
        """

        cursor = self.get_cursor()
        try:
            if isinstance(query_cmds, list):
                for query in query_cmds:
                    cursor.execute(query)
            else:
                cursor.execute(query_cmds)

            try:
                results = cursor.fetchall()
            except exc.ProgrammingError:
                results = []
            finally:
                return results

        except exc.OperationalError as error:
            logger.error("Hive Query {} execution failed".format(
                str(query_cmds)))
            raise custom_exceptions.HiveExecutionError from error

    def check_database_exists(self, database_name):
        """Checks whether the Hive database exists.

        Args:
            database_name (str): Hive database name.

        Returns:
            boolean : True, if database exists else False.
        """

        results = self.execute_query("SHOW DATABASES")
        for name in results:
            if database_name in name:
                return True
        return False

    def check_table_exists(self, database_name, table_name):
        """Checks whether the Hive table exists.

        Args:
            database_name (str): Hive database name.
            table_name (str): Hive table name.

        Returns:
            boolean : True, if table exists else False.
        """

        results = self.execute_query(
            "SHOW TABLES FROM {}".format(database_name))
        for name in results:
            if table_name in name:
                return True
        return False

    def get_table_location(self, database_name, table_name):
        """Returns the Hive table location.

        Args:
            database_name (str): Hive database name.
            table_name (str): Hive table name.

        Returns:
            str: Location of the Hive table.
        """

        queries = [
            "set hive.ddl.output.format=json",
            "desc extended {0}.{1}".format(database_name, table_name)
        ]
        results = self.execute_query(queries)
        location = json.loads(results[0][0])['tableInfo']['sd']['location']
        return location

    @staticmethod
    def list_hdfs_files(location):
        """Lists the underlying HDFS files with non-zero size.

        Args:
            location (str): Hive table location.

        Returns:
            List: List of the underlying data files.
        """

        file_name = "hdfs_files_{}.txt".format(uuid4())
        status_code = os.system("hdfs dfs -ls {0} > {1}".format(
            location, file_name))
        if status_code:
            logger.error("hdfs command execution failed")
            raise custom_exceptions.HDFSCommandError
        with open(file_name, "r") as file_content:
            content = file_content.readlines()
        os.remove(file_name)
        hdfs_files_list = []
        i = 0
        for i, line in enumerate(content):
            if line.startswith("Found "):
                break
        for j in range(i + 1, len(content)):
            size = content[j].split()[4]
            if size != '0':
                hdfs_files_list.append(content[j].split()[-1])

        return hdfs_files_list

    def list_partitions(self, database_name, table_name):
        """Gets information about the different partitions.

        Args:
            database_name (str): Hive database name.
            table_name (str): Hive table name.

        Returns:
            List: A list of dict elements containing information of every
                partition.
        """

        tracking_data = []
        queries = [
            "set hive.ddl.output.format=json",
            "SHOW PARTITIONS {0}.{1}".format(database_name, table_name)
        ]
        result_set = self.execute_query(queries)
        results = json.loads(result_set[0][0])['partitions']

        for item in results:
            # Form the WHERE clause by joining the partition column names and
            # their values
            clause = 'WHERE ' + ' AND '.join(
                partition['columnName'] + '=' + '"' +
                partition['columnValue'] + '"' for partition in item['values'])
            tracking_data.append({
                'table_name':
                'stage__{}__{}'.format(table_name.lower(),
                                       str(uuid4()).replace("-", "_")),
                'clause':
                clause
            })
        return tracking_data

    def get_hive_table_row_count(self, hive_table_model, clause=''):
        """Queries Hive table to get number of rows.

        Args:
            hive_table_model (:class:`HiveTableModel`): Wrapper to Hive table
                details.
            clause (str): WHERE clause to filter the table on partitions, if any.

        Returns:
            int: Number of rows as an output from the query.
        """

        query = "SELECT COUNT(*) FROM {0}.{1} {2}".format(
            hive_table_model.db_name, hive_table_model.table_name, clause)
        results = self.execute_query(query)
        n_rows = results[0][0]
        return n_rows

    def get_info_on_data_to_migrate(self, hive_table_model):
        """Gets information on data to be migrated in case of first run of
        migration.

        Args:
            hive_table_model (:class:`HiveTableModel`): Wrapper to Hive table
                details.

        Returns:
            List: A list of dict elements each containing information of the
                data that needs to be migrated.
        """

        if hive_table_model.is_partitioned is False:
            tracking_data = self.get_non_partition_table_info(hive_table_model)
        else:
            tracking_data = self.get_partition_table_info(hive_table_model)

        return tracking_data

    def get_non_partition_table_info(self, hive_table_model):
        """Gets information on data to be migrated in case of a non-partition
        table.

        Validates the incremental column (if any provided), queries the Hive
        table to get the minimum and maximum values of the column and sets
        the HiveTableModel attributes related to incremental column.

        Args:
            hive_table_model (:class:`HiveTableModel`): Wrapper to Hive table
                details.

        Returns:
            List: A list of only one dict element containing the information
                of data to migrate.
        """

        tracking_data = list()

        if hive_table_model.inc_col is not None:
            logger.info("Validating given incremental column...")
            # If the provided incremental column is of timestamp/date type,
            # it cannot be validated by counting the number of rows.
            if hive_table_model.inc_col in hive_table_model.timestamp_type_col:
                logger.debug(
                    "Fetching minimum and maximum values of the timestamp "
                    "incremental column...")
                results = self.execute_query(
                    "SELECT MIN({0}),MAX({0}) FROM {1}.{2}".format(
                        hive_table_model.inc_col, hive_table_model.db_name,
                        hive_table_model.table_name))
                col_min, col_max = results[0]
                # Sets incremental attributes of hive_table_model.
                hive_table_model.inc_col_type = 'ts'

                logger.info(
                    "Incremental column {} found. Range - {} - {}".format(
                        hive_table_model.inc_col, col_min, col_max))

            # Validates the incremental column of int data type by comparing
            # the number of distinct values and number of rows.
            elif hive_table_model.inc_col in hive_table_model.int_type_col:

                logger.debug("Counting the total number of rows...")
                results = self.execute_query(
                    "SELECT COUNT(*) FROM {}.{}".format(
                        hive_table_model.db_name, hive_table_model.table_name))
                n_rows = results[0][0]
                logger.debug("Number of rows in the table: %d", n_rows)

                logger.debug(
                    "Fetching maximum value of the incremental column...")
                query = "SELECT COUNT(DISTINCT({0})),MIN({0}),MAX({0}) " \
                        "FROM {1}.{2}".format(
                            hive_table_model.inc_col, hive_table_model.db_name,
                            hive_table_model.table_name)
                results = self.execute_query(query)

                distinct_col_values, col_min, col_max = results[0]
                # Checks if number of distinct values matches the number of rows.
                if n_rows == distinct_col_values and (1 + col_max -
                                                      col_min == n_rows):
                    # Sets incremental attributes of hive_table_model.
                    hive_table_model.inc_col_type = 'int'

                    logger.info(
                        "Incremental column {} valid. Range - {} - {}".format(
                            hive_table_model.inc_col, col_min, col_max))
                else:
                    logger.error(
                        "Incremental column {0} not valid. Range - {1} - "
                        "{2}\nTry another incremental column or without "
                        "providing incremental column".format(
                            hive_table_model.inc_col, col_min, col_max))
                    raise custom_exceptions.IncrementalColumnError
            else:
                logger.error("Given incremental column is not present.")
                raise custom_exceptions.IncrementalColumnError

        if hive_table_model.is_inc_col_present:
            tracking_data.append({
                'table_name': hive_table_model.staging_table_name,
                'id': 1,
                'inc_col_min': col_min,
                'inc_col_max': col_max,
                'clause': ""
            })
        else:
            tracking_data.append({
                'table_name': hive_table_model.staging_table_name,
                'clause': ""
            })

        return tracking_data

    def get_partition_table_info(self, hive_table_model):
        """Gets information on data to be migrated in case of a partition table.

        Validates the incremental column (if any provided), queries the Hive
        table to get the minimum and maximum values of the column in every
        partition and sets the HiveTableModel attributes related to
        incremental column.

        Args:
            hive_table_model (:class:`HiveTableModel`): Wrapper to Hive table
                details.

        Returns:
            List: A list of dict elements containing the information of data
            to migrate.
        """

        # Information about partitions.
        tracking_data = self.list_partitions(hive_table_model.db_name,
                                             hive_table_model.table_name)

        for item in tracking_data:
            # Id is set to 1 since the partition is migrated for the first time.
            item['id'] = 1
        if hive_table_model.inc_col is not None:
            logger.info("Validating given incremental column...")
            # If the provided incremental column is of timestamp/date type,
            # it cannot be validated by counting the number of rows.
            if hive_table_model.inc_col in hive_table_model.timestamp_type_col:
                logger.debug(
                    "Fetching minimum and maximum values of the timestamp "
                    "incremental column...")
                for item in tracking_data:
                    clause = item['clause']
                    results = self.execute_query(
                        "SELECT MIN({0}),MAX({0}) FROM {1}.{2} {3}".format(
                            hive_table_model.inc_col, hive_table_model.db_name,
                            hive_table_model.table_name, clause))
                    col_min, col_max = results[0]
                    item['inc_col_min'] = col_min
                    item['inc_col_max'] = col_max
                    # Setting incremental attributes of hive_table_model.
                    hive_table_model.inc_col_type = 'ts'
                    logger.info(
                        "Incremental column {} found in table {}. Range - {} "
                        "- {}".format(hive_table_model.inc_col, clause,
                                      col_min, col_max))
            # Validates the incremental column of int data type by comparing
            # the number of distinct values and number of rows.
            elif hive_table_model.inc_col in hive_table_model.int_type_col:
                # Sets incremental attributes of hive_table_model.
                hive_table_model.inc_col_type = 'int'
                n_rows = {}
                for data in tracking_data:
                    clause = data['clause']
                    logger.debug("Counting the number of rows %s ...", clause)
                    results = self.execute_query(
                        "SELECT COUNT(*) FROM {0}.{1} {2}".format(
                            hive_table_model.db_name,
                            hive_table_model.table_name, clause))
                    n_rows[clause] = results[0][0]
                    logger.debug("Number of rows in the table %s : %s", clause,
                                 n_rows[clause])
                for item in tracking_data:
                    clause = item['clause']
                    logger.debug(
                        "Fetching maximum value of the incremental column %s "
                        "...", clause)
                    query = "SELECT COUNT(DISTINCT({0})),MIN({0}),MAX({0}) " \
                            "FROM {1}.{2} {3}".format(
                                hive_table_model.inc_col,
                                hive_table_model.db_name,
                                hive_table_model.table_name, clause)
                    results = self.execute_query(query)
                    distinct_col_values, col_min, col_max = results[0]
                    # Checks if the number of distinct values matches the
                    # number of rows for every partition.
                    if n_rows[clause] == distinct_col_values and (
                            1 + col_max - col_min == n_rows[clause]):
                        # Sets incremental attributes of hive_table_model.
                        item['inc_col_min'] = col_min
                        item['inc_col_max'] = col_max
                        logger.debug(
                            "Incremental column %s found in table %s. Range - "
                            "%s - %s", hive_table_model.inc_col, clause,
                            col_min, col_max)

                    else:
                        logger.error(
                            "Incremental column {} not valid in partition {}. "
                            "Range - {} - {}\nTry another incremental column "
                            "or without providing incremental column".format(
                                hive_table_model.inc_col, clause, col_min,
                                col_max))
                        raise custom_exceptions.IncrementalColumnError
                if hive_table_model.is_inc_col_present:
                    logger.info("Incremental column {} found".format(
                        hive_table_model.inc_col))
            else:
                logger.error("Given incremental column is not present.")
                raise custom_exceptions.IncrementalColumnError
        return tracking_data

    def create_and_load_stage_table(self,
                                    hive_table_model,
                                    table_name,
                                    clause=''):
        """Creates Hive staging table and inserts data into it from the
        source table.

        Args:
            hive_table_model (:class:`HiveTableModel`): Wrapper to Hive table
                details.
            table_name (str): Staging table name.
            clause (str): WHERE clause to filter the table (if any),
                and insert only the filtered data into the staging table.
        """

        logger.info("Staging for table " + table_name + "...")
        # Replaces TABLE_NAME_HERE place holder with staging table name.
        create_ddl_statement = hive_table_model.create_statement.replace(
            "TABLE_NAME_HERE", table_name)

        # Creates staging table.
        self.execute_query(create_ddl_statement)
        logger.debug("Table %s created in Hive. Inserting data...", table_name)
        start = time.time()

        # Inserts data into staging table.
        query = "INSERT OVERWRITE TABLE {} SELECT * FROM {}.{} {}".format(
            table_name, hive_table_model.db_name, hive_table_model.table_name,
            clause)
        logger.info(query)
        self.execute_query(query)

        end = time.time()
        time_hive_stage = calculate_time(start, end)
        logger.debug("Loaded data from %s into %s - Time taken - %s",
                     hive_table_model.table_name, table_name, time_hive_stage)

    def migrate_data(self, mysql_component, bq_component, gcs_component,
                     hive_table_model, bq_table_model, gcs_bucket_name,
                     table_data):
        """Invokes the function to migrate data based on whether the Hive
        table is partitioned.

        Args:
            mysql_component (:class:`MySQLComponent`): Instance of
                MySQLComponent to connect to MySQL.
            bq_component (:class:`BigQueryComponent`): Instance of
                BigQueryComponent to do BigQuery operations.
            gcs_component (:class:`GCSStorageComponent`): Instance of
                GCSStorageComponent to do GCS operations.
            hive_table_model (:class:`HiveTableModel`): Wrapper to Hive table
                details.
            bq_table_model (:class:`BigQueryTableModel`): Wrapper to BigQuery
                table details.
            gcs_bucket_name (str): GCS bucket name.
            table_data (List): Information of data to migrate.
        """

        logger.debug("Populating tracking table..")

        if hive_table_model.is_partitioned is False:
            self.migrate_non_partition_table(mysql_component, bq_component,
                                             gcs_component, hive_table_model,
                                             bq_table_model, gcs_bucket_name,
                                             table_data)
        else:
            self.migrate_partition_table(mysql_component, bq_component,
                                         gcs_component, hive_table_model,
                                         bq_table_model, gcs_bucket_name,
                                         table_data)

    def migrate_non_partition_table(self, mysql_component, bq_component,
                                    gcs_component, hive_table_model,
                                    bq_table_model, gcs_bucket_name,
                                    table_data):
        """Migrates Hive data in case of a non-partitioned table.

        Invokes the function to create and load stage table, gets the staging
        table location, and lists down the underneath HDFS files. Updates the
        file paths in the tracking table and calls the function stage_to_gcs
        to copy files to GCS.

        Args:
            mysql_component (:class:`MySQLComponent`): Instance of
                MySQLComponent to connect to MySQL.
            bq_component (:class:`BigQueryComponent`): Instance of
                BigQueryComponent to do BigQuery operations.
            gcs_component (:class:`GCSStorageComponent`): Instance of
                GCSStorageComponent to do GCS operations.
            hive_table_model (:class:`HiveTableModel`): Wrapper to Hive table
                details.
            bq_table_model (:class:`BigQueryTableModel`): Wrapper to BigQuery
                table details.
            gcs_bucket_name (str): GCS bucket name.
            table_data (List): Information of data to migrate.
        """

        table_name = table_data[0]['table_name']
        clause = table_data[0]['clause']
        insert_clause = clause
        if hive_table_model.is_inc_col_present:
            identifier = int(table_data[0]['id'])
            inc_col_min = table_data[0]['inc_col_min']
            inc_col_max = table_data[0]['inc_col_max']
            if identifier == 1:
                # Includes lower bound value in the stage table.
                insert_clause = "where {0}>='{1}' and {0}<='{2}'".format(
                    hive_table_model.inc_col, inc_col_min, inc_col_max)
            else:
                insert_clause = "where {0}>'{1}' and {0}<='{2}'".format(
                    hive_table_model.inc_col, inc_col_min, inc_col_max)

        # Creating staging table and loading data.
        if hive_table_model.is_table_type_supported is False:
            self.create_and_load_stage_table(hive_table_model, table_name,
                                             insert_clause)
            source_location = self.get_table_location("default", table_name)
        else:
            if hive_table_model.is_inc_col_present and \
                    hive_table_model.is_first_run is False:
                self.create_and_load_stage_table(hive_table_model, table_name,
                                                 insert_clause)
                source_location = self.get_table_location(
                    "default", table_name)
            else:
                source_location = self.get_table_location(
                    hive_table_model.db_name, hive_table_model.table_name)
        # Lists underlying HDFS files.
        hdfs_files_list = self.list_hdfs_files(source_location)
        logger.info("Updating file paths in the tracking table..")
        for file_path in hdfs_files_list:
            if hive_table_model.is_inc_col_present:
                query = "INSERT INTO {0} (id,table_name,inc_col_min," \
                        "inc_col_max,clause,file_path,gcs_copy_status," \
                        "bq_job_id,bq_job_retries,bq_job_status) VALUES({1}," \
                        "'{2}','{3}','{4}','{5}','{6}','TODO','TODO',0," \
                        "'TODO')".format(
                            hive_table_model.tracking_table_name, identifier,
                            table_name, inc_col_min, inc_col_max, clause,
                            file_path)
            else:
                query = "INSERT INTO {0} (table_name,clause,file_path," \
                        "gcs_copy_status,bq_job_id,bq_job_retries," \
                        "bq_job_status) VALUES('{1}','{2}','{3}','TODO'," \
                        "'TODO',0,'TODO')".format(
                            hive_table_model.tracking_table_name, table_name,
                            clause, file_path)
            # Commits information about the staging files.
            mysql_component.execute_transaction(query)
        # Copies files from HDFS to GCS.
        gcs_component.stage_to_gcs(mysql_component, bq_component,
                                   hive_table_model, bq_table_model,
                                   gcs_bucket_name)

    def migrate_partition_table(self, mysql_component, bq_component,
                                gcs_component, hive_table_model,
                                bq_table_model, gcs_bucket_name, table_data):
        """Migrates Hive data in case of a partition table.

        Invokes the function to create and load stage table, gets the staging
        table location, and lists down the underneath HDFS files. Updates the
        file paths in the tracking table and calls the function stage_to_gcs
        to copy files to GCS.

        Args:
            mysql_component (:class:`MySQLComponent`): Instance of
                MySQLComponent to connect to MySQL.
            bq_component (:class:`BigQueryComponent`): Instance of
                BigQueryComponent to do BigQuery operations.
            gcs_component (:class:`GCSStorageComponent`): Instance of
                GCSStorageComponent to do GCS operations.
            hive_table_model (:class:`HiveTableModel`): Wrapper to Hive table
                details.
            bq_table_model (:class:`BigQueryTableModel`): Wrapper to BigQuery
                table details.
            gcs_bucket_name (str): GCS bucket name.
            table_data (List): Information of data to migrate.
        """

        for data in table_data:
            if hive_table_model.is_inc_col_present:
                insert_query = "INSERT INTO {0} (id,table_name,inc_col_min," \
                               "inc_col_max,clause,file_path) VALUES('{1}'," \
                               "'{2}','{3}','{4}','{5}','TODO')".format(
                                   hive_table_model.tracking_table_name,
                                   data['id'], data['table_name'],
                                   data['inc_col_min'], data['inc_col_max'],
                                   data['clause'])
                select_query = "SELECT id,table_name,inc_col_min,inc_col_max," \
                               "clause FROM {} WHERE file_path='TODO'".format(
                                   hive_table_model.tracking_table_name)
            else:
                insert_query = "INSERT INTO {0} (table_name,clause," \
                               "file_path)VALUES('{1}','{2}','TODO')".format(
                                   hive_table_model.tracking_table_name,
                                   data['table_name'], data['clause'])
                select_query = "SELECT table_name,clause FROM {} WHERE " \
                               "file_path='TODO'".format(
                                   hive_table_model.tracking_table_name)
            # Inserts a row in the tracking table for every partition.
            mysql_component.execute_transaction(insert_query)
            results = mysql_component.execute_query(select_query)

            for row in results:
                if hive_table_model.is_inc_col_present:
                    identifier, table_name, inc_col_min, inc_col_max, clause \
                        = row
                    if identifier == 1:
                        insert_clause = "{0} and {1}>='{2}' and " \
                                        "{1}<='{3}'".format(
                                            clause, hive_table_model.inc_col,
                                            inc_col_min, inc_col_max)
                    else:
                        insert_clause = "{0} and {1}>'{2}' and " \
                                        "{1}<='{3}'".format(
                                            clause, hive_table_model.inc_col,
                                            inc_col_min, inc_col_max)
                else:
                    table_name, clause = row
                    insert_clause = clause
                # Creates staging table and inserting data.
                self.create_and_load_stage_table(hive_table_model, table_name,
                                                 insert_clause)
                # Gets table location
                source_location = self.get_table_location(
                    "default", table_name)
                # Lists underlying HDFS files.
                hdfs_files_list = self.list_hdfs_files(source_location)

                logger.info("Updating file paths in the tracking table..")
                for file_path in hdfs_files_list:
                    if hive_table_model.is_inc_col_present:
                        query = "INSERT INTO {0} (id,table_name,inc_col_min," \
                                "inc_col_max,clause,file_path," \
                                "gcs_copy_status,bq_job_id,bq_job_retries," \
                                "bq_job_status) VALUES('{1}','{2}','{3}'," \
                                "'{4}','{5}','{6}','TODO','TODO',0," \
                                "'TODO')".format(
                                    hive_table_model.tracking_table_name,
                                    identifier, table_name, inc_col_min,
                                    inc_col_max, clause, file_path)
                    else:
                        query = "INSERT INTO {0} (table_name,clause," \
                                "file_path,gcs_copy_status,bq_job_id," \
                                "bq_job_retries,bq_job_status) VALUES('{1}'," \
                                "'{2}','{3}','TODO','TODO',0,'TODO')".format(
                                    hive_table_model.tracking_table_name,
                                    table_name, clause, file_path)
                    # Commits information about the staging files.
                    mysql_component.execute_transaction(query)

                query = "DELETE FROM {0} WHERE table_name='{1}' AND clause " \
                        "='{2}' AND file_path='TODO'".format(
                            hive_table_model.tracking_table_name,
                            table_name, clause)
                mysql_component.execute_transaction(query)
                # Copies files from HDFS to GCS.
                gcs_component.stage_to_gcs(mysql_component, bq_component,
                                           hive_table_model, bq_table_model,
                                           gcs_bucket_name)

    @staticmethod
    def compare_max_values(hive_table_model, old_max, new_max):
        """Compares the previously obtained maximum value with the newly
        obtained maximum value of incremental column.

        Args:
            hive_table_model (:class:`HiveTableModel`): Wrapper to Hive table
                details.
            old_max (str): Maximum value of the incremental column from the
                tracking table.
            new_max (str): Maximum value of the incremental column from the
                Hive table.

        Returns:
            boolean: True if new_max value is greater than the old_max value,
            else False.
        """

        if hive_table_model.inc_col_type == "ts":

            try:
                old_max = parse(old_max)
                new_max = parse(new_max)

            except ValueError as error:
                logger.exception(error)
                logger.info("Failed to detect incremental column type")
                raise

            if new_max > old_max:
                return True

        else:
            # incremental column is of int type.
            if int(new_max) > int(old_max):
                return True

        return False

    def check_inc_data(self, mysql_component, bq_component, gcs_component,
                       hive_table_model, bq_table_model, gcs_bucket_name):
        """Invokes the functions to check for incremental data.

        Args:
            mysql_component (:class:`MySQLComponent`): Instance of
                MySQLComponent to connect to MySQL.
            bq_component (:class:`BigQueryComponent`): Instance of
                BigQueryComponent to do BigQuery operations.
            gcs_component (:class:`GCSStorageComponent`): Instance of
                GCSStorageComponent to do GCS operations.
            hive_table_model (:class:`HiveTableModel`): Wrapper to Hive table
                details.
            bq_table_model (:class:`BigQueryTableModel`): Wrapper to BigQuery
                table details.
            gcs_bucket_name (str): GCS bucket name.

        Returns:
            List: A list of dict elements each containing information of the
                incremental data that needs to be migrated.
        """

        logger.info("Checking for any new data...")
        if hive_table_model.is_partitioned is False:
            tracking_data = self.check_inc_non_partition_table(
                mysql_component, bq_component, gcs_component, hive_table_model,
                bq_table_model, gcs_bucket_name)
        else:
            tracking_data = self.check_inc_partition_table(
                mysql_component, hive_table_model)

        return tracking_data

    def check_inc_non_partition_table(self, mysql_component, bq_component,
                                      gcs_component, hive_table_model,
                                      bq_table_model, gcs_bucket_name):
        """Checks for incremental data in case of a non-partitioned table.

        If there is an incremental column, the function queries the Hive
        table to get the maximum value and compares it with the maximum value
        from the tracking table. If there is no incremental column then
        Case A: If the data format is supported [Avro/ORC/Parquet], it looks
        for new files.
        Case B: If the data format is not supported, it cannot detect new data.

        Args:
            mysql_component (:class:`MySQLComponent`): Instance of
                MySQLComponent to connect to MySQL.
            bq_component (:class:`BigQueryComponent`): Instance of
                BigQueryComponent to do BigQuery operations.
            gcs_component (:class:`GCSStorageComponent`): Instance of
                GCSStorageComponent to do GCS operations.
            hive_table_model (:class:`HiveTableModel`): Wrapper to Hive table
                details.
            bq_table_model (:class:`BigQueryTableModel`): Wrapper to BigQuery
                table details.
            gcs_bucket_name (str): GCS bucket name.

        Returns:
            List: A list of only one dict element, containing information of
                the incremental data.
        """

        tracking_data = []
        if hive_table_model.is_inc_col_present:
            # Fetches maximum value of the incremental column for each
            # partition from the tracking table and from Hive table and
            # compare these values to decide whether there is new data.
            results = mysql_component.execute_query(
                "SELECT MAX(id),MAX(inc_col_max) FROM {}".format(
                    hive_table_model.tracking_table_name))
            identifier, old_data_max = results[0]

            results = self.execute_query("SELECT MAX({0}) FROM {1}.{2}".format(
                hive_table_model.inc_col, hive_table_model.db_name,
                hive_table_model.table_name))
            new_data_max = results[0][0]

            new_data_exists = self.compare_max_values(hive_table_model,
                                                      old_data_max,
                                                      new_data_max)
            if new_data_exists:
                logger.info("New data found in source table")
                logger.debug(
                    "Previously incremental column %s maximum value "
                    "%s.Current maximum value %s", hive_table_model.inc_col,
                    old_data_max, new_data_max)
                tracking_data.append({
                    'table_name': hive_table_model.staging_table_name,
                    'id': identifier + 1,
                    'inc_col_min': old_data_max,
                    'inc_col_max': new_data_max,
                    'clause': ""
                })
            else:
                logger.info("No new data found")
        elif not hive_table_model.is_inc_col_present and \
                hive_table_model.is_table_type_supported is False:
            logger.info(
                "cannot check for new data in case of Non partitioned - No "
                "Incremental column - Text format table")
        elif not hive_table_model.is_inc_col_present and \
                hive_table_model.is_table_type_supported is True:
            # Lists HDFS files and compares them with tracking table and
            # migrates files which aren't present in the tracking table.
            results = mysql_component.execute_query(
                "SELECT file_path FROM {}".format(
                    hive_table_model.tracking_table_name))
            old_file_paths = [row[0] for row in results]
            new_file_paths = self.list_hdfs_files(
                self.get_table_location(hive_table_model.db_name,
                                        hive_table_model.table_name))

            new_data_exists = False
            for file_path in new_file_paths:
                if file_path not in old_file_paths:
                    # Updates the tracking table with new file paths.
                    new_data_exists = True
                    logger.debug("Found new data at file path %s", file_path)
                    query = "INSERT INTO {0} (table_name,file_path," \
                            "gcs_copy_status,bq_job_id,bq_job_retries," \
                            "bq_job_status) VALUES('{1}','{2}','TODO','TODO'," \
                            "0,'TODO')".format(
                                hive_table_model.tracking_table_name,
                                hive_table_model.table_name, file_path)
                    mysql_component.execute_transaction(query)
            # Copies the new files to GCS.
            if new_data_exists:
                logger.info("New files found in source table")
                gcs_component.stage_to_gcs(mysql_component, bq_component,
                                           hive_table_model, bq_table_model,
                                           gcs_bucket_name)
            else:
                logger.info("No new data found")

        return tracking_data

    def check_inc_partition_table(self, mysql_component, hive_table_model):
        """Checks for incremental data in case of a partition table.

        If there is no incremental column, this function queries the Hive
        table to get the list of new partitions, if any. If there is an
        incremental column, in addition to finding new partitions, this also
        gets the information of the incremental data in existing partitions.

        Args:
            mysql_component (:class:`MySQLComponent`): Instance of
                MySQLComponent to connect to MySQL.
            hive_table_model (:class:`HiveTableModel`): Wrapper to Hive table
                details.

        Returns:
            List: A list of only one dict element containing information of
                the incremental data.
        """

        tracking_data = []
        # Checks for any new partitions which haven't been recorded in
        # the tracking table and appends information to the list.
        logger.info("Checking for new partitions...")
        results = mysql_component.execute_query(
            "SELECT DISTINCT(clause) FROM {}".format(
                hive_table_model.tracking_table_name))
        old_partitions_list = [row[0] for row in results]

        partitions_list = self.list_partitions(hive_table_model.db_name,
                                               hive_table_model.table_name)
        present_partitions_list = [item['clause'] for item in partitions_list]

        new_partitions_list = list(
            set(present_partitions_list).difference(old_partitions_list))

        if not hive_table_model.is_inc_col_present:
            for clause in new_partitions_list:
                logger.info("Found new partition {}".format(clause))
                tracking_data.append({
                    'table_name': hive_table_model.staging_table_name,
                    'clause': clause
                })

        else:
            for clause in new_partitions_list:

                logger.info("Found new partition {}".format(clause))
                results = self.execute_query(
                    "SELECT MIN({0}),MAX({0}) FROM {1}.{2} {3}".format(
                        hive_table_model.inc_col, hive_table_model.db_name,
                        hive_table_model.table_name, clause))
                col_min, col_max = results[0]
                tracking_data.append({
                    "table_name": hive_table_model.staging_table_name,
                    "id": 1,
                    "inc_col_min": col_min,
                    "inc_col_max": col_max,
                    "clause": clause
                })

            logger.info("Checking for new data in existing partitions...")
            # Fetches maximum value of the incremental column for each
            # partition from the tracking table and from Hive table and
            # compare these values to decide whether there is new data.
            for clause in old_partitions_list:

                results = mysql_component.execute_query(
                    "SELECT MAX(id),MAX(inc_col_max) FROM {0} WHERE "
                    "clause='{1}'".format(hive_table_model.tracking_table_name,
                                          clause))
                identifier, old_data_max = results[0]
                logger.debug("Old maximum value %s - %s", clause, old_data_max)

                results = self.execute_query(
                    "SELECT MAX({0}) FROM {1}.{2} {3}".format(
                        hive_table_model.inc_col, hive_table_model.db_name,
                        hive_table_model.table_name, clause))
                new_data_max = results[0][0]
                logger.debug("New maximum value %s - %s", clause, new_data_max)

                new_data_exists = self.compare_max_values(
                    hive_table_model, old_data_max, new_data_max)
                # Appends information to the list if new data is found.
                if new_data_exists:
                    logger.info(
                        "New data found in partition - {}".format(clause))
                    tracking_data.append({
                        "table_name": hive_table_model.staging_table_name,
                        "id": identifier + 1,
                        "inc_col_min": old_data_max,
                        "inc_col_max": new_data_max,
                        "clause": clause
                    })
                else:
                    logger.info(
                        "No New data found in partition - {}".format(clause))

        return tracking_data
