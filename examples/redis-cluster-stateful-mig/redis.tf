# Copyright 2024 Google LLC
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

module "exmaple-redis" {
  source                     = "./redis"
  hostname                   = var.redis_host_name
  project_id                 = var.project_id
  region                     = var.region
  target_size                = 6
  autoscaling_enabled        = false
  wait_for_instances         = true
  distribution_policy_zones  = var.redis_distribution_policy_zones
  redis_service_account_name = var.redis_service_account_name
  subnetwork                 = var.redis_subnetwork
  machine_type               = "n1-standard-2"
  healthchecks               = {}

  persistent_disk = [{
    device_name  = "data-disk"
    auto_delete  = false
    boot         = false
    disk_size_gb = 40
    delete_rule  = "ON_PERMANENT_INSTANCE_DELETION"
  }]

  update_policy = {
    "example-update-policy" = {
      instance_redistribution_type = "NONE"
      max_surge_fixed               = 0
      max_unavailable_fixed         = 3
      min_ready_sec                = 60
      replacement_method           = "RECREATE"
      minimal_action               = "REPLACE"
      type                         = "OPPORTUNISTIC"
    }
  }

  mig_timeouts = {
    create = "30m"
    update = "30m"
    delete = "30m"
  }
}