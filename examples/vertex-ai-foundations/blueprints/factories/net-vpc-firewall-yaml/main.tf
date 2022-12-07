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
  firewall_rule_files = flatten(
    [
      for config_path in var.config_directories :
      concat(
        [
          for config_file in fileset("${path.root}/${config_path}", "**/*.yaml") :
          "${path.root}/${config_path}/${config_file}"
        ]
      )

    ]
  )

  firewall_rules = merge(
    [
      for config_file in local.firewall_rule_files :
      try(yamldecode(file(config_file)), {})
    ]...
  )
}

resource "time_static" "timestamp" {
  for_each = local.firewall_rules
  triggers = {
    name = md5(jsonencode(each.value))
  }
}

resource "google_compute_firewall" "rules" {
  for_each = local.firewall_rules
  project  = var.project_id
  name = format(
    "fwr-%s-%s-%s-%s",
    var.network,
    (try(each.value.target_service_accounts, null) != null ? "sac" : try(each.value.target_tags, null) != null ? "vpc" : "all"),
    substr(lower(each.value.direction), 0, 1),
    each.key
  )
  description = format(
    "%s rule in network %s for %s created at %s",
    each.value.direction,
    var.network,
    each.key,
    time_static.timestamp[each.key].rfc3339
  )

  network   = var.network
  direction = each.value.direction
  priority  = try(each.value.priority, 1000)
  disabled  = try(each.value.disabled, null)

  source_ranges           = try(each.value.source_ranges, each.value.direction == "INGRESS" ? [] : null)
  source_tags             = try(each.value.source_tags, null)
  source_service_accounts = try(each.value.source_service_accounts, null)

  destination_ranges      = try(each.value.destination_ranges, each.value.direction == "EGRESS" ? [] : null)
  target_tags             = try(each.value.target_tags, null)
  target_service_accounts = try(each.value.target_service_accounts, null)

  dynamic "allow" {
    for_each = { for block in try(each.value.allow, []) :
      "${block.protocol}-${join("-", block.ports)}" => {
        ports    = [for port in block.ports : tostring(port)]
        protocol = block.protocol
      }
    }
    content {
      protocol = allow.value.protocol
      ports    = allow.value.ports
    }
  }

  dynamic "deny" {
    for_each = { for block in try(each.value.deny, []) :
      "${block.protocol}-${join("-", block.ports)}" => {
        ports    = [for port in block.ports : tostring(port)]
        protocol = block.protocol
      }
    }
    content {
      protocol = deny.value.protocol
      ports    = deny.value.ports
    }
  }

  dynamic "log_config" {
    for_each = var.log_config != null ? [""] : []
    content {
      metadata = var.log_config.metadata
    }
  }

  lifecycle {
    create_before_destroy = true
  }
}
