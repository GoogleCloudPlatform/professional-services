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

# tfdoc:file:description VPN between common and onprem.

locals {
  enable_onprem_vpn = var.vpn_onprem_configs != null
  bgp_peer_options_onprem = local.enable_onprem_vpn == false ? null : {
    for k, v in var.vpn_onprem_configs :
    k => v.adv == null ? null : {
      advertise_groups = []
      advertise_ip_ranges = {
        for adv in(v.adv == null ? [] : v.adv.custom) :
        var.custom_adv[adv] => adv
      }
      advertise_mode = try(v.adv.default, false) ? "DEFAULT" : "CUSTOM"
      route_priority = null
    }
  }
}

module "common-to-onprem-usc1-vpn" {
  count                 = local.enable_onprem_vpn ? 1 : 0
  source                = "../modules/net-vpn-ha"
  project_id            = module.common-project.project_id
  network               = module.common-vpc.self_link
  region                = "europe-west1"
  name                  = "vpn-to-onprem-usc1"
  router_create         = true
  router_name           = "common-onprem-vpn-usc1"
  router_asn            = var.router_onprem_configs.common-usc1.asn
  peer_external_gateway = var.vpn_onprem_configs.common-usc1.peer_external_gateway
  tunnels = {
    for t in var.vpn_onprem_configs.common-usc1.tunnels :
    "remote-${t.vpn_gateway_interface}-${t.peer_external_gateway_interface}" => {
      bgp_peer = {
        address = cidrhost(t.session_range, 1)
        asn     = t.peer_asn
      }
      bgp_peer_options                = local.bgp_peer_options_onprem.common-usc1
      bgp_session_range               = "${cidrhost(t.session_range, 2)}/30"
      ike_version                     = 2
      peer_external_gateway_interface = t.peer_external_gateway_interface
      router                          = null
      shared_secret                   = t.secret
      vpn_gateway_interface           = t.vpn_gateway_interface
    }
  }
}
