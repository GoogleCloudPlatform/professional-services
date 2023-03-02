# Copyright 2022 Google LLC
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

output "fw_rules" {
  description = "Firewall rules."
  value = {
    prod = {
      ingress_allow_rules = module.vpc-firewall-prod.ingress_allow_rules
      ingress_deny_rules  = module.vpc-firewall-prod.ingress_deny_rules
      egress_allow_rules  = module.vpc-firewall-prod.egress_allow_rules
      egress_deny_rules   = module.vpc-firewall-prod.egress_deny_rules
    }
    dev = {
      ingress_allow_rules = module.vpc-firewall-dev.ingress_allow_rules
      ingress_deny_rules  = module.vpc-firewall-dev.ingress_deny_rules
      egress_allow_rules  = module.vpc-firewall-dev.egress_allow_rules
      egress_deny_rules   = module.vpc-firewall-dev.egress_deny_rules
    }
  }
}

output "projects" {
  description = "Project ids."
  value = {
    prod-host = module.project-host-prod.project_id
    dev-host  = module.project-host-dev.project_id
  }
}

output "vpc" {
  description = "Shared VPCs."
  value = {
    prod = {
      name    = module.vpc-prod.name
      subnets = module.vpc-prod.subnet_ips
    }
    dev = {
      name    = module.vpc-dev.name
      subnets = module.vpc-dev.subnet_ips
    }
  }
}
