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

output "egress_allow_rules" {
  description = "Egress rules with allow blocks."
  value = [
    for rule in google_compute_firewall.rules :
    rule if rule.direction == "EGRESS" && length(rule.allow) > 0
  ]
}

output "egress_deny_rules" {
  description = "Egress rules with allow blocks."
  value = [
    for rule in google_compute_firewall.rules :
    rule if rule.direction == "EGRESS" && length(rule.deny) > 0
  ]
}

output "ingress_allow_rules" {
  description = "Ingress rules with allow blocks."
  value = [
    for rule in google_compute_firewall.rules :
    rule if rule.direction == "INGRESS" && length(rule.allow) > 0
  ]
}

output "ingress_deny_rules" {
  description = "Ingress rules with deny blocks."
  value = [
    for rule in google_compute_firewall.rules :
    rule if rule.direction == "INGRESS" && length(rule.deny) > 0
  ]
}
