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

output "gcp_region" {
  value = var.gcp_region
}

output "cluster_name" {
  value = var.cluster_name
}

output "cluster_tag_name" {
  value = var.cluster_tag_name
}

output "instance_group_url" {
  value = google_compute_region_instance_group_manager.consul_server.self_link
}

output "instance_group_name" {
  value = google_compute_region_instance_group_manager.consul_server.name
}

output "instance_template_url" {
  value = google_compute_instance_template.consul_server.self_link
}

output "instance_template_name" {
  value = google_compute_instance_template.consul_server.name
}

output "instance_template_metadata_fingerprint" {
  value = google_compute_instance_template.consul_server.metadata_fingerprint
}

output "firewall_rule_intracluster_url" {
  value = google_compute_firewall.allow_intracluster_consul.self_link
}

output "firewall_rule_intracluster_name" {
  value = google_compute_firewall.allow_intracluster_consul.name
}

output "firewall_rule_inbound_http_url" {
  value = element(
    concat(
      google_compute_firewall.allow_inbound_http_api.*.self_link,
      [""],
    ),
    0,
  )
}

output "firewall_rule_inbound_http_name" {
  value = element(
    concat(google_compute_firewall.allow_inbound_http_api.*.name, [""]),
    0,
  )
}

output "firewall_rule_inbound_dns_url" {
  value = element(
    concat(google_compute_firewall.allow_inbound_dns.*.self_link, [""]),
    0,
  )
}

output "firewall_rule_inbound_dns_name" {
  value = element(
    concat(google_compute_firewall.allow_inbound_dns.*.name, [""]),
    0,
  )
}

output "glb_static_ip" {
  value = google_compute_address.ilb.address
}