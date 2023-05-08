# Copyright 2023 Google LLC
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#     https://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

# Python utility to list tables in a BigQuery dataset. 

# import libraries. 
# from google.cloud import bigquery

# Function definition
def list_all_tables(client, project_id, dataset_id):
    """
    Input: Project and Dataset in which we are finding the tables from. 
    Output: Returns list of tables in the dataset. 
    """

    # Enter dataset ID here - hardcoded for testing purpose. 
    dataset_id = project_id + "." + dataset_id

    # create output/return list. 
    list_of_tables = set()

    # Make an API request.
    tables = set(client.list_tables(dataset_id, max_results=1000, timeout=300))

    # Return the list of tables
    for table in tables:
        if table.table_type == 'TABLE':
            list_of_tables.add(table.table_id)
    return (list_of_tables)

# End of program. 
