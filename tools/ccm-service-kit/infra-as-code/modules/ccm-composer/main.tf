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

resource "google_composer_environment" "composer_intance" {
  project = var.project_id
  name    = var.composer.instance_name
  region  = var.region

  config {
    software_config {
      image_version = var.composer.image
      env_variables = var.composer.env_variables
    }

    node_config {
      network         = var.composer.network_id
      subnetwork      = var.composer.subnetwork_id
      service_account = var.composer.service_account
    }

    private_environment_config {
      enable_private_endpoint = var.composer.private_ip
    }

  }
}