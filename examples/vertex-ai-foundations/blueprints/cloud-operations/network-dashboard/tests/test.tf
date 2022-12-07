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

resource "google_folder" "test-net-dash" {
  display_name = "test-net-dash"
  parent       = "organizations/${var.organization_id}"
}

##### Creating host projects, VPCs, service projects #####

module "project-hub" {
  source          = "../../../../modules/project"
  name            = "test-host-hub"
  parent          = google_folder.test-net-dash.name
  prefix          = var.prefix
  billing_account = var.billing_account
  services        = var.project_vm_services

  shared_vpc_host_config = {
    enabled = true
  }
}

module "vpc-hub" {
  source     = "../../../../modules/net-vpc"
  project_id = module.project-hub.project_id
  name       = "vpc-hub"
  subnets = [
    {
      ip_cidr_range = "10.0.10.0/24"
      name          = "subnet-hub-1"
      region        = var.region
    }
  ]
}

module "project-svc-hub" {
  source          = "../../../../modules/project"
  parent          = google_folder.test-net-dash.name
  billing_account = var.billing_account
  prefix          = var.prefix
  name            = "test-svc-hub"
  services        = var.project_vm_services

  shared_vpc_service_config = {
    attach       = true
    host_project = module.project-hub.project_id
  }
}

module "project-prod" {
  source          = "../../../../modules/project"
  name            = "test-host-prod"
  parent          = google_folder.test-net-dash.name
  prefix          = var.prefix
  billing_account = var.billing_account
  services        = var.project_vm_services

  shared_vpc_host_config = {
    enabled = true
  }
}

module "vpc-prod" {
  source     = "../../../../modules/net-vpc"
  project_id = module.project-prod.project_id
  name       = "vpc-prod"
  subnets = [
    {
      ip_cidr_range = "10.0.20.0/24"
      name          = "subnet-prod-1"
      region        = var.region
    }
  ]
}

module "project-svc-prod" {
  source          = "../../../../modules/project"
  parent          = google_folder.test-net-dash.name
  billing_account = var.billing_account
  prefix          = var.prefix
  name            = "test-svc-prod"
  services        = var.project_vm_services

  shared_vpc_service_config = {
    attach       = true
    host_project = module.project-prod.project_id
  }
}

module "project-dev" {
  source          = "../../../../modules/project"
  name            = "test-host-dev"
  parent          = google_folder.test-net-dash.name
  prefix          = var.prefix
  billing_account = var.billing_account
  services        = var.project_vm_services

  shared_vpc_host_config = {
    enabled = true
  }
}

module "vpc-dev" {
  source     = "../../../../modules/net-vpc"
  project_id = module.project-dev.project_id
  name       = "vpc-dev"
  subnets = [
    {
      ip_cidr_range = "10.0.30.0/24"
      name          = "subnet-dev-1"
      region        = var.region
    }
  ]
}

module "project-svc-dev" {
  source          = "../../../../modules/project"
  parent          = google_folder.test-net-dash.name
  billing_account = var.billing_account
  prefix          = var.prefix
  name            = "test-svc-dev"
  services        = var.project_vm_services

  shared_vpc_service_config = {
    attach       = true
    host_project = module.project-dev.project_id
  }
}

##### Creating VPC peerings #####

module "hub-to-prod-peering" {
  source        = "../../../../modules/net-vpc-peering"
  local_network = module.vpc-hub.self_link
  peer_network  = module.vpc-prod.self_link
}

module "prod-to-hub-peering" {
  source        = "../../../../modules/net-vpc-peering"
  local_network = module.vpc-prod.self_link
  peer_network  = module.vpc-hub.self_link
  depends_on    = [module.hub-to-prod-peering]
}

module "hub-to-dev-peering" {
  source        = "../../../../modules/net-vpc-peering"
  local_network = module.vpc-hub.self_link
  peer_network  = module.vpc-dev.self_link
}

module "dev-to-hub-peering" {
  source        = "../../../../modules/net-vpc-peering"
  local_network = module.vpc-dev.self_link
  peer_network  = module.vpc-hub.self_link
  depends_on    = [module.hub-to-dev-peering]
}

##### Creating VMs #####

resource "google_compute_instance" "test-vm-prod1" {
  project      = module.project-svc-prod.project_id
  name         = "test-vm-prod1"
  machine_type = "f1-micro"
  zone         = var.zone

  tags = ["${var.region}"]

  boot_disk {
    initialize_params {
      image = "debian-cloud/debian-9"
    }
  }

  network_interface {
    subnetwork         = module.vpc-prod.subnet_self_links["${var.region}/subnet-prod-1"]
    subnetwork_project = module.project-prod.project_id
  }

  allow_stopping_for_update = true
}

resource "google_compute_instance" "test-vm-prod2" {
  project      = module.project-prod.project_id
  name         = "test-vm-prod2"
  machine_type = "f1-micro"
  zone         = var.zone

  tags = [var.region]

  boot_disk {
    initialize_params {
      image = "debian-cloud/debian-9"
    }
  }

  network_interface {
    subnetwork         = module.vpc-prod.subnet_self_links["${var.region}/subnet-prod-1"]
    subnetwork_project = module.project-prod.project_id
  }

  allow_stopping_for_update = true
}

resource "google_compute_instance" "test-vm-dev1" {
  count        = 10
  project      = module.project-svc-dev.project_id
  name         = "test-vm-dev${count.index}"
  machine_type = "f1-micro"
  zone         = var.zone

  tags = ["${var.region}"]

  boot_disk {
    initialize_params {
      image = "debian-cloud/debian-9"
    }
  }

  network_interface {
    subnetwork         = module.vpc-dev.subnet_self_links["${var.region}/subnet-dev-1"]
    subnetwork_project = module.project-dev.project_id
  }

  allow_stopping_for_update = true
}

resource "google_compute_instance" "test-vm-hub1" {
  project      = module.project-svc-hub.project_id
  name         = "test-vm-hub1"
  machine_type = "f1-micro"
  zone         = var.zone

  tags = ["${var.region}"]

  boot_disk {
    initialize_params {
      image = "debian-cloud/debian-9"
    }
  }

  network_interface {
    subnetwork         = module.vpc-hub.subnet_self_links["${var.region}/subnet-hub-1"]
    subnetwork_project = module.project-hub.project_id
  }

  allow_stopping_for_update = true
}

# Forwarding Rules
resource "google_compute_forwarding_rule" "forwarding-rule-dev" {
  count      = 10
  name       = "forwarding-rule-dev${count.index}"
  project    = module.project-svc-dev.project_id
  network    = module.vpc-dev.self_link
  subnetwork = module.vpc-dev.subnet_self_links["${var.region}/subnet-dev-1"]

  region                = var.region
  backend_service       = google_compute_region_backend_service.test-backend.id
  ip_protocol           = "TCP"
  load_balancing_scheme = "INTERNAL"
  all_ports             = true
  allow_global_access   = true

}

# backend service
resource "google_compute_region_backend_service" "test-backend" {
  name                  = "test-backend"
  region                = var.region
  project               = module.project-svc-dev.project_id
  protocol              = "TCP"
  load_balancing_scheme = "INTERNAL"
}
