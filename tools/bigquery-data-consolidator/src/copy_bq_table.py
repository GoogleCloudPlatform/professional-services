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

"""
Python Utility To Copy BigQuery Table From One Dataset To Another
"""

# import required libraries.
# from google.cloud import bigquery

def copy_table(client, source_table_id, destination_table_id):

    # create copy job
    job = client.copy_table(source_table_id, destination_table_id)

    # Wait for the job to complete.
    job.result()

    # print a confirmation : optional, only for debug
    # print("A copy of all mentioned tables, above, is created in the destination dataset:" + destination_dataset)
    # print("In the destination dataset, the data is all consolidated under one table:" + destination_table_id)

# End of script.
