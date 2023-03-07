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
  router_name = (
    var.router_create
    ? try(google_compute_router.router[0].name, null)
    : var.router_name
  )
}

resource "google_compute_router" "router" {
  count   = var.router_create ? 1 : 0
  name    = var.router_name == null ? "${var.name}-nat" : var.router_name
  project = var.project_id
  region  = var.region
  network = var.router_network
  bgp {
    asn = var.router_asn
  }
}

resource "google_compute_router_nat" "nat" {
  project                            = var.project_id
  region                             = var.region
  name                               = var.name
  router                             = local.router_name
  nat_ips                            = var.addresses
  nat_ip_allocate_option             = length(var.addresses) > 0 ? "MANUAL_ONLY" : "AUTO_ONLY"
  source_subnetwork_ip_ranges_to_nat = var.config_source_subnets
  min_ports_per_vm                   = var.config_min_ports_per_vm
  icmp_idle_timeout_sec              = var.config_timeouts.icmp
  udp_idle_timeout_sec               = var.config_timeouts.udp
  tcp_established_idle_timeout_sec   = var.config_timeouts.tcp_established
  tcp_transitory_idle_timeout_sec    = var.config_timeouts.tcp_transitory

  log_config {
    enable = var.logging_filter == null ? false : true
    filter = var.logging_filter == null ? "ALL" : var.logging_filter
  }

  dynamic "subnetwork" {
    for_each = var.subnetworks
    content {
      name                     = subnetwork.value.self_link
      source_ip_ranges_to_nat  = subnetwork.value.config_source_ranges
      secondary_ip_range_names = subnetwork.value.secondary_ranges
    }
  }
}

