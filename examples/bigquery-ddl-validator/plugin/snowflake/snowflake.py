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
""" Module for Snowflake BQ DDL Connector """

import snowflake.connector
import pandas as pd
import json
from datetime import datetime, timezone
from utils import fetch_object_type_db_mapping
from google.cloud import secretmanager

global_db_type = "snowflake"

def snowflake_connector(query_db_name, secret_resource_id, object_type):
    global global_db_type
    client_secret = secretmanager.SecretManagerServiceClient()
    response = client_secret.access_secret_version(request={"name": secret_resource_id})
    secret_val = response.payload.data.decode("UTF-8")
    credentials = json.loads(secret_val)
    conn = snowflake.connector.connect(
        user = credentials["db_user"],
        password = credentials["db_password"],
        account = credentials["db_account"]
    )
    cursor = conn.cursor()

    df = pd.DataFrame()
    if object_type == fetch_object_type_db_mapping(global_db_type, "table"):
        cursor.execute(f"Select table_catalog, table_name, last_altered, last_ddl_by from {query_db_name}.information_schema.tables;")
        df_temp = pd.DataFrame(cursor.fetchall(), columns=['db_name', 'object_name', 'last_alter_time', 'last_alter_user'])
        df = df_temp[df_temp.last_alter_time.notnull()]
    elif object_type == fetch_object_type_db_mapping(global_db_type, "procedure"):
        cursor.execute(f"Select procedure_catalog, procedure_name, last_altered from {query_db_name}.information_schema.procedures;") 
        df_temp = pd.DataFrame(cursor.fetchall(), columns=['db_name', 'object_name', 'last_alter_time'])
        df = df_temp
        df = df_temp[df_temp.last_alter_time.notnull()]
        df['last_alter_user'] = 'Nan'
    elif object_type == fetch_object_type_db_mapping(global_db_type, "view"):
        cursor.execute(f"Select table_catalog, table_name, last_altered from {query_db_name}.information_schema.views;") 
        df_temp = pd.DataFrame(cursor.fetchall(), columns=['db_name', 'object_name', 'last_alter_time'])
        df = df_temp
        df = df_temp[df_temp.last_alter_time.notnull()]
        df['last_alter_user'] = 'Nan' 
    
    print(df.to_string())

    df.loc[:,'insert_time'] = datetime.now(timezone.utc)
    df.loc[:,'is_latest_record'] = 'true'
    df.loc[:,'object_type'] = object_type
    df = df[['db_name', 'object_name', 'object_type', 'last_alter_time', 'last_alter_user', 'is_latest_record', 'insert_time']]
    return df

