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
""" Module for checking number of bytes processed by a query """

from google.cloud import bigquery

def dry(query):
    # Construct a BigQuery client object.
    client = bigquery.Client()
    job_config = bigquery.QueryJobConfig(dry_run=True, use_query_cache=False)
    # Start the query, passing in the extra configuration.
    try:
        query_job = client.query(query,job_config=job_config,)  # Make an API request.
        print("This query will process {} bytes.".format(query_job.total_bytes_processed))
        return True,None
    except Exception as e: # work on python 3.x
        return False,str(e)

# file_path = "/Users/rishabkhawad/validation_utility/test_files/test_files_demo/BQ_output/sales117_ba.sql"
# print(dry(file_path))
