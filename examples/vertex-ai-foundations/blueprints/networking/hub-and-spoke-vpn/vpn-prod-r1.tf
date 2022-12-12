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

# tfdoc:file:description Landing to Production VPN for region 1.

module "landing-to-prod-vpn-r1" {
  source        = "../../../modules/net-vpn-ha"
  project_id    = var.project_id
  network       = module.landing-vpc.self_link
  region        = var.regions.r1
  name          = "${local.prefix}lnd-to-prd-r1"
  router_create = true
  router_name   = "${local.prefix}lnd-vpn-r1"
  router_asn    = var.vpn_configs.land-r1.asn
  router_advertise_config = (
    var.vpn_configs.land-r1.custom_ranges == null
    ? null
    : {
      groups    = null
      ip_ranges = coalesce(var.vpn_configs.land-r1.custom_ranges, {})
      mode      = "CUSTOM"
    }
  )
  peer_gcp_gateway = module.prod-to-landing-vpn-r1.self_link
  tunnels = {
    0 = {
      bgp_peer = {
        address = "169.254.0.2"
        asn     = var.vpn_configs.prod-r1.asn
      }
      bgp_peer_options                = null
      bgp_session_range               = "169.254.0.1/30"
      ike_version                     = 2
      peer_external_gateway_interface = null
      router                          = null
      shared_secret                   = null
      vpn_gateway_interface           = 0
    }
    1 = {
      bgp_peer = {
        address = "169.254.0.6"
        asn     = var.vpn_configs.prod-r1.asn
      }
      bgp_peer_options                = null
      bgp_session_range               = "169.254.0.5/30"
      ike_version                     = 2
      peer_external_gateway_interface = null
      router                          = null
      shared_secret                   = null
      vpn_gateway_interface           = 1
    }
  }
}

module "prod-to-landing-vpn-r1" {
  source        = "../../../modules/net-vpn-ha"
  project_id    = var.project_id
  network       = module.prod-vpc.self_link
  region        = var.regions.r1
  name          = "${local.prefix}prd-to-lnd-r1"
  router_create = true
  router_name   = "${local.prefix}prd-vpn-r1"
  router_asn    = var.vpn_configs.prod-r1.asn
  # the router is managed here but shared with the dev VPN
  router_advertise_config = (
    var.vpn_configs.prod-r1.custom_ranges == null
    ? null
    : {
      groups    = null
      ip_ranges = coalesce(var.vpn_configs.prod-r1.custom_ranges, {})
      mode      = "CUSTOM"
    }
  )
  peer_gcp_gateway = module.landing-to-prod-vpn-r1.self_link
  tunnels = {
    0 = {
      bgp_peer = {
        address = "169.254.0.1"
        asn     = var.vpn_configs.land-r1.asn
      }
      # use this attribute to configure different advertisements for prod
      bgp_peer_options                = null
      bgp_session_range               = "169.254.0.2/30"
      ike_version                     = 2
      peer_external_gateway_interface = null
      router                          = null
      shared_secret                   = module.landing-to-prod-vpn-r1.random_secret
      vpn_gateway_interface           = 0
    }
    1 = {
      bgp_peer = {
        address = "169.254.0.5"
        asn     = var.vpn_configs.land-r1.asn
      }
      # use this attribute to configure different advertisements for prod
      bgp_peer_options                = null
      bgp_session_range               = "169.254.0.6/30"
      ike_version                     = 2
      peer_external_gateway_interface = null
      router                          = null
      shared_secret                   = module.landing-to-prod-vpn-r1.random_secret
      vpn_gateway_interface           = 1
    }
  }
}
