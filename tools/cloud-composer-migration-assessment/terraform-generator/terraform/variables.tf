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

variable "project_id" {
    default = ""
}

variable "project_number" {
    default = ""
}

variable "region" {
    default = ""
}

variable "environment_name" {
    default = ""
}

variable "network" {
    default = ""
}

variable "service_account" {
    default = ""
}

variable "pypi_packages" {
    default = ""
}

variable "environment_size" {
    default = ""
}

variable "scheduler_count" {
    default = ""
}
variable "scheduler_cpu" {
    default = ""
}
variable "scheduler_mem" {
    default = ""
}
variable "scheduler_storage" {
    default = ""
}

variable "trigger_count" {
    default = ""
}
variable "trigger_cpu" {
    default = ""
}
variable "trigger_mem" {
    default = ""
}

variable "web_server_cpu" {
    default = ""
}
variable "web_server_mem" {
    default = ""
}
variable "web_server_storage" {
    default = ""
}

variable "worker_cpu" {
    default = ""
}
variable "worker_mem" {
    default = ""
}
variable "worker_storage" {
    default = ""
}
variable "min_workers" {
    default = ""
}
variable "max_workers" {
    default = ""
}