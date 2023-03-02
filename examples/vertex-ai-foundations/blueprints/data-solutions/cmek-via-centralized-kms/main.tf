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
#                                   Projects                                  #
###############################################################################

module "project-service" {
  source          = "../../../modules/project"
  name            = var.project_service_name
  parent          = var.root_node
  billing_account = var.billing_account
  services = [
    "compute.googleapis.com",
    "servicenetworking.googleapis.com",
    "storage-component.googleapis.com"
  ]
  oslogin = true
}

module "project-kms" {
  source          = "../../../modules/project"
  name            = var.project_kms_name
  parent          = var.root_node
  billing_account = var.billing_account
  services = [
    "cloudkms.googleapis.com",
    "servicenetworking.googleapis.com"
  ]
  oslogin = true
}

###############################################################################
#                                   Networking                                #
###############################################################################

module "vpc" {
  source     = "../../../modules/net-vpc"
  project_id = module.project-service.project_id
  name       = var.vpc_name
  subnets = [
    {
      ip_cidr_range = var.vpc_ip_cidr_range
      name          = var.vpc_subnet_name
      region        = var.region
    }
  ]
}

module "vpc-firewall" {
  source     = "../../../modules/net-vpc-firewall"
  project_id = module.project-service.project_id
  network    = module.vpc.name
  default_rules_config = {
    admin_ranges = [var.vpc_ip_cidr_range]
  }
}

###############################################################################
#                                   KMS                                       #
###############################################################################

module "kms" {
  source     = "../../../modules/kms"
  project_id = module.project-kms.project_id
  keyring = {
    name     = "my-keyring",
    location = var.location
  }
  keys = { key-gce = null, key-gcs = null }
  key_iam = {
    key-gce = {
      "roles/cloudkms.cryptoKeyEncrypterDecrypter" = [
        "serviceAccount:${module.project-service.service_accounts.robots.compute}",
      ]
    },
    key-gcs = {
      "roles/cloudkms.cryptoKeyEncrypterDecrypter" = [
        "serviceAccount:${module.project-service.service_accounts.robots.storage}",
      ]
    }
  }
}

###############################################################################
#                                   GCE                                       #
###############################################################################

module "vm_example" {
  source     = "../../../modules/compute-vm"
  project_id = module.project-service.project_id
  zone       = "${var.region}-b"
  name       = "kms-vm"
  network_interfaces = [{
    network    = module.vpc.self_link,
    subnetwork = module.vpc.subnet_self_links["${var.region}/subnet"],
    nat        = false,
    addresses  = null
  }]
  attached_disks = [
    {
      name        = "data"
      size        = 10
      source      = null
      source_type = null
      options     = null
    }
  ]
  boot_disk = {
    image        = "projects/debian-cloud/global/images/family/debian-10"
    type         = "pd-ssd"
    size         = 10
    encrypt_disk = true
  }
  tags = ["ssh"]
  encryption = {
    encrypt_boot            = true
    disk_encryption_key_raw = null
    kms_key_self_link       = module.kms.key_ids.key-gce
  }
}

###############################################################################
#                                   GCS                                       #
###############################################################################

module "kms-gcs" {
  source         = "../../../modules/gcs"
  project_id     = module.project-service.project_id
  prefix         = "my-bucket-001"
  name           = "kms-gcs"
  encryption_key = module.kms.keys.key-gcs.id
}
