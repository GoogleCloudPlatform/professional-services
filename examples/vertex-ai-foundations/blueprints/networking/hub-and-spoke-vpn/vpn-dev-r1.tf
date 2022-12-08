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

# tfdoc:file:description Landing to Development VPN for region 1.

module "landing-to-dev-vpn-r1" {
  source        = "../../../modules/net-vpn-ha"
  project_id    = var.project_id
  network       = module.landing-vpc.self_link
  region        = var.regions.r1
  name          = "${local.prefix}lnd-to-dev-r1"
  router_create = false
  router_name   = "${local.prefix}lnd-vpn-r1"
  # router is created and managed by the production VPN module
  # so we don't configure advertisements here
  peer_gcp_gateway = module.dev-to-landing-vpn-r1.self_link
  tunnels = {
    0 = {
      bgp_peer = {
        address = "169.254.2.2"
        asn     = var.vpn_configs.dev-r1.asn
      }
      # use this attribute to configure different advertisements for dev
      bgp_peer_options                = null
      bgp_session_range               = "169.254.2.1/30"
      ike_version                     = 2
      peer_external_gateway_interface = null
      router                          = null
      shared_secret                   = null
      vpn_gateway_interface           = 0
    }
    1 = {
      bgp_peer = {
        address = "169.254.2.6"
        asn     = var.vpn_configs.dev-r1.asn
      }
      # use this attribute to configure different advertisements for dev
      bgp_peer_options                = null
      bgp_session_range               = "169.254.2.5/30"
      ike_version                     = 2
      peer_external_gateway_interface = null
      router                          = null
      shared_secret                   = null
      vpn_gateway_interface           = 1
    }
  }
}

module "dev-to-landing-vpn-r1" {
  source        = "../../../modules/net-vpn-ha"
  project_id    = var.project_id
  network       = module.dev-vpc.self_link
  region        = var.regions.r1
  name          = "${local.prefix}dev-to-lnd-r1"
  router_create = true
  router_name   = "${local.prefix}dev-vpn-r1"
  router_asn    = var.vpn_configs.dev-r1.asn
  router_advertise_config = (
    var.vpn_configs.dev-r1.custom_ranges == null
    ? null
    : {
      groups    = null
      ip_ranges = coalesce(var.vpn_configs.dev-r1.custom_ranges, {})
      mode      = "CUSTOM"
    }
  )
  peer_gcp_gateway = module.landing-to-dev-vpn-r1.self_link
  tunnels = {
    0 = {
      bgp_peer = {
        address = "169.254.2.1"
        asn     = var.vpn_configs.land-r1.asn
      }
      bgp_peer_options                = null
      bgp_session_range               = "169.254.2.2/30"
      ike_version                     = 2
      peer_external_gateway_interface = null
      router                          = null
      shared_secret                   = module.landing-to-dev-vpn-r1.random_secret
      vpn_gateway_interface           = 0
    }
    1 = {
      bgp_peer = {
        address = "169.254.2.5"
        asn     = var.vpn_configs.land-r1.asn
      }
      bgp_peer_options                = null
      bgp_session_range               = "169.254.2.6/30"
      ike_version                     = 2
      peer_external_gateway_interface = null
      router                          = null
      shared_secret                   = module.landing-to-dev-vpn-r1.random_secret
      vpn_gateway_interface           = 1
    }
  }
}
