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
This file has all the variables used by cloud_function_automation.py script.
"""
# Action to be taken, Values can be either CREATE or DELETE
ACTION = "CREATE"

# Provide GCP Project ID
PROJECT_ID = "abc"

# Provide GCP Project Number
PROJECT_NUMBER = "123"

# Provide GCP Pub/Sub name to be created
PUBSUB_TOPIC_NAME = "sampletopic"

# Provide GCP Log Router Sink name to be created
SINK_NAME = "samplesink"

# Provide filter query for log sink
LOG_SINK_FILTER = 'resource.type="gce_instance" protoPayload.methodName=' \
                  '("beta.compute.instances.insert" OR ' \
                  '"v1.compute.instances.insert") operation.first=true'

# Provide required details about cloud function
# CLOUD_FUNCTION_NAME: provide cloud function name,
#                      make sure your script has a function same as function name
# CLOUD_FUNCTION_ZIP_FILE_PATH: <path_of_zip_file_to_be_deployed>
# A sample of zip file has been uploaded
# CLOUD_FUNCTION_LOCATION: location where function should be created
# CLOUD_FUNCTION_RUNTIME: Runtime for cloud function
CLOUD_FUNCTION_CONFIG = {"CLOUD_FUNCTION_NAME": "hello_pubsub",
                         "CLOUD_FUNCTION_ZIP_FILE_PATH":
                             "gs://cloud_funtion_abc/function-source.zip",
                         "CLOUD_FUNCTION_LOCATION": "us-central1",
                         "CLOUD_FUNCTION_RUNTIME": "python39"}

