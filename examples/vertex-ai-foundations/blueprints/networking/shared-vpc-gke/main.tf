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

###############################################################################
#                          Host and service projects                          #
###############################################################################

# the container.hostServiceAgentUser role is needed for GKE on shared VPC
# see: https://cloud.google.com/kubernetes-engine/docs/how-to/cluster-shared-vpc#grant_host_service_agent_role

module "project-host" {
  source          = "../../../modules/project"
  parent          = var.root_node
  billing_account = var.billing_account_id
  prefix          = var.prefix
  name            = "net"
  services        = concat(var.project_services, ["dns.googleapis.com"])
  shared_vpc_host_config = {
    enabled = true
  }
  iam = {
    "roles/owner" = var.owners_host
  }
}

module "project-svc-gce" {
  source          = "../../../modules/project"
  parent          = var.root_node
  billing_account = var.billing_account_id
  prefix          = var.prefix
  name            = "gce"
  services        = var.project_services
  oslogin         = true
  oslogin_admins  = var.owners_gce
  shared_vpc_service_config = {
    host_project = module.project-host.project_id
    service_identity_iam = {
      "roles/compute.networkUser" = ["cloudservices"]
    }
  }
  iam = {
    "roles/owner" = var.owners_gce
  }
}

# the container.developer role assigned to the bastion instance service account
# allows to fetch GKE credentials from bastion for clusters in this project

module "project-svc-gke" {
  source          = "../../../modules/project"
  parent          = var.root_node
  billing_account = var.billing_account_id
  prefix          = var.prefix
  name            = "gke"
  services        = var.project_services
  shared_vpc_service_config = {
    host_project = module.project-host.project_id
    service_identity_iam = {
      "roles/container.hostServiceAgentUser" = ["container-engine"]
      "roles/compute.networkUser"            = ["container-engine"]
    }
  }
  iam = merge(
    {
      "roles/container.developer" = [module.vm-bastion.service_account_iam_email]
      "roles/owner"               = var.owners_gke
    },
    var.cluster_create
    ? {
      "roles/logging.logWriter"       = [module.cluster-1-nodepool-1.0.service_account_iam_email]
      "roles/monitoring.metricWriter" = [module.cluster-1-nodepool-1.0.service_account_iam_email]
    }
    : {}
  )
}

################################################################################
#                                  Networking                                  #
################################################################################

# subnet IAM bindings control which identities can use the individual subnets

module "vpc-shared" {
  source     = "../../../modules/net-vpc"
  project_id = module.project-host.project_id
  name       = "shared-vpc"
  subnets = [
    {
      ip_cidr_range = var.ip_ranges.gce
      name          = "gce"
      region        = var.region
    },
    {
      ip_cidr_range = var.ip_ranges.gke
      name          = "gke"
      region        = var.region
      secondary_ip_ranges = {
        pods     = var.ip_secondary_ranges.gke-pods
        services = var.ip_secondary_ranges.gke-services
      }
    }
  ]
  subnet_iam = {
    "${var.region}/gce" = {
      "roles/compute.networkUser" = concat(var.owners_gce, [
        "serviceAccount:${module.project-svc-gce.service_accounts.cloud_services}",
      ])
    }
    "${var.region}/gke" = {
      "roles/compute.networkUser" = concat(var.owners_gke, [
        "serviceAccount:${module.project-svc-gke.service_accounts.cloud_services}",
        "serviceAccount:${module.project-svc-gke.service_accounts.robots.container-engine}",
      ])
      "roles/compute.securityAdmin" = [
        "serviceAccount:${module.project-svc-gke.service_accounts.robots.container-engine}",
      ]
    }
  }
}

module "vpc-shared-firewall" {
  source     = "../../../modules/net-vpc-firewall"
  project_id = module.project-host.project_id
  network    = module.vpc-shared.name
  default_rules_config = {
    admin_ranges = values(var.ip_ranges)
  }
}

module "nat" {
  source         = "../../../modules/net-cloudnat"
  project_id     = module.project-host.project_id
  region         = var.region
  name           = "vpc-shared"
  router_create  = true
  router_network = module.vpc-shared.name
}

################################################################################
#                                     DNS                                      #
################################################################################

module "host-dns" {
  source          = "../../../modules/dns"
  project_id      = module.project-host.project_id
  type            = "private"
  name            = "example"
  domain          = "example.com."
  client_networks = [module.vpc-shared.self_link]
  recordsets = {
    "A localhost" = { records = ["127.0.0.1"] }
    "A bastion"   = { records = [module.vm-bastion.internal_ip] }
  }
}

################################################################################
#                                     VM                                      #
################################################################################

module "vm-bastion" {
  source     = "../../../modules/compute-vm"
  project_id = module.project-svc-gce.project_id
  zone       = "${var.region}-b"
  name       = "bastion"
  network_interfaces = [{
    network    = module.vpc-shared.self_link
    subnetwork = lookup(module.vpc-shared.subnet_self_links, "${var.region}/gce", null)
    nat        = false
    addresses  = null
  }]
  tags = ["ssh"]
  metadata = {
    startup-script = join("\n", [
      "#! /bin/bash",
      "apt-get update",
      "apt-get install -y bash-completion kubectl dnsutils tinyproxy",
      "grep -qxF 'Allow localhost' /etc/tinyproxy/tinyproxy.conf || echo 'Allow localhost' >> /etc/tinyproxy/tinyproxy.conf",
      "service tinyproxy restart"
    ])
  }
  service_account_create = true
}

################################################################################
#                                     GKE                                      #
################################################################################

module "cluster-1" {
  source     = "../../../modules/gke-cluster"
  count      = var.cluster_create ? 1 : 0
  name       = "cluster-1"
  project_id = module.project-svc-gke.project_id
  location   = "${var.region}-b"
  vpc_config = {
    network    = module.vpc-shared.self_link
    subnetwork = module.vpc-shared.subnet_self_links["${var.region}/gke"]
    master_authorized_ranges = {
      internal-vms = var.ip_ranges.gce
    }
    master_ipv4_cidr_block = var.private_service_ranges.cluster-1
  }
  max_pods_per_node = 32
  private_cluster_config = {
    enable_private_endpoint = true
    master_global_access    = true
  }
  labels = {
    environment = "test"
  }
}

module "cluster-1-nodepool-1" {
  source       = "../../../modules/gke-nodepool"
  count        = var.cluster_create ? 1 : 0
  name         = "nodepool-1"
  project_id   = module.project-svc-gke.project_id
  location     = module.cluster-1.0.location
  cluster_name = module.cluster-1.0.name
  service_account = {
    create = true
  }
}
