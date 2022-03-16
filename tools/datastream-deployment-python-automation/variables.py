# Copyright 2022 Google LLC
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

"""
This file has all the variables used by create_connection_profiles_and_datastream.py script
"""
PROJECT_ID = "arunsinghk"
GCP_LOCATION = "us-central1"
source_profile_config = {"source_profile_name": "test-source-name",
                         "source_profile_id": "test-source-id",
                         "source_db_hostname": "1.2.3.4",
                         "source_db_port": 3306,
                         "source_db_username": "datastream"}
destination_profile_config = {"destination_profile_name": "test-destination-name",
                              "destination_profile_id": "test-destination-id",
                              "storage_bucket_name": "data-stream-script-test",
                              "storage_bucket_prefix": "/"}
stream_config = {"stream_id": "test-stream-id",
                 "stream_name": "test-stream-name"}
