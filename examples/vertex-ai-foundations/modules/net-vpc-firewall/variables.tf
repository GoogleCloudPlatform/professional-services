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

variable "default_rules_config" {
  description = "Optionally created convenience rules. Set the variable or individual members to null to disable."
  type = object({
    admin_ranges = optional(list(string))
    disabled     = optional(bool, false)
    http_ranges = optional(list(string), [
      "35.191.0.0/16", "130.211.0.0/22", "209.85.152.0/22", "209.85.204.0/22"]
    )
    http_tags = optional(list(string), ["http-server"])
    https_ranges = optional(list(string), [
      "35.191.0.0/16", "130.211.0.0/22", "209.85.152.0/22", "209.85.204.0/22"]
    )
    https_tags = optional(list(string), ["https-server"])
    ssh_ranges = optional(list(string), ["35.235.240.0/20"])
    ssh_tags   = optional(list(string), ["ssh"])
  })
  default  = {}
  nullable = false
}

variable "egress_rules" {
  description = "List of egress rule definitions, default to deny action."
  type = map(object({
    deny               = optional(bool, true)
    description        = optional(string)
    destination_ranges = optional(list(string))
    disabled           = optional(bool, false)
    enable_logging = optional(object({
      include_metadata = optional(bool)
    }))
    priority             = optional(number, 1000)
    sources              = optional(list(string))
    targets              = optional(list(string))
    use_service_accounts = optional(bool, false)
    rules = optional(list(object({
      protocol = string
      ports    = optional(list(string))
    })), [{ protocol = "all" }])
  }))
  default  = {}
  nullable = false
}

variable "ingress_rules" {
  description = "List of ingress rule definitions, default to allow action."
  type = map(object({
    deny        = optional(bool, false)
    description = optional(string)
    disabled    = optional(bool, false)
    enable_logging = optional(object({
      include_metadata = optional(bool)
    }))
    priority             = optional(number, 1000)
    source_ranges        = optional(list(string))
    sources              = optional(list(string))
    targets              = optional(list(string))
    use_service_accounts = optional(bool, false)
    rules = optional(list(object({
      protocol = string
      ports    = optional(list(string))
    })), [{ protocol = "all" }])
  }))
  default  = {}
  nullable = false
}

variable "factories_config" {
  description = "Paths to data files and folders that enable factory functionality."
  type = object({
    cidr_tpl_file = optional(string)
    rules_folder  = string
  })
  default = null
}

variable "named_ranges" {
  description = "Define mapping of names to ranges that can be used in custom rules."
  type        = map(list(string))
  default = {
    any            = ["0.0.0.0/0"]
    dns-forwarders = ["35.199.192.0/19"]
    health-checkers = [
      "35.191.0.0/16", "130.211.0.0/22", "209.85.152.0/22", "209.85.204.0/22"
    ]
    iap-forwarders        = ["35.235.240.0/20"]
    private-googleapis    = ["199.36.153.8/30"]
    restricted-googleapis = ["199.36.153.4/30"]
    rfc1918               = ["10.0.0.0/8", "172.16.0.0/12", "192.168.0.0/16"]
  }
  nullable = false
}

variable "network" {
  description = "Name of the network this set of firewall rules applies to."
  type        = string
}

variable "project_id" {
  description = "Project id of the project that holds the network."
  type        = string
}
