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
  startup-script = <<END
  #!/bin/bash
  apt install -y bash-completion dnsutils
  END
}

module "project" {
  source         = "../../../modules/project"
  name           = var.project_id
  project_create = var.project_create
  services = [
    "compute.googleapis.com",
    "dns.googleapis.com",
    "servicedirectory.googleapis.com"
  ]
}

module "vpc" {
  source     = "../../../modules/net-vpc"
  project_id = module.project.project_id
  name       = var.name
  subnets = [{
    ip_cidr_range = "192.168.0.0/24"
    name          = "${var.name}-default"
    region        = var.region
  }]
}

module "firewall-a" {
  source     = "../../../modules/net-vpc-firewall"
  project_id = module.project.project_id
  network    = module.vpc.name
}

module "nat-a" {
  source         = "../../../modules/net-cloudnat"
  project_id     = module.project.project_id
  region         = var.region
  name           = var.name
  router_network = module.vpc.name
}

module "dns-service-zone" {
  source                      = "../../../modules/dns"
  project_id                  = module.project.project_id
  type                        = "service-directory"
  name                        = var.name
  domain                      = var.zone_domain
  client_networks             = [module.vpc.self_link]
  service_directory_namespace = module.service-directory.id
}

module "service-directory" {
  source     = "../../../modules/service-directory"
  project_id = module.project.project_id
  location   = var.region
  name       = var.name
  iam = {
    "roles/servicedirectory.editor" = [
      module.vm-ns-editor.service_account_iam_email
    ]
  }
  services = {
    app1 = { endpoints = ["vm1", "vm2"], metadata = null }
    app2 = { endpoints = ["vm1", "vm2"], metadata = null }
  }
  service_iam = {
    app1 = {
      "roles/servicedirectory.editor" = [
        module.vm-svc-editor.service_account_iam_email
      ]
    }
  }
  endpoint_config = {
    "app1/vm1" = { address = "127.0.0.2", port = 80, metadata = {} }
    "app1/vm2" = { address = "127.0.0.3", port = 80, metadata = {} }
    "app2/vm1" = { address = "127.0.0.4", port = 80, metadata = {} }
    "app2/vm2" = { address = "127.0.0.5", port = 80, metadata = {} }
  }
}

module "vm-ns-editor" {
  source     = "../../../modules/compute-vm"
  project_id = module.project.project_id
  zone       = "${var.region}-b"
  name       = "${var.name}-ns"
  network_interfaces = [{
    network    = module.vpc.self_link
    subnetwork = module.vpc.subnet_self_links["${var.region}/${var.name}-default"]
    nat        = false
    addresses  = null
  }]
  metadata               = { startup-script = local.startup-script }
  service_account_create = true
  tags                   = ["ssh"]
}

module "vm-svc-editor" {
  source     = "../../../modules/compute-vm"
  project_id = module.project.project_id
  zone       = "${var.region}-b"
  name       = "${var.name}-svc"
  network_interfaces = [{
    network    = module.vpc.self_link
    subnetwork = module.vpc.subnet_self_links["${var.region}/${var.name}-default"]
    nat        = false
    addresses  = null
  }]
  metadata               = { startup-script = local.startup-script }
  service_account_create = true
  tags                   = ["ssh"]
}
