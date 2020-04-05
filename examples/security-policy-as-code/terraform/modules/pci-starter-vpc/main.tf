/**
 * Copyright 2020 Google LLC
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

module "vpc_pci" {
  source  = "terraform-google-modules/network/google"
  version = "~> 2.1.1"

  shared_vpc_host = var.is_shared_vpc_host
  project_id      = var.project_id

  network_name = var.vpc_name
  routing_mode = "GLOBAL"

  subnets = [
    {
      subnet_name               = var.mgmt_subnet_name
      subnet_ip                 = var.mgmt_subnet_cidr
      subnet_region             = var.region
      subnet_private_access     = "true"
      subnet_flow_logs          = "true"
      subnet_flow_logs_interval = "INTERVAL_10_MIN"
      subnet_flow_logs_sampling = 0.7
      subnet_flow_logs_metadata = "INCLUDE_ALL_METADATA"
    },
    {
      subnet_name               = var.in_scope_subnet_name
      subnet_ip                 = var.in_scope_subnet_cidr
      subnet_region             = var.region
      subnet_private_access     = "true"
      subnet_flow_logs          = "true"
      subnet_flow_logs_interval = "INTERVAL_10_MIN"
      subnet_flow_logs_sampling = 0.7
      subnet_flow_logs_metadata = "INCLUDE_ALL_METADATA"
    },
    {
      subnet_name               = var.out_of_scope_subnet_name
      subnet_ip                 = var.out_of_scope_subnet_cidr
      subnet_region             = var.region
      subnet_private_access     = "true"
      subnet_flow_logs          = "true"
      subnet_flow_logs_interval = "INTERVAL_10_MIN"
      subnet_flow_logs_sampling = 0.7
      subnet_flow_logs_metadata = "INCLUDE_ALL_METADATA"
    },
  ]

  secondary_ranges = {
    management = []

    out-of-scope = [
      {
        range_name    = var.out_of_scope_pod_ip_range_name
        ip_cidr_range = "10.11.0.0/16"
      },
      {
        range_name    = var.out_of_scope_services_ip_range_name
        ip_cidr_range = "10.12.0.0/16"
      },
    ]

    in-scope = [
      {
        range_name    = var.in_scope_pod_ip_range_name
        ip_cidr_range = "10.13.0.0/16"
      },
      {
        range_name    = var.in_scope_services_ip_range_name
        ip_cidr_range = "10.14.0.0/16"
      },
    ]
  }

  routes = [
    {
      name              = "egress-internet"
      description       = "route through IGW to access internet"
      destination_range = "0.0.0.0/0"
      tags              = "egress-inet"
      next_hop_internet = "true"
    },
  ]
}

resource "google_compute_firewall" "egress-denyall" {
  name        = "egress-denyall"
  project     = var.project_id
  network     = module.vpc_pci.network_name
  direction   = "EGRESS"
  priority    = 9000
  description = "CID: SNOW-9999 Add a Deny All Egress rule for CIS Control 3.2.1"

  deny {
    protocol = "all"
  }

}


resource "google_compute_router" "router" {
  name    = "router"
  project = var.project_id
  region  = var.region
  network = module.vpc_pci.network_self_link
}

resource "google_compute_router_nat" "nat" {
  name = "nat-all"

  # Set an explicit dependency on VPC module.
  # This enforces the correct creation order for this NAT resource.
  depends_on = [module.vpc_pci]

  project                            = var.project_id
  router                             = google_compute_router.router.name
  region                             = var.region
  nat_ip_allocate_option             = "AUTO_ONLY"
  source_subnetwork_ip_ranges_to_nat = "LIST_OF_SUBNETWORKS"

  subnetwork {
    name                    = "https://www.googleapis.com/compute/v1/projects/${var.project_id}/regions/${var.region}/subnetworks/${var.in_scope_subnet_name}"
    source_ip_ranges_to_nat = ["PRIMARY_IP_RANGE"]
  }

  subnetwork {
    name                    = "https://www.googleapis.com/compute/v1/projects/${var.project_id}/regions/${var.region}/subnetworks/${var.out_of_scope_subnet_name}"
    source_ip_ranges_to_nat = ["PRIMARY_IP_RANGE"]
  }
}

# Sets up a custom Firewall Admin that we use to allow GKE's service agent to
# freely modify Firewall rules on the network project.
#
# If you would like to manage Firewall rules manually or through other means,
# remove these permissions.
#
resource "google_project_iam_custom_role" "firewall_admin" {
  depends_on = [module.vpc_pci]
  project    = var.project_id
  role_id    = "firewall_admin"
  title      = "Firewall Admin"

  permissions = [
    "compute.firewalls.create",
    "compute.firewalls.get",
    "compute.firewalls.delete",
    "compute.firewalls.list",
    "compute.firewalls.update",
    "compute.networks.updatePolicy",
  ]
}

# role_id of a form to be consumed by the role attribute of google_project_iam_member
output firewall_admin_role_id_custom_formatted {
  value = "projects/${var.project_id}/roles/${google_project_iam_custom_role.firewall_admin.role_id}"
}

