# Copyright 2019 Google LLC
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


module "vpc" {
  source  = "terraform-google-modules/network/google"
  version = "3.3.0"

  project_id   = var.project_id
  network_name = var.vpc_name

  mtu = 1460

  auto_create_subnetworks = false
  routing_mode            = "GLOBAL"

  subnets = [
    for subnet in var.subnets : {
      subnet_name = subnet.name

      subnet_ip     = subnet.ip
      subnet_region = subnet.region

      subnet_private_access = true

      subnet_flow_logs          = true
      subnet_flow_logs_interval = "INTERVAL_5_SEC"
      subnet_flow_logs_sampling = "0.5"
      subnet_flow_logs_metadata = "INCLUDE_ALL_METADATA"
    }]
}