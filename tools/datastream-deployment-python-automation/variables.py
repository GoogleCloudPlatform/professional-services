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

# source_database_type can be either mysql or oracle
source_database_type = {"db_type": "oracle"}

# connection_type can be either staticServiceIpConnectivity or privateConnectivity
source_profile_connection_type = {"connection_type": "privateConnectivity"}

# If using staticServiceIpConnectivity update source_profile_config_mysql
source_profile_config_mysql = {"source_profile_name": "test-source-name",
                               "source_profile_id": "test-source-id",
                               "source_db_hostname": "34.121.165.152",
                               "source_db_port": 3306,
                               "source_db_username": "datastream"}

# If using staticServiceIpConnectivity update private_connectivity_config and private_source_profile_config_oracle
private_connectivity_config = {"private_conn_display_name": "test123",
                               "private_conn_id": "test123",
                               "vpc_path": "projects/arunsinghk/global/networks/default",
                               "subnet_range": "10.36.0.0/29"}

private_source_profile_config_oracle = {"private_source_profile_name": "test-source-name",
                                        "private_source_profile_id": "test-source-id",
                                        "private_source_db_hostname": "10.128.0.7",
                                        "private_source_db_port": 1521,
                                        "private_source_db_username": "datastream",
                                        "private_source_db_service": "ORCLDB19C"}

destination_profile_config = {"destination_profile_name": "test-destination-name",
                              "destination_profile_id": "test-destination-id",
                              "storage_bucket_name": "lets-try-oracle",
                              "storage_bucket_prefix": "/"}
stream_config = {"stream_id": "test-stream-id",
                 "stream_name": "test-stream-name"}
