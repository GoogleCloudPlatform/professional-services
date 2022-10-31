#!/bin/bash
# Copyright 2022 Google LLC
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
# http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

# gcp variables
project_id          = "%%PROJECT_ID%%"
pubsub_topic_name   = "reddit_data_capture"
bq_dataset_name     = "reddit_stream"
bq_table_name       = "comments_stream"
service_account_name = "reddit-vm"
app_bucket          = "%%APP_BUCKET%%"

#reddit variables
reddit_client_id        = "%%REDDIT_CLIENT_ID%%"
reddit_client_secret    = "%%REDDIT_CLIENT_SECRET%%"
reddit_username         = "%%REDDIT_USERNAME%%"
reddit_password         = "%%REDDIT_PASSWORD%%"

