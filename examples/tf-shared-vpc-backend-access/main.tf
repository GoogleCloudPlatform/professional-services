# Copyright 2021 Google LLC
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#     https://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

locals {
  # This value can not be a variable since it's derived from another variable. You can redefine it here.
  example_server_image = "gcr.io/${var.cloud_run_project}/helloproxy"

  # Documentation here: https://cloud.google.com/vpc/docs/configure-serverless-vpc-access#firewall-rules-shared-vpc
  firewall_nat_ip_ranges         = ["107.178.230.64/26", "35.199.224.0/19", ]
  firewall_healthcheck_ip_ranges = ["130.211.0.0/22", "35.191.0.0/16", "108.170.220.0/23", ]
}

data "google_project" "project" {
  project_id = var.cloud_run_project
}