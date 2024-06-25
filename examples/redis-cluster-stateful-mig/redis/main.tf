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

resource "google_compute_region_instance_group_manager" "this" {
  name               = var.mig_name == "" ? "${var.hostname}-mig" : var.mig_name
  region             = var.region
  base_instance_name = var.hostname
  project            = var.project_id
  target_pools       = var.target_pools
  target_size        = var.autoscaling_enabled ? null : var.target_size
  wait_for_instances = var.wait_for_instances

  version {
    name              = "${var.hostname}-mig-version-0"
    instance_template = google_compute_instance_template.redis_instance_template.self_link
  }

  dynamic "auto_healing_policies" {
    for_each = var.healthchecks
    content {
      health_check      = "/"
      initial_delay_sec = "30"
    }
  }

  dynamic "stateful_disk" {
    for_each = var.persistent_disk
    content {
      device_name = stateful_disk.value.device_name
      delete_rule = stateful_disk.value.delete_rule
    }
  }

  distribution_policy_zones = var.distribution_policy_zones
  dynamic "update_policy" {
    for_each = var.update_policy
    content {
      instance_redistribution_type = lookup(update_policy.value, "instance_redistribution_type", null)
      max_surge_fixed              = lookup(update_policy.value, "max_surge_fixed", null)
      max_surge_percent            = lookup(update_policy.value, "max_surge_percent", null)
      max_unavailable_fixed        = lookup(update_policy.value, "max_unavailable_fixed", null)
      max_unavailable_percent      = lookup(update_policy.value, "max_unavailable_percent", null)
      replacement_method           = lookup(update_policy.value, "replacement_method", null)
      minimal_action               = lookup(update_policy.value, "minimal_action", null)
      type                         = lookup(update_policy.value, "type", null)
      #min_ready_sec                = lookup(update_policy.value, "min_ready_sec", null)
    }
  }

  lifecycle {
    create_before_destroy = true
    ignore_changes        = [distribution_policy_zones]
  }

  timeouts {
    create = var.mig_timeouts.create
    update = var.mig_timeouts.update
    delete = var.mig_timeouts.delete
  }
}

