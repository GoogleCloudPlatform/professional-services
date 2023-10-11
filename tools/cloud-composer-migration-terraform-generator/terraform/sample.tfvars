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

project_id                      = "%%PROJECT_ID%%"
region                          = "%%REGION%%"
environment_name                = "%%ENVIRONMENT_NAME%%"
pypi_packages                   = %%PYPI_PACKAGES%%
service_account                 = %%SERVICE_ACCOUNT%%
network                         = %%VPC_NETWORK%%
environment_size                = "%%ENVIRONMENT_SIZE%%"

scheduler_count                 = %%SCHEDULER_COUNT%%
scheduler_cpu                   = %%SCHEDULER_CPU%%
scheduler_mem                   = %%SCHEDULER_MEM%%
scheduler_storage               = %%SCHEDULER_STORAGE%%

trigger_count                   = %%TRIGGER_COUNT%%
trigger_cpu                     = %%TRIGGER_CPU%%
trigger_mem                     = %%TRIGGER_MEM%%

web_server_cpu                  = %%WEB_SERVER_CPU%%
web_server_mem                  = %%WEB_SERVER_MEM%%
web_server_storage              = %%WEB_SERVER_STORAGE%%

worker_cpu                      = %%WORKER_CPU%%
worker_mem                      = %%WORKER_MEM%%
worker_storage                  = %%WORKER_STORAGE%%
min_workers                     = %%MIN_WORKERS%%
max_workers                     = %%MAX_WORKERS%%