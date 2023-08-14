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
"""Module to extract Snowflake metastore data"""
import sys
import datetime
import snowflake.connector
from snowflake.connector.errors import DatabaseError
from google.cloud import storage, bigquery
from utils.setup_logger import logger
from utils import utilities as UtilFunction


class SnowflakeMetastoreModule:
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
        project_id: str,
        account: str, 
        warehouse: str,
        schema: str
    ) -> None:
        """Initialize the attributes"""
        self.username = username
        self.password = password
        self.host = host
        self.port = port
        self.dbname = dbname
        self.gcs_config_path = gcs_config_path
        self.project_id = project_id
        self.account = account
        self.warehouse = warehouse
        self.schema = schema

    def connect_snowflake_conn(self, table_ref, bq_client):
        """
        Initializes a connection pool for a Mssql.
        Uses the pyodbc Python package.
        """
        try:
            ctx = snowflake.connector.connect(
                user=self.username,
                password=self.password,
                account=self.account,
                warehouse=self.warehouse,
                database=self.dbname,
                schema=self.schema
            )
        except DatabaseError as ex:
            print(f"Connection to snowflake failed: {str(ex)}")
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
            return ctx


    def extract_metastore(self, con, gcs_client, bq_client, table_config, source_bucket_name, source_dataset, table_ref):
        """Function to execute the core logic for metastore extraction"""
        try:
            cursor = con.cursor()
            for row in table_config:
                try:
                    query = """ SELECT GET_DDL('TABLE',upper('{1}'),true) """.format(row['table_name'].split('.')[0].strip(),row['table_name'].split('.')[1].strip())
                    cursor.execute(query)
                    output = cursor.fetchall()
                    output_str = str(output[0][0])
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
                    cursor.close()
                    con.close()
        except Exception as error:
            logger.error("Error in the Extract Metastore function call %s", str(error))

    def snowflake_metastore_discovery(self):
        """Creates a connection and query to the Snowflake database."""
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

            con = self.connect_snowflake_conn(table_ref, bq_client)
            self.extract_metastore(con, gcs_client, bq_client, table_config, source_bucket_name, source_dataset, table_ref)
        except Exception as error:
            logger.error("Error in the main function call %s", str(error))
            sys.exit(1)
        finally:
            con.close()
