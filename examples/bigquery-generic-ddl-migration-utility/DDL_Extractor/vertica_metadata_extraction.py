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
"""Module to extract vertica metastore data"""
import sys
import datetime
import vertica_python
from google.cloud import storage
from utils.setup_logger import logger
from utils import utilities as UtilFunction


class VerticaMetastoreModule:
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
        bucket: str,
        project_id: str
    ) -> None:
        """Initialize the attributes"""
        self.username = username
        self.password = password
        self.host = host
        self.port = port
        self.dbname = dbname
        self.bucket = bucket
        self.project_id = project_id


    def connect_vertica_conn(self):
        """
        Initializes a connection pool for a Vertica.
        Uses the vertica_python Python package.
        """
        try:
            # Construct the connection string
            connection_string = f"vertica://{self.username}:{self.password}@{self.host}:{self.port}/{self.dbname}"
            logger.info("Connecting to the vertica Database...")
            # Connect to Vertica
            conn = vertica_python.connect(connection_string)
            return conn
        except Exception as error:
            logger.error("Connection Has Failed... %s", str(error))
            sys.exit(1)


    def extract_metastore_from_on_prem(self, conn: str):
        """Function to execute the core logic for metastore extraction"""
        try:
            cursor = conn.cursor()
            # Execute the metadata query
            query = """
                SELECT
                  column_name,
                  data_type,
                  character_maximum_length,
                  numeric_precision,
                  numeric_scale,
                  is_nullable,
                  is_unique,
                  is_primary_key,
                  is_foreign_key,
                  foreign_key_table_name,
                  foreign_key_column_name,
                FROM
                  v_catalog.columns
                WHERE
                  table_name = 'my_table'
                ORDER BY
                  column_name;
            """
            cursor.execute(query)

            # Fetch all the rows from the result set
            rows = cursor.fetchall()
            logger.info("---Extraction Completed\n")
            # Create a CSV string from the metadata rows
            csv_content = ""
            for row in rows:
                csv_content += ",".join(str(field) for field in row) + "\n"

            # Upload the CSV content to a GCS bucket
            storage_client = storage.Client()
            current_timestamp = datetime.datetime.now()
            UtilFunction.write_to_blob_from_file(
                storage_client, self.bucket, f"metadata{current_timestamp}.csv", csv_content
            )
            print("Metadata written to GCS bucket successfully!")

            # Close the cursor and connection
            cursor.close()
            conn.close()
        except vertica_python.Error as error:
            logger.error("Error connecting to Vertica Server: %s", str(error))
        except Exception as error:
            logger.error("Error when running the query %s", str(error))
            raise


    def vertica_metastore_discovery(self):
        """Creates a connection and query to the Mssql database."""
        try:
            conn = self.connect_vertica_conn()
            self.extract_metastore_from_on_prem(conn)
            conn.close()
        except Exception as error:
            logger.error("Error in the main function call %s", str(error))
            sys.exit(1)

