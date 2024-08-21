#    Copyright 2023 Google LLC

#    Licensed under the Apache License, Version 2.0 (the "License");
#    you may not use this file except in compliance with the License.
#    You may obtain a copy of the License at

#        http://www.apache.org/licenses/LICENSE-2.0

#    Unless required by applicable law or agreed to in writing, software
#    distributed under the License is distributed on an "AS IS" BASIS,
#    WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
#    See the License for the specific language governing permissions and
#    limitations under the License.
""" Module for BQ DDL Validation as a DAG """

import argparse
import pandas as pd
from datetime import timezone
from google.cloud import storage
import json
from bq_ddl_validator.plugin.hive.hive import hive_connector
from bq_ddl_validator.audit_operation import fetch_cloud_sql_records, execute_update_command
from bq_ddl_validator.plugin.teradata.teradata import teradata_connector
from bq_ddl_validator.plugin.snowflake.snowflake import snowflake_connector
from bq_ddl_validator.plugin.oracle.oracle import oracle_connector
from bq_ddl_validator.utils import fetch_object_type_db_mapping, fetch_audit_table_information

def compare_two_df(audit_table_name, df_from_db, df_from_audit_table):
    # create an initial dataframe
    updated_df=pd.DataFrame(columns=['db_name', 'object_name', 'object_type', 'last_alter_time', 'last_alter_user', 'is_latest_record', 'insert_time'])
    # Keep check for the queries that need to be executed.
    execute_update_query, execute_insert_query = False, False

    # check for row in DB in Audit Table. If it does not exist, build an insert query.
    for _, row_db in df_from_db.iterrows():  
        exists = False
        for index_audit, row_audit in df_from_audit_table.iterrows():
            if row_db["object_name"]==row_audit["object_name"] and row_db["db_name"]==row_audit["db_name"]:
                exists = True
        
        if not exists:
            execute_insert_query = True
            print("object " + row_db["object_name"] + " does not exist. Adding new record")
            updated_df.loc[len(updated_df)] = row_db

    where_query = ""

    # Compare the timestamp for last alter time for each object in a specified db. If this is different for latest record, build the where query.
    for _, row_db in df_from_db.iterrows():  
        for index_audit, row_audit in df_from_audit_table.iterrows():
            if row_db["object_name"]==row_audit["object_name"] and row_db["db_name"]==row_audit["db_name"]:
                if row_audit["is_latest_record"] == True:
                    if row_db["last_alter_time"] != row_audit["last_alter_time"].replace(tzinfo=timezone.utc):
                        execute_update_query = True
                        execute_insert_query = True
                        updated_df.loc[len(updated_df)] = row_db
                        df_from_audit_table.at[index_audit, "is_latest_record"] = False
                        where_query += '(object_name=\"'+row_db["object_name"]+'\" AND db_name=\"'+row_db["db_name"]+'\") OR '
    # Clean the where query.
    where_query = where_query[:-4]

    # this means there is nothing updated.
    if updated_df.size == 0:
        print("No new rows to append")
        return False, "", False, ""
    
    # Build the INSERT and UPDATE queries.
    insert_sql_values_string = f"INSERT INTO {audit_table_name} VALUES "
    for _, row_db in updated_df.iterrows():
        insert_sql_values_string += f'(\"{row_db["db_name"]}\",\"{row_db["object_name"]}\",\"{row_db["object_type"]}\",\"{row_db["last_alter_time"]}\", \"{row_db["last_alter_user"]}\", {row_db["is_latest_record"]}, \"{row_db["insert_time"]}\") , '
    insert_sql_values_string = insert_sql_values_string[:-3]
    insert_sql_values_string+=";"


    update_sql_string = f"UPDATE {audit_table_name} SET is_latest_record = False WHERE "+where_query+";"

    # Calculate the new expected state of the audit table after insertion
    df_from_audit_table = df_from_audit_table.append(updated_df, ignore_index=True)
    
    print("##### Expected Audit Table State #####")
    print(df_from_audit_table.to_string())

    return execute_update_query, update_sql_string, execute_insert_query, insert_sql_values_string

def create_audit_table(db_type, instance_name, db_user, db_password):
    db_name, table_name = fetch_audit_table_information(db_type)
    cmd_validate = f"SELECT * FROM {db_name}.{table_name}"
    cmd = f"CREATE TABLE {db_name}.{table_name} (db_name varchar(255),object_name varchar(255),object_type varchar(255), last_alter_time DATETIME(6), last_alter_user varchar(255),is_latest_record BOOL, insert_time DATETIME(6));"
    # Run a simple select command to check table existance. if not, create the table.
    try:
        execute_update_command(cmd_validate,db_type, instance_name, db_user, db_password)
    except:
        execute_update_command(cmd,db_type, instance_name, db_user, db_password)


def run_ddl_validator(db_type, db, rs, obj_type, audit_instance_name, audit_db_user, audit_db_password):
    # Check if the Audit Table Exists. If not, create the audit table
    create_audit_table(db_type, audit_instance_name, audit_db_user, audit_db_password)
    
    # Fetch the name of the audit table for the given db_type.
    _, audit_table_name = fetch_audit_table_information(db_type)

    db_df = pd.DataFrame()

    # Fetch the current state of the audit table.
    print("##### Current Audit Table State #####")
    sql_df = fetch_cloud_sql_records(db_type, audit_instance_name, audit_db_user, audit_db_password)
    print(sql_df.to_string())

    # For the give object type, fetch respective object_type for the db type.
    object_type = ""
    if obj_type == "table" or obj_type == "view" or obj_type == "procedure":
        object_type = fetch_object_type_db_mapping(db_type,obj_type)
    else :
        print("Wrong Object Type")
        exit(1)

    # Call the connector plugin for the db type
    if db_type == "h" or db_type == "hive":
        print("##### All Tables/Views in DB #####")
        db_df = hive_connector(db, rs, object_type)

    elif db_type == "o" or db_type == "oracle":
        print("##### All Tables/Views/Procedures in DB #####")
        db_df = oracle_connector(db , rs, object_type)
                
    elif db_type == "s" or db_type == "snowflake":
        print("##### All Tables/Views/Procedures in DB #####")
        db_df = snowflake_connector(db , rs, object_type)

    elif db_type == "t" or db_type == "teradata":
        print("##### All Tables/Views/Procedures in DB #####")
        db_df = teradata_connector(db , rs, object_type)
    else:
        print("Database type not supported")
        exit(1)

    # Compare the dataframes and build the INSERT and UPDATE queries for audit table.
    print(db_df.to_string())
    execute_update_query, update_sql_string, execute_insert_query, insert_sql_values_string = compare_two_df(audit_table_name, db_df, sql_df)

    if execute_update_query :
        execute_update_command(update_sql_string,db_type,audit_instance_name, audit_db_user, audit_db_password )
    if execute_insert_query:
        execute_update_command(insert_sql_values_string, db_type,audit_instance_name, audit_db_user, audit_db_password)
    
    # As the queries are now executed, check the final audit table state.
    print("##### Final Audit Table State #####")
    sql_df = fetch_cloud_sql_records(db_type, audit_instance_name, audit_db_user, audit_db_password)
    print(sql_df.to_string())


def bq_ddl_validator(gcs_path):
    print ("Running DDL Validator")
    # Read the config from GCS path.
    gcs_path = gcs_path.split("//")[1]
    bucket_name = gcs_path.split("/")[0]
    file_path = gcs_path.split("/",1)[1]
    client = storage.Client()
    bucket = client.get_bucket(bucket_name)
    blob = bucket.get_blob(file_path)

    credentials = json.loads(blob.download_as_string())

    run_ddl_validator(credentials["db_type"], credentials["db_name"], credentials["resource_secret"], credentials["obj_type"], credentials["audit_instance_name"], credentials["audit_db_user"], credentials["audit_db_password"] )


if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument("-gcs_config_path=", "--gcs_config_path=", dest="gcs_config_path", default="gs://bq-ddl-validator/config.json", help="gcs path with credentials")
    args = parser.parse_args()
    bq_ddl_validator(args.gcs_config_path)