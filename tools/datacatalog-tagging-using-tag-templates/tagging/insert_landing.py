"""
Copyright 2023 Google LLC

   Licensed under the Apache License, Version 2.0 (the "License");
   you may not use this file except in compliance with the License.
   You may obtain a copy of the License at

       http://www.apache.org/licenses/LICENSE-2.0

   Unless required by applicable law or agreed to in writing, software
   distributed under the License is distributed on an "AS IS" BASIS,
   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   See the License for the specific language governing permissions and
   limitations under the License.

"""

import json
from datetime import datetime
import hashlib
import time
import random
from google.cloud import bigquery


# Create a global declared BigQuery client
client = bigquery.Client()


def generate_hash(row):
    """
    Handles missing keys (fields)
    and generates MD5 hash
    """
    fields = [
        "projectname",
        "datasetname",
        "tablename",
        "columnname",
        "level",
        "tagtemplate",
    ]
    # expected fields as primary
    str_values = [
        row.get(field, "") for field in fields
    ]  # Get value or empty string if missing
    concatenated_string = "".join(str_values)
    return hashlib.md5(concatenated_string.encode()).hexdigest()


def insert_landing():
    """Specify BigQuery project ID, dataset ID, and table ID"""
    dataset_id = "test1"
    table_id = "Enterprise_Data_Catalog_Master_Landing"

    # Load schema from BigQuery table (ensures correct mapping)
    table_ref = client.dataset(dataset_id).table(table_id)
    table = client.get_table(table_ref)
    # Load data from JSON file
    with open("data1.json", "r", encoding="utf-8") as f:
        data = json.load(f)
    if len(data) == 0:
        return "no data"
    for row in data:
        # add additional column values
        md5_hash = generate_hash(row)
        row["createtimestamp"] = datetime.utcnow().isoformat()
        row["activeflag"] = "true"
        row["tagflag"] = "false"
        row["id"] = md5_hash

    # Insert rows into BigQuery table
    errors = client.insert_rows_json(table, data)

    if errors == []:
        print("New rows have been added.")
    else:
        print(f"Encountered errors while inserting rows: {errors}")
    return "success"


def truncate_landing():
    """Construct a BigQuery client object."""
    client1 = bigquery.Client()
    # truncate sql
    query1 = """
            Truncate table `test-datahub.test1.Enterprise_Data_Catalog_Master_Landing`
            """
    query_job = client1.query(query1)
    query_job.result()
    return "success"


if __name__ == "__main__":
    TRUNC = truncate_landing()
    print("Truncate landing done : " + str(TRUNC))
    MAX_TRIES = 5
    DELAY = 10
    BACKOFF = 2
    for i in range(MAX_TRIES):
        try:
            RESULT = insert_landing()
            print("insert into landing done : " + str(RESULT))
            break  # Success, exit the loop
        except Exception as e:
            print(f"Caught error: {repr(e)}")
            if i == MAX_TRIES - 1:
                raise  # Re-raise the exception if MAX_TRIES reached
            DELAY_TIME = DELAY * BACKOFF
            jitter = random.uniform(0, 1) * DELAY_TIME  # jitter for randomness
            time.sleep(DELAY_TIME + jitter)
            print(f"Retrying after {DELAY_TIME} seconds...")
