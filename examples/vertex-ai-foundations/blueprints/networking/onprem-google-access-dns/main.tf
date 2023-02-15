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
  bgp_interface_gcp1    = cidrhost(var.bgp_interface_ranges.gcp1, 1)
  bgp_interface_onprem1 = cidrhost(var.bgp_interface_ranges.gcp1, 2)
  bgp_interface_gcp2    = cidrhost(var.bgp_interface_ranges.gcp2, 1)
  bgp_interface_onprem2 = cidrhost(var.bgp_interface_ranges.gcp2, 2)
  netblocks = {
    dns        = data.google_netblock_ip_ranges.dns-forwarders.cidr_blocks_ipv4.0
    private    = data.google_netblock_ip_ranges.private-googleapis.cidr_blocks_ipv4.0
    restricted = data.google_netblock_ip_ranges.restricted-googleapis.cidr_blocks_ipv4.0
  }
  vips = {
    private    = [for i in range(4) : cidrhost(local.netblocks.private, i)]
    restricted = [for i in range(4) : cidrhost(local.netblocks.restricted, i)]
  }
  vm-startup-script = join("\n", [
    "#! /bin/bash",
    "apt-get update && apt-get install -y bash-completion dnsutils kubectl"
  ])
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

################################################################################
#                                  Networking                                  #
################################################################################

module "vpc" {
  source     = "../../../modules/net-vpc"
  project_id = var.project_id
  name       = "to-onprem"
  subnets = [
    {
      ip_cidr_range = var.ip_ranges.gcp1
      name          = "subnet1"
      region        = var.region.gcp1
    },
    {
      ip_cidr_range = var.ip_ranges.gcp2
      name          = "subnet2"
      region        = var.region.gcp2
    }
  ]
}

module "vpc-firewall" {
  source     = "../../../modules/net-vpc-firewall"
  project_id = var.project_id
  network    = module.vpc.name
  default_rules_config = {
    admin_ranges = values(var.ip_ranges)
    ssh_ranges   = var.ssh_source_ranges
  }
}

module "vpn1" {
  source     = "../../../modules/net-vpn-dynamic"
  project_id = var.project_id
  region     = var.region.gcp1
  network    = module.vpc.name
  name       = "to-onprem1"
  router_asn = var.bgp_asn.gcp1
  tunnels = {
    onprem = {
      bgp_peer = {
        address = local.bgp_interface_onprem1
        asn     = var.bgp_asn.onprem1
      }
      bgp_peer_options = {
        advertise_groups = ["ALL_SUBNETS"]
        advertise_ip_ranges = {
          (local.netblocks.dns)        = "DNS resolvers"
          (local.netblocks.private)    = "private.gooogleapis.com"
          (local.netblocks.restricted) = "restricted.gooogleapis.com"
        }
        advertise_mode = "CUSTOM"
        route_priority = 1000
      }
      bgp_session_range = "${local.bgp_interface_gcp1}/30"
      ike_version       = 2
      peer_ip           = module.vm-onprem.external_ip
      router            = null
      shared_secret     = ""
    }
  }
}

module "vpn2" {
  source     = "../../../modules/net-vpn-dynamic"
  project_id = var.project_id
  region     = var.region.gcp2
  network    = module.vpc.name
  name       = "to-onprem2"
  router_asn = var.bgp_asn.gcp2
  tunnels = {
    onprem = {
      bgp_peer = {
        address = local.bgp_interface_onprem2
        asn     = var.bgp_asn.onprem2
      }
      bgp_peer_options = {
        advertise_groups = ["ALL_SUBNETS"]
        advertise_ip_ranges = {
          (local.netblocks.dns)        = "DNS resolvers"
          (local.netblocks.private)    = "private.gooogleapis.com"
          (local.netblocks.restricted) = "restricted.gooogleapis.com"
        }
        advertise_mode = "CUSTOM"
        route_priority = 1000
      }
      bgp_session_range = "${local.bgp_interface_gcp2}/30"
      ike_version       = 2
      peer_ip           = module.vm-onprem.external_ip
      router            = null
      shared_secret     = ""
    }
  }
}

module "nat1" {
  source        = "../../../modules/net-cloudnat"
  project_id    = var.project_id
  region        = var.region.gcp1
  name          = "default"
  router_create = false
  router_name   = module.vpn1.router_name
}
module "nat2" {
  source        = "../../../modules/net-cloudnat"
  project_id    = var.project_id
  region        = var.region.gcp2
  name          = "default"
  router_create = false
  router_name   = module.vpn2.router_name
}

################################################################################
#                                     DNS                                      #
################################################################################

module "dns-gcp" {
  source          = "../../../modules/dns"
  project_id      = var.project_id
  type            = "private"
  name            = "gcp-example"
  domain          = "gcp.example.org."
  client_networks = [module.vpc.self_link]
  recordsets = {
    "A localhost" = { records = ["127.0.0.1"] }
    "A test-1"    = { records = [module.vm-test1.internal_ip] }
    "A test-2"    = { records = [module.vm-test2.internal_ip] }
  }
}

module "dns-api" {
  source          = "../../../modules/dns"
  project_id      = var.project_id
  type            = "private"
  name            = "googleapis"
  domain          = "googleapis.com."
  client_networks = [module.vpc.self_link]
  recordsets = {
    "CNAME *"      = { records = ["private.googleapis.com."] }
    "A private"    = { records = local.vips.private }
    "A restricted" = { records = local.vips.restricted }
  }
}

module "dns-onprem" {
  source          = "../../../modules/dns"
  project_id      = var.project_id
  type            = "forwarding"
  name            = "onprem-example"
  domain          = "onprem.example.org."
  client_networks = [module.vpc.self_link]
  forwarders = {
    "${cidrhost(var.ip_ranges.onprem, 3)}" = null
  }
}

resource "google_dns_policy" "inbound" {
  provider                  = google-beta
  project                   = var.project_id
  name                      = "gcp-inbound"
  enable_inbound_forwarding = true
  networks {
    network_url = module.vpc.self_link
  }
}

################################################################################
#                                Test instance                                 #
################################################################################

module "service-account-gce" {
  source     = "../../../modules/iam-service-account"
  project_id = var.project_id
  name       = "gce-test"
  iam_project_roles = {
    (var.project_id) = [
      "roles/logging.logWriter",
      "roles/monitoring.metricWriter",
    ]
  }
}

module "vm-test1" {
  source     = "../../../modules/compute-vm"
  project_id = var.project_id
  zone       = "${var.region.gcp1}-b"
  name       = "test-1"
  network_interfaces = [{
    network    = module.vpc.self_link
    subnetwork = module.vpc.subnet_self_links["${var.region.gcp1}/subnet1"]
  }]
  metadata               = { startup-script = local.vm-startup-script }
  service_account        = module.service-account-gce.email
  service_account_scopes = ["https://www.googleapis.com/auth/cloud-platform"]
  tags                   = ["ssh"]
}

module "vm-test2" {
  source     = "../../../modules/compute-vm"
  project_id = var.project_id
  zone       = "${var.region.gcp2}-b"
  name       = "test-2"
  network_interfaces = [{
    network    = module.vpc.self_link
    subnetwork = module.vpc.subnet_self_links["${var.region.gcp2}/subnet2"]
    nat        = false
    addresses  = null
  }]
  metadata               = { startup-script = local.vm-startup-script }
  service_account        = module.service-account-gce.email
  service_account_scopes = ["https://www.googleapis.com/auth/cloud-platform"]
  tags                   = ["ssh"]
}

################################################################################
#                                   On prem                                    #
################################################################################

module "config-onprem" {
  source              = "../../../modules/cloud-config-container/onprem"
  config_variables    = { dns_forwarder_address = var.dns_forwarder_address }
  coredns_config      = "${path.module}/assets/Corefile"
  local_ip_cidr_range = var.ip_ranges.onprem
  vpn_config = {
    peer_ip        = module.vpn1.address
    peer_ip2       = module.vpn2.address
    shared_secret  = module.vpn1.random_secret
    shared_secret2 = module.vpn2.random_secret
    type           = "dynamic"
  }
  vpn_dynamic_config = {
    local_bgp_asn      = var.bgp_asn.onprem1
    local_bgp_address  = local.bgp_interface_onprem1
    peer_bgp_asn       = var.bgp_asn.gcp1
    peer_bgp_address   = local.bgp_interface_gcp1
    local_bgp_asn2     = var.bgp_asn.onprem2
    local_bgp_address2 = local.bgp_interface_onprem2
    peer_bgp_asn2      = var.bgp_asn.gcp2
    peer_bgp_address2  = local.bgp_interface_gcp2
  }
}

module "service-account-onprem" {
  source     = "../../../modules/iam-service-account"
  project_id = var.project_id
  name       = "gce-onprem"
  iam_project_roles = {
    (var.project_id) = [
      "roles/compute.viewer",
      "roles/logging.logWriter",
      "roles/monitoring.metricWriter",
    ]
  }
}

module "vm-onprem" {
  source        = "../../../modules/compute-vm"
  project_id    = var.project_id
  zone          = "${var.region.gcp1}-b"
  instance_type = "f1-micro"
  name          = "onprem"
  boot_disk = {
    image = "ubuntu-os-cloud/ubuntu-1804-lts"
  }
  metadata = {
    user-data = module.config-onprem.cloud_config
  }
  network_interfaces = [{
    network    = module.vpc.name
    subnetwork = module.vpc.subnet_self_links["${var.region.gcp1}/subnet1"]
  }]
  service_account        = module.service-account-onprem.email
  service_account_scopes = ["https://www.googleapis.com/auth/cloud-platform"]
  tags                   = ["ssh"]
}
