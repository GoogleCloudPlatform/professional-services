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
"""Module to extract mssql metastore data from on-prem database"""
import sys
import pyodbc
from google.cloud import storage, bigquery
from utils.setup_logger import logger
from utils.utilities import UtilFunction


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

    def connect_mssql_conn(self):
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
        except Exception as error:
            logger.error("Connection Has Failed... %s", str(error))
            sys.exit(1)
        return conn

    def extract_metastore_from_on_prem(self, conn: str):
        """Function to execute the core logic for metastore extraction"""
        try:
            cursor = conn.cursor()
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
                query = f"""
                    exec sp_GetDDL '[{row[0]}].[{row[1]}]'
                """
                cursor.execute(query)
                ddl_rows= cursor.fetchall()
                content += str(ddl_rows) + "\n"

            # Upload the CSV content to a GCS bucket
            storage_client = storage.Client()
            UtilFunction.write_to_blob_from_file(
                storage_client, self.bucket, "metadata.csv", content
            )
            print("Metadata written to GCS bucket successfully!")

            # Close the cursor and connection
            cursor.close()
            conn.close()
        except pyodbc.Error as error:
            logger.error("Error connecting to SQL Server: %s", str(error))
        except Exception as error:
            logger.error("Error when running the query %s", str(error))
            raise

    # def mssql_metastore_discovery(self):
    #     """Creates a connection and query to the Mssql database."""
    #     try:
    #         conn = self.connect_mssql_conn()
    #         self.extract_metastore_from_on_prem(conn)
    #     except Exception as error:
    #         logger.error("Error in the main function call %s", str(error))
    #         sys.exit(1)
    #     finally:
    #         conn.close()

    def mssql_metastore_discovery(self):
        """Creates a connection and query to the Mssql database."""
        try:
            conn = self.connect_mssql_conn()
            config_source_bucket_name = self.gcs_config_path.split("//")[1].split("/")[0]
            config_source_prefix = self.gcs_config_path.split(config_source_bucket_name + "/")[1]
            # Read Config File values:
            gcs_client = storage.Client(self.project_id)
            config_string = UtilFunction.readgcs_file(
                 gcs_client, config_source_bucket_name, config_source_prefix
            )
            migration_config_dict = UtilFunction.parse_json(config_string)

            # Read variable values define in config file
            gcs_source_path = migration_config_dict["gcs_source_path"]
            dataset_location = migration_config_dict["dataset_location"]
            source_bucket_name = migration_config_dict["source_bucket_name"]
            source_dataset = gcs_source_path.split("//")[1].split("/")[1]
            target_dataset = migration_config_dict["target_dataset"]

            client = bigquery.Client(project=self.project_id, location=dataset_location)

            table_ref = UtilFunction.create_log_table(self.project_id, target_dataset, client)

            self.extract_metastore_from_on_prem(conn)
        except Exception as error:
            logger.error("Error in the main function call %s", str(error))
            sys.exit(1)
        finally:
            conn.close()


    # try:
    #     client_secret = secretmanager.SecretManagerServiceClient()
    #     response = client_secret.access_secret_version(name=secret_resource_id)
    #     secret_val = response.payload.data.decode("UTF-8")
    #     credentials = json.loads(secret_val)
    #     credentials_str = (
    #         credentials["user"]
    #         + "/"
    #         + credentials["password"]
    #         + "@"
    #         + credentials["host"]
    #         + ":"
    #         + credentials["port"]
    #         + "/"
    #         + credentials["db"]
    #     )
    #     # This is needed only in the case of oracle thick client
    #     oracledb.init_oracle_client(lib_dir=instant_client_path)
    #     con = oracledb.connect(credentials_str)
    # except oracledb.DatabaseError as ex:
    #     print(f"Connection to oracle failed: {str(ex)}")
    #     failure_record = [
    #         (
    #             datetime.datetime.now().strftime("%s"),
    #             None,
    #             None,
    #             None,
    #             "DatabaseError",
    #             str(ex),
    #             "Failed",
    #             "Check the connection credentials",
    #         )
    #     ]
    #     log_table_data(table_ref, client, failure_record)
    #     raise Exception(str(ex)) from ex
    # else:
    #     cursor = con.cursor()
    #     con.outputtypehandler = output_type_handler
    #     for row in migration_config_dict["table_config"]:
    #         try:
    #             query = f"""
    #                 WITH cte_sql AS
    #                 (
    #                     select  table_name table_name, 0 seq, 'CREATE TABLE ' || rtrim(owner)||'.'||rtrim(table_name) || '(' AS sql_out
    #                     from all_tab_columns where owner = upper('{0}') AND table_name  in (upper('{1}')
    #                 ) 
    #                 union
    #                     select table_name table_name,
    #                     column_id seq,
    #                     decode(column_id,1,' ',' ,')||
    #                     rtrim(column_name)||' '|| 
    #                     rtrim(data_type) ||' '||
    #                     rtrim(decode(data_type,'DATE',null,'LONG',null,
    #                         'NUMBER',decode(to_char(data_precision),null,null,'('),
    #                         '(')) ||
    #                     rtrim(decode(data_type,
    #                         'DATE',null,
    #                         'CHAR',data_length,
    #                         'VARCHAR2',data_length,
    #                         'NUMBER',decode(to_char(data_precision),null,null,
    #                             to_char(data_precision) || ',' || to_char(data_scale)),
    #                         'LONG',null,
    #                         '')) ||
    #                     rtrim(decode(data_type,'DATE',null,'LONG',null,
    #                         'NUMBER',decode(to_char(data_precision),null,null,')'),
    #                         ')')) ||' '||
    #                     rtrim(decode(nullable,'N','NOT NULL',null)) AS sql_out
    #                     from all_tab_columns where owner = upper('{row["table_name"].split(".")[0].strip()}') AND table_name  in ( upper('{row["table_name"].split(".")[1].strip()}'))
    #                     union
    #                     select  table_name table_name,
    #                             999999 seq,
    #                             ')' AS sql_out
    #                     from all_tab_columns
    #                     where owner = upper('{row["table_name"].split(".")[0].strip()}')
    #                     AND table_name  in (upper('{row["table_name"].split(".")[1].strip()}'))
    #                     ) 
    #                     select
    #                     xmlagg (xmlelement (e, sql_out || '') ORDER BY seq).extract ('//text()').getclobval() sql_output
    #                     from
    #                     cte_sql
    #                     group by
    #                     table_name"""
    #             cursor.execute(query)
    #             output = cursor.fetchone()
    #             output_str = "".join(output)
    #             write_to_blob(
    #                 gcs_client,
    #                 bucket_name=source_bucket_name,
    #                 file_name=f"{source_dataset}/{row['table_name'].split('.')[0].strip()}-\
    #                     {row['table_name'].split('.')[1].strip()}.sql",
    #                 content=output_str,
    #             )
    #         except Exception as ex:
    #             failure_record = [
    #                 (
    #                     datetime.datetime.now().strftime("%s"),
    #                     None,
    #                     row["table_name"].split(".")[0].strip(),
    #                     row["table_name"].split(".")[1].strip(),
    #                     "Excecution Error",
    #                     str(ex),
    #                     "Failed",
    #                     "Check the query",
    #                 )
    #             ]
    #             log_table_data(table_ref, client, failure_record)
    #         else:
    #             print(
    #                 f"DDL Generated Successfully for table \
    #                     {row['table_name'].split('.')[1].strip()}"
    #             )
    #             file_path = f"gs://{source_bucket_name}/{source_dataset}/\
    #                 {row['table_name'].split('.')[0].strip()}-{row['table_name'].split('.')[1].strip()}.sql"
    #             success_record = [
    #                 (
    #                     datetime.datetime.now().strftime("%s"),
    #                     file_path,
    #                     row["table_name"].split(".")[0].strip(),
    #                     row["table_name"].split(".")[1].strip(),
    #                     "DDL Extraction",
    #                     "DDL Generated Successfully",
    #                     "Success",
    #                     None,
    #                 )
    #             ]
    #             log_table_data(table_ref, client, success_record)
    #     con.commit()
    #     print(
    #         "Connection close in case of failure of any table check the log table in Big Query"
    #     )

    #     if cursor:
    #         cursor.close()
    #     if con:
    #         con.close()