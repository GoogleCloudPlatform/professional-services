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
""" Module for Hive BQ DDL Connector """

from google.cloud.sql.connector import Connector
import sqlalchemy
import json
import pandas as pd
from google.cloud import secretmanager
from datetime import datetime, timezone

# initialize Connector object
connector = Connector()
secret_resource_id = ""

# function to return the database connection
def getconn():
    global secret_resource_id
    client_secret = secretmanager.SecretManagerServiceClient()
    response = client_secret.access_secret_version(request={"name": secret_resource_id})
    secret_val = response.payload.data.decode("UTF-8")
    credentials = json.loads(secret_val)

    ## This is to connect with Hive Metastore
    conn= connector.connect(
        credentials["db_instance"],
        "pymysql",
        user=credentials["db_username"],
        db= credentials["db_name"],
        password=credentials["db_password"]
    )
    return conn

def hive_connector(query_db_name, secret_resource_id_input, object_type):
    global secret_resource_id
    secret_resource_id = secret_resource_id_input
    # create connection pool
    pool = sqlalchemy.create_engine(
        "mysql+pymysql://",
        creator=getconn,
    )

    ### Dataframe structure
    df=pd.DataFrame(columns=['db_name', 'object_name', 'object_type', 'last_alter_time', 'last_alter_user', 'is_latest_record', 'insert_time'])

    with pool.connect() as db_conn:
        ## Have a distincting based on view/table
        op = db_conn.execute(f"SELECT c.TBL_ID, c.TBL_NAME, d.PARAM_KEY, d.PARAM_VALUE, e.NAME, c.TBL_TYPE FROM TBLS c INNER JOIN TABLE_PARAMS d INNER JOIN DBS e WHERE c.TBL_ID=d.TBL_ID AND c.DB_ID=e.DB_ID AND e.NAME=\"{query_db_name}\" AND (d.PARAM_KEY=\"transient_lastDdlTime\" OR d.PARAM_KEY=\"last_modified_by\") AND c.TBL_TYPE=\"{object_type}\"  ORDER BY c.TBL_NAME, e.NAME;").fetchall()

        for x in range(len(op)):
            if op[x][2] == "transient_lastDdlTime":
                if x-1<0 or op[x][1] != op[x-1][1]:
                    lst = [op[x][4], op[x][1], object_type, datetime.fromtimestamp(float(op[x][3]), timezone.utc), "N/A", True, datetime.now(timezone.utc)]
                    df.loc[len(df)] = lst
                else:
                    lst = [op[x][4], op[x][1], object_type, datetime.fromtimestamp(float(op[x][3]), timezone.utc), op[x-1][3], True, datetime.now(timezone.utc)]
                    df.loc[len(df)] = lst

    return df
