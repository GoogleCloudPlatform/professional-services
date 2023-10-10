# Copyright 2023 Google LLC

# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at

# http://www.apache.org/licenses/LICENSE-2.0

# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.
""" Module for Teradata BQ DDL Connector """

import teradatasql
import json
import pandas as pd
from datetime import datetime, timezone
from google.cloud import secretmanager

def teradata_connector (query_db_name, secret_resource_id, object_type): 
 client_secret = secretmanager.SecretManagerServiceClient()
 response = client_secret.access_secret_version(request={"name": secret_resource_id})
 secret_val = response.payload.data.decode("UTF-8")
 credentials = json.loads(secret_val)
 
 td_connect = teradatasql.connect(
 host=credentials["db_instance"], 
 user=credentials["db_user"], 
 password=credentials["db_password"]
 )

 cursor = td_connect.cursor()

 cursor.execute(f"USE TablesV")
 cursor.execute(f"SELECT db AS db_name, tablename AS object_name, TableKind AS object_type, lastaltertime AS last_alter_time, lastalter_user AS last_alter_user FROM metatable WHERE db=\"{query_db_name}\" AND TableKind=\"{object_type}\"")
 df = pd.DataFrame(cursor.fetchall(), columns = ['db_name', 'object_name', 'object_type', 'last_alter_time', 'last_alter_user'])
 df['is_latest_record'] = True
 df['insert_time'] = datetime.now(timezone.utc)
 return df