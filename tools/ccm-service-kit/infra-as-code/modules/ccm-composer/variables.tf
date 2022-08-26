# Copyright 2022 Google LLC All Rights Reserved.
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
  description = "Project ID where all this will be steup."
  type        = string
}

variable "region" {
  description = "Region where all this will be steup."
  type        = string
}

variable "composer" {
    description = "Composer properties"
    type = object({
        instance_name       = string
        image               = string
        #node_count          = number # not needed in Airflow 2
        #machine_type        = string # not needed in Airflow 2
        network_id          = string
        subnetwork_id       = string
        service_account     = string
        private_ip          = bool
        env_variables       = map(string)
    })
    default = {
        instance_name           = null
        image                   = "composer-2.0.7-airflow-2.2.3"
        #machine_type            = "n1-standard-1"
        network_id              = "default"
        subnetwork_id           = "default"
        service_account         = null
        private_ip              = true
        env_variables           = null
    }
}