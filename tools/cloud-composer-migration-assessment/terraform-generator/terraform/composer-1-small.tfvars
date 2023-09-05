# Copyright 2023 Google Inc.
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#     http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

project_id                      = "cy-artifacts"
region                          = "us-central1"
environment_name                = "composer-1-small"
pypi_packages                   = {}
service_account                 = "488712714114-compute@developer.gserviceaccount.com"
network                         = "projects/cy-artifacts/global/networks/default"
environment_size                = "ENVIRONMENT_SIZE_SMALL"

scheduler_count                 = 1
scheduler_cpu                   = 0.5
scheduler_mem                   = 2
scheduler_storage               = 1

trigger_count                   = 1
trigger_cpu                     = 0.5
trigger_mem                     = 0.5

web_server_cpu                  = 0.5
web_server_mem                  = 2
web_server_storage              = 1

worker_cpu                      = 0.5
worker_mem                      = 2
worker_storage                  = 1
min_workers                     = 0
max_workers                     = 3