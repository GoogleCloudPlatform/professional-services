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
  # define list of rule files
  _factory_rule_files = [
    for f in try(fileset(var.factories_config.rules_folder, "**/*.yaml"), []) :
    "${var.factories_config.rules_folder}/${f}"
  ]
  # decode rule files and account for optional attributes
  _factory_rule_list = flatten([
    for f in local._factory_rule_files : [
      for direction, ruleset in yamldecode(file(f)) : [
        for name, rule in ruleset : {
          name                 = name
          deny                 = try(rule.deny, false)
          rules                = try(rule.rules, [{ protocol = "all" }])
          description          = try(rule.description, null)
          destination_ranges   = try(rule.destination_ranges, null)
          direction            = upper(direction)
          disabled             = try(rule.disabled, null)
          enable_logging       = try(rule.enable_logging, null)
          priority             = try(rule.priority, 1000)
          source_ranges        = try(rule.source_ranges, null)
          sources              = try(rule.sources, null)
          targets              = try(rule.targets, null)
          use_service_accounts = try(rule.use_service_accounts, false)
        }
      ]
    ]
  ])
  _factory_rules = {
    for r in local._factory_rule_list : r.name => r
    if contains(["EGRESS", "INGRESS"], r.direction)
  }
  _named_ranges = merge(
    try(yamldecode(file(var.factories_config.cidr_tpl_file)), {}),
    var.named_ranges
  )
  _rules = merge(
    local._factory_rules, local._rules_egress, local._rules_ingress
  )
  _rules_egress = {
    for name, rule in merge(var.egress_rules) :
    name => merge(rule, { direction = "EGRESS" })
  }
  _rules_ingress = {
    for name, rule in merge(var.ingress_rules) :
    name => merge(rule, { direction = "INGRESS" })
  }
  # convert rules data to resource format and replace range template variables
  rules = {
    for name, rule in local._rules :
    name => merge(rule, {
      action = rule.deny == true ? "DENY" : "ALLOW"
      destination_ranges = flatten([
        for range in coalesce(try(rule.destination_ranges, null), []) :
        try(local._named_ranges[range], range)
      ])
      rules = { for k, v in rule.rules : k => v }
      source_ranges = flatten([
        for range in coalesce(try(rule.source_ranges, null), []) :
        try(local._named_ranges[range], range)
      ])
    })
  }
}

resource "google_compute_firewall" "custom-rules" {
  for_each    = local.rules
  project     = var.project_id
  network     = var.network
  name        = each.key
  description = each.value.description
  direction   = each.value.direction
  source_ranges = (
    each.value.direction == "INGRESS"
    ? (
      coalesce(each.value.source_ranges, []) == []
      ? ["0.0.0.0/0"]
      : each.value.source_ranges
    ) : null
  )
  destination_ranges = (
    each.value.direction == "EGRESS"
    ? (
      coalesce(each.value.destination_ranges, []) == []
      ? ["0.0.0.0/0"]
      : each.value.destination_ranges
    ) : null
  )
  source_tags = (
    each.value.use_service_accounts || each.value.direction == "EGRESS"
    ? null
    : each.value.sources
  )
  source_service_accounts = (
    each.value.use_service_accounts && each.value.direction == "INGRESS"
    ? each.value.sources
    : null
  )
  target_tags = (
    each.value.use_service_accounts ? null : each.value.targets
  )
  target_service_accounts = (
    each.value.use_service_accounts ? each.value.targets : null
  )
  disabled = each.value.disabled == true
  priority = each.value.priority

  dynamic "log_config" {
    for_each = each.value.enable_logging == null ? [] : [""]
    content {
      metadata = (
        try(each.value.enable_logging.include_metadata, null) == true
        ? "INCLUDE_ALL_METADATA"
        : "EXCLUDE_ALL_METADATA"
      )
    }
  }

  dynamic "deny" {
    for_each = each.value.action == "DENY" ? each.value.rules : {}
    iterator = rule
    content {
      protocol = rule.value.protocol
      ports    = rule.value.ports
    }
  }

  dynamic "allow" {
    for_each = each.value.action == "ALLOW" ? each.value.rules : {}
    iterator = rule
    content {
      protocol = rule.value.protocol
      ports    = rule.value.ports
    }
  }
}
