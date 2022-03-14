"""
This file has all the variables used by create_connection_profiles_and_datastream.py script
"""
PROJECT_ID = "arunsinghk"
GCP_LOCATION = "us-central1"
source_profile_config = {"source_profile_name": "test-source-name",
                         "source_profile_id": "test-source-id",
                         "source_db_hostname": "34.121.165.152",
                         "source_db_port": 3306,
                         "source_db_username": "datastream"}
destination_profile_config = {"destination_profile_name": "test-destination-name",
                              "destination_profile_id": "test-destination-id",
                              "storage_bucket_name": "data-stream-script-test",
                              "storage_bucket_prefix": "/"}
stream_config = {"stream_id": "test-stream-id",
                 "stream_name": "test-stream-name"}
