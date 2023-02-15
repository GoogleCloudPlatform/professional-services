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
  cloud_config = templatefile(
    "${path.module}/cloud-config.yaml",
    merge(local.cloud_config_vars, var.config_variables)
  )
  corefile = (
    var.coredns_config == null ?
    "${path.module}/Corefile"
    : var.coredns_config
  )
  cloud_config_vars = {
    coredns_config = indent(4, templatefile(local.corefile, var.config_variables))
    ip_cidr_ranges = {
      local = var.local_ip_cidr_range
      remote = join(",", concat(
        var.vpn_static_ranges, local.netblocks
      ))
    }
    local_addresses = {
      gw    = cidrhost(var.local_ip_cidr_range, 1)
      vpn   = cidrhost(var.local_ip_cidr_range, 2)
      dns   = cidrhost(var.local_ip_cidr_range, 3)
      www   = cidrhost(var.local_ip_cidr_range, 4)
      shell = cidrhost(var.local_ip_cidr_range, 5)
      vpn2  = cidrhost(var.local_ip_cidr_range, 6)
    }
    netblocks          = local.netblocks
    vpn_config         = local.vpn_config
    vpn_dynamic_config = var.vpn_dynamic_config
  }
  netblocks = concat(
    data.google_netblock_ip_ranges.dns-forwarders.cidr_blocks_ipv4,
    data.google_netblock_ip_ranges.private-googleapis.cidr_blocks_ipv4,
    data.google_netblock_ip_ranges.restricted-googleapis.cidr_blocks_ipv4
  )
  vpn_config = merge(var.vpn_config, {
    peer_ip_wildcard  = "%${var.vpn_config.peer_ip}"
    peer_ip_wildcard2 = "%${var.vpn_config.peer_ip2}"
  })
}

data "google_netblock_ip_ranges" "dns-forwarders" {
  range_type = "dns-forwarders"
}

data "google_netblock_ip_ranges" "private-googleapis" {
  range_type = "private-googleapis"
}

data "google_netblock_ip_ranges" "restricted-googleapis" {
  range_type = "restricted-googleapis"
}
