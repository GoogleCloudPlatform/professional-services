# Copyright 2019 Google Inc.
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


variable "project_id" {
  description = "Unique ID for your GCP project"
}

variable "app_engine_region" {
  description = "Region for Cloud Scheduler; must be the same as App Engine region"
  default     = "us-east1"
}

variable "cloud_functions_region" {
  description = "Region for Cloud Functions"
  default     = "us-east1"
}

variable "stt_queue_topic_name" {
  description = "Name for PubSub topic that will hold queue of STT jobs"
  default     = "stt_queue"
}

variable "stt_queue_subscription_name" {
  description = "Name for PubSub subscription to pull STT jobs ids from topic"
  default     = "pull_stt_ids"
}

variable "cron_topic_name" {
  description = "Name for PubSub topic that will trigger Read STT Function from Cloud Scheduler"
  default     = "cron_topic"
}

variable "scheduler_frequency" {
  description = "Frequency in UNIX cron that determines how often Cloud Scheduler will run"
  default     = "*/10 * * * *"
}