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

# tfdoc:file:description Route resources.

locals {
  _routes = var.routes == null ? {} : var.routes
  routes = {
    gateway    = { for k, v in local._routes : k => v if v.next_hop_type == "gateway" }
    ilb        = { for k, v in local._routes : k => v if v.next_hop_type == "ilb" }
    instance   = { for k, v in local._routes : k => v if v.next_hop_type == "instance" }
    ip         = { for k, v in local._routes : k => v if v.next_hop_type == "ip" }
    vpn_tunnel = { for k, v in local._routes : k => v if v.next_hop_type == "vpn_tunnel" }
  }
}

resource "google_compute_route" "gateway" {
  for_each         = local.routes.gateway
  project          = var.project_id
  network          = local.network.name
  name             = "${var.name}-${each.key}"
  description      = "Terraform-managed."
  dest_range       = each.value.dest_range
  priority         = each.value.priority
  tags             = each.value.tags
  next_hop_gateway = each.value.next_hop
}

resource "google_compute_route" "ilb" {
  for_each     = local.routes.ilb
  project      = var.project_id
  network      = local.network.name
  name         = "${var.name}-${each.key}"
  description  = "Terraform-managed."
  dest_range   = each.value.dest_range
  priority     = each.value.priority
  tags         = each.value.tags
  next_hop_ilb = each.value.next_hop
}

resource "google_compute_route" "instance" {
  for_each          = local.routes.instance
  project           = var.project_id
  network           = local.network.name
  name              = "${var.name}-${each.key}"
  description       = "Terraform-managed."
  dest_range        = each.value.dest_range
  priority          = each.value.priority
  tags              = each.value.tags
  next_hop_instance = each.value.next_hop
  # not setting the instance zone will trigger a refresh
  next_hop_instance_zone = regex("zones/([^/]+)/", each.value.next_hop)[0]
}

resource "google_compute_route" "ip" {
  for_each    = local.routes.ip
  project     = var.project_id
  network     = local.network.name
  name        = "${var.name}-${each.key}"
  description = "Terraform-managed."
  dest_range  = each.value.dest_range
  priority    = each.value.priority
  tags        = each.value.tags
  next_hop_ip = each.value.next_hop
}

resource "google_compute_route" "vpn_tunnel" {
  for_each            = local.routes.vpn_tunnel
  project             = var.project_id
  network             = local.network.name
  name                = "${var.name}-${each.key}"
  description         = "Terraform-managed."
  dest_range          = each.value.dest_range
  priority            = each.value.priority
  tags                = each.value.tags
  next_hop_vpn_tunnel = each.value.next_hop
}
