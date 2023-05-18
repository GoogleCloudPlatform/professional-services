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
""" Module to handle the audit operations """

from google.cloud.sql.connector import Connector
import sqlalchemy
import pandas as pd
from utils import fetch_audit_table_information

# Global variables with Audit DB Credentials
connector = Connector()
audit_db = ""
audit_table = ""
audit_db_instance="" 
audit_db_user=""
audit_db_password=""

# Use global variables to dynamically set the connector credentials
def getconn():
    global audit_db, audit_db_instance, audit_db_user, audit_db_password
    conn= connector.connect(
        audit_db_instance,
        "pymysql",
        user=audit_db_user,
        db= audit_db,
        password = audit_db_password
    )
    return conn

def set_audit_table_name(db_type, db_instance, db_user, db_password):
    global audit_db, audit_table, audit_db_instance, audit_db_user, audit_db_password
    # Fethc the audit db and table based on db type. Set the rest global variables.
    audit_db, audit_table = fetch_audit_table_information(db_type)
    audit_db_instance = db_instance
    audit_db_user = db_user
    audit_db_password = db_password


def fetch_cloud_sql_records(db_type, db_instance, db_user, db_password):
    global audit_db, audit_table
    set_audit_table_name(db_type, db_instance, db_user, db_password)
    # create connection pool
    pool = sqlalchemy.create_engine(
        "mysql+pymysql://",
        creator=getconn,
    )

    ### Dataframe and Table structure
    df=pd.DataFrame(columns=['db_name', 'object_name', 'object_type', 'last_alter_time', 'last_alter_user', 'is_latest_record', 'insert_time'])

    with pool.connect() as db_conn:
        # Get all the records
        op = db_conn.execute(f"SELECT * from {audit_table};")
        all_rows = op.fetchall()
        # Add row data to the dataframe
        for row in all_rows:
            lst=[row[0], row[1], row[2], row[3], row[4], row[5], row[6]]
            df.loc[len(df)] = lst
    return df

# Execute any generic SQL command on the audit table
def execute_update_command(cmd, db_type, instance_name, db_user, db_password):
    global audit_db
    set_audit_table_name(db_type, instance_name, db_user, db_password)
    # create connection pool
    pool = sqlalchemy.create_engine(
        "mysql+pymysql://",
        creator=getconn,
    )

    with pool.connect() as db_conn:
        _ = db_conn.execute(cmd)

