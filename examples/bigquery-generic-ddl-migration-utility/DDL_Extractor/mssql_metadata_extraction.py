# Copyright 2023 Google LLC
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#      http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.
"""Module to extract mssql metastore data"""
import sys
import pyodbc
import datetime
from google.cloud import storage, bigquery
from utils.setup_logger import logger
from utils import utilities as UtilFunction


class MssqlMetastoreModule:
    """
    This Class has functions related to the Generic Metadata Utility Module.
    It has functions which fetch different data metrics from database and
    write it to GCS bucket.

    Args:
        inputs (dict): Contains user input attributes
    """

    def __init__(
        self,
        username: str,
        password: str,
        host: str,
        port: str,
        dbname: str,
        gcs_config_path: str,
        project_id: str
    ) -> None:
        """Initialize the attributes"""
        self.username = username
        self.password = password
        self.host = host
        self.port = port
        self.dbname = dbname
        self.gcs_config_path = gcs_config_path
        self.project_id = project_id

    def connect_mssql_conn(self, table_ref, bq_client):
        """
        Initializes a connection pool for a Mssql.
        Uses the pyodbc Python package.
        """
        try:
            # Construct the connection string
            connection_string = f"DRIVER={{ODBC Driver 17 for SQL Server}};SERVER={self.host};\
                DATABASE={self.dbname};UID={self.username};PWD={self.password}"
            logger.info("Connecting to the Mssql Database...")
            conn = pyodbc.connect(connection_string)
        except Exception as ex:
            print(f"Connection to oracle failed: {str(ex)}")
            failure_record = [
                (
                    datetime.datetime.now().strftime("%s"),
                    None,
                    None,
                    None,
                    "DatabaseError",
                    str(ex),
                    "Failed",
                    "Check the connection credentials",
                )
            ]
            UtilFunction.log_table_data(table_ref, bq_client, failure_record)
            raise Exception(str(ex)) from ex
        else:
            return conn

    def extract_metastore(self, con, gcs_client, bq_client, table_config, source_bucket_name, source_dataset, table_ref):
        """Function to execute the core logic for metastore extraction"""
        try:
            cursor = con.cursor()
            con.outputtypehandler = UtilFunction.output_type_handler

            cursor = con.cursor()
            # Execute the metadata query
            query = """
                SELECT
                    t.TABLE_SCHEMA,
                    t.TABLE_NAME
                FROM
                    INFORMATION_SCHEMA.TABLES AS t
                WHERE
                    t.TABLE_TYPE = 'BASE TABLE' OR t.TABLE_TYPE = 'VIEW'
                ORDER BY
                    t.TABLE_SCHEMA,
                    t.TABLE_NAME,
            """
            cursor.execute(query)

            # Fetch all the rows from the result set
            rows = cursor.fetchall()
            logger.info("---Extraction Completed\n")
            # Create a ddl string from the metadata rows
            content = ""
            for row in rows:
                try:
                    query = f"""
                        exec sp_GetDDL '[{row[0]}].[{row[1]}]'
                    """
                    cursor.execute(query)
                    ddl_rows= cursor.fetchall()
                    content += str(ddl_rows) + "\n"

                    UtilFunction.write_to_blob(
                        gcs_client,
                        bucket_name=source_bucket_name,
                        file_name=f"{source_dataset}/{row['table_name'].split('.')[0].strip()}-\
                            {row['table_name'].split('.')[1].strip()}.sql",
                        content=output_str,
                    )
                except Exception as ex:
                    failure_record = [
                        (
                            datetime.datetime.now().strftime("%s"),
                            None,
                            row["table_name"].split(".")[0].strip(),
                            row["table_name"].split(".")[1].strip(),
                            "Excecution Error",
                            str(ex),
                            "Failed",
                            "Check the query",
                        )
                    ]
                    UtilFunction.log_table_data(table_ref, bq_client, failure_record)
                else:
                    print(
                        f"DDL Generated Successfully for table \
                            {row['table_name'].split('.')[1].strip()}"
                    )
                    file_path = f"gs://{source_bucket_name}/{source_dataset}/\
                        {row['table_name'].split('.')[0].strip()}-{row['table_name'].split('.')[1].strip()}.sql"
                    success_record = [
                        (
                            datetime.datetime.now().strftime("%s"),
                            file_path,
                            row["table_name"].split(".")[0].strip(),
                            row["table_name"].split(".")[1].strip(),
                            "DDL Extraction",
                            "DDL Generated Successfully",
                            "Success",
                            None,
                        )
                    ]
                    UtilFunction.log_table_data(table_ref, bq_client, success_record)
                    con.commit()
                    print(
                        "Connection close in case of failure of any table check the log table in Big Query"
                    )

                    if cursor:
                        cursor.close()
                    if con:
                        con.close()
        except Exception as error:
            logger.error("Error in the Extract Metastore function call %s", str(error))

    def mssql_metastore_discovery(self):
        """Creates a connection and query to the Mssql database."""
        try:
            config_source_bucket_name = self.gcs_config_path.split("//")[1].split("/")[0]
            config_source_prefix = self.gcs_config_path.split(config_source_bucket_name + "/")[1]
            gcs_client = storage.Client(self.project_id)

            migration_config_dict = UtilFunction.read_config(gcs_client, config_source_bucket_name, config_source_prefix)
            
            # Read variable values define in config file
            gcs_source_path = migration_config_dict["gcs_source_path"]
            dataset_location = migration_config_dict["dataset_location"]
            target_dataset = migration_config_dict["target_dataset"]
            source_bucket_name = migration_config_dict["source_bucket_name"]
            source_dataset = gcs_source_path.split("//")[1].split("/")[1]
            table_config = migration_config_dict["table_config"]

            bq_client = bigquery.Client(project=self.project_id, location=dataset_location)

            table_ref = UtilFunction.create_log_table(self.project_id, target_dataset, bq_client)

            con = self.connect_mssql_conn(table_ref, bq_client)
            self.extract_metastore(con, gcs_client, bq_client, table_config, source_bucket_name, source_dataset, table_ref)
        except Exception as error:
            logger.error("Error in the main function call %s", str(error))
            sys.exit(1)
        finally:
            con.close()
