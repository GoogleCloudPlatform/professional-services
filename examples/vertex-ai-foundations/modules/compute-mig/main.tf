/**
 * Copyright 2022 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

locals {
  health_check = (
    try(var.auto_healing_policies.health_check, null) == null
    ? try(google_compute_health_check.default.0.self_link, null)
    : try(var.auto_healing_policies.health_check, null)
  )
  instance_group_manager = (
    local.is_regional ?
    google_compute_region_instance_group_manager.default :
    google_compute_instance_group_manager.default
  )
  is_regional = length(split("-", var.location)) == 2
}

resource "google_compute_instance_group_manager" "default" {
  provider                  = google-beta
  count                     = local.is_regional ? 0 : 1
  project                   = var.project_id
  zone                      = var.location
  name                      = var.name
  base_instance_name        = var.name
  description               = var.description
  target_size               = var.target_size
  target_pools              = var.target_pools
  wait_for_instances        = try(var.wait_for_instances.enabled, null)
  wait_for_instances_status = try(var.wait_for_instances.status, null)

  dynamic "all_instances_config" {
    for_each = var.all_instances_config == null ? [] : [""]
    content {
      labels   = try(var.all_instances_config.labels, null)
      metadata = try(var.all_instances_config.metadata, null)
    }
  }

  dynamic "auto_healing_policies" {
    for_each = var.auto_healing_policies == null ? [] : [""]
    iterator = config
    content {
      health_check      = local.health_check
      initial_delay_sec = var.auto_healing_policies.initial_delay_sec
    }
  }

  dynamic "named_port" {
    for_each = var.named_ports == null ? {} : var.named_ports
    iterator = config
    content {
      name = config.key
      port = config.value
    }
  }

  dynamic "stateful_disk" {
    for_each = var.stateful_disks
    content {
      device_name = stateful_disk.key
      delete_rule = stateful_disk.value
    }
  }

  dynamic "update_policy" {
    for_each = var.update_policy == null ? [] : [var.update_policy]
    iterator = p
    content {
      minimal_action                 = p.value.minimal_action
      type                           = p.value.type
      max_surge_fixed                = try(p.value.max_surge.fixed, null)
      max_surge_percent              = try(p.value.max_surge.percent, null)
      max_unavailable_fixed          = try(p.value.max_unavailable.fixed, null)
      max_unavailable_percent        = try(p.value.max_unavailable.percent, null)
      min_ready_sec                  = p.value.min_ready_sec
      most_disruptive_allowed_action = p.value.most_disruptive_action
      replacement_method             = p.value.replacement_method
    }
  }

  version {
    instance_template = var.instance_template
    name              = var.default_version_name
  }

  dynamic "version" {
    for_each = var.versions
    content {
      name              = version.key
      instance_template = version.value.instance_template
      dynamic "target_size" {
        for_each = version.value.target_size == null ? [] : [""]
        content {
          fixed   = version.value.target_size.fixed
          percent = version.value.target_size.percent
        }
      }
    }
  }
}

resource "google_compute_region_instance_group_manager" "default" {
  provider           = google-beta
  count              = local.is_regional ? 1 : 0
  project            = var.project_id
  region             = var.location
  name               = var.name
  base_instance_name = var.name
  description        = var.description
  distribution_policy_target_shape = try(
    var.distribution_policy.target_shape, null
  )
  distribution_policy_zones = try(
    var.distribution_policy.zones, null
  )
  target_size               = var.target_size
  target_pools              = var.target_pools
  wait_for_instances        = try(var.wait_for_instances.enabled, null)
  wait_for_instances_status = try(var.wait_for_instances.status, null)

  dynamic "all_instances_config" {
    for_each = var.all_instances_config == null ? [] : [""]
    content {
      labels   = try(var.all_instances_config.labels, null)
      metadata = try(var.all_instances_config.metadata, null)
    }
  }

  dynamic "auto_healing_policies" {
    for_each = var.auto_healing_policies == null ? [] : [""]
    iterator = config
    content {
      health_check      = local.health_check
      initial_delay_sec = var.auto_healing_policies.initial_delay_sec
    }
  }

  dynamic "named_port" {
    for_each = var.named_ports == null ? {} : var.named_ports
    iterator = config
    content {
      name = config.key
      port = config.value
    }
  }

  dynamic "stateful_disk" {
    for_each = var.stateful_disks
    content {
      device_name = stateful_disk.key
      delete_rule = stateful_disk.value
    }
  }

  dynamic "update_policy" {
    for_each = var.update_policy == null ? [] : [var.update_policy]
    iterator = p
    content {
      minimal_action                 = p.value.minimal_action
      type                           = p.value.type
      instance_redistribution_type   = p.value.regional_redistribution_type
      max_surge_fixed                = try(p.value.max_surge.fixed, null)
      max_surge_percent              = try(p.value.max_surge.percent, null)
      max_unavailable_fixed          = try(p.value.max_unavailable.fixed, null)
      max_unavailable_percent        = try(p.value.max_unavailable.percent, null)
      min_ready_sec                  = p.value.min_ready_sec
      most_disruptive_allowed_action = p.value.most_disruptive_action
      replacement_method             = p.value.replacement_method
    }
  }

  version {
    instance_template = var.instance_template
    name              = var.default_version_name
  }

  dynamic "version" {
    for_each = var.versions
    content {
      name              = version.key
      instance_template = version.value.instance_template
      dynamic "target_size" {
        for_each = version.value.target_size == null ? [] : [""]
        content {
          fixed   = version.value.target_size.fixed
          percent = version.value.target_size.percent
        }
      }
    }
  }
}
