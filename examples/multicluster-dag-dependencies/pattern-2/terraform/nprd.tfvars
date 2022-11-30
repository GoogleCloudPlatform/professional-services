# Copyright 2022 Google Inc.
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

project_id = "<<project-id>>"
workflow_status_schema_name = "workflow_status_schema_p2"
workflow_status_topic = "workflow_status_topic_p2"
env="dev"
region="northamerica-northeast1"
dag_dependency_bucket="<<dag_dependency_bucket>>"
trigger_topic="projects/<<project-id>>/topics/workflow_status_topic_p2"
composer_service_account=["<<composer-service-account>>"]
cloud_function_serivce_account="<<cloud-function-service-account>>"