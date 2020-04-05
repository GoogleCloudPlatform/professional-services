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

locals {
  in_scope_subnet_name                = "in-scope"
  mgmt_subnet_name                    = "mgmt"
  out_of_scope_subnet_name            = "out-of-scope"
  vpc_name                            = "test-vpc"
  in_scope_services_ip_range_name     = "in-scope-services"
  in_scope_pod_ip_range_name          = "in-scope-pods"
  out_of_scope_services_ip_range_name = "out-of-scope-services"
  out_of_scope_pod_ip_range_name      = "out-of-scope-pods"
}

// Required to have KMS key set in project prior to executing
data "google_kms_key_ring" "helloworld-keyring" {
  project  = var.project_id
  name     = "cicd-testing-keyring"
  location = var.region
}

data "google_kms_crypto_key" "helloworld-key" {
  name     = "cicd-testing-key"
  key_ring = data.google_kms_key_ring.helloworld-keyring.self_link
}


# test service account
resource "google_service_account" "test_service_account" {
  account_id   = "cicd-test-service-account"
  display_name = "CICD testing service account"
  project      = var.project_id
}


module "logging" {
  source                       = "../../../terraform/modules/logging"
  project_id                   = var.project_id
  force_destroy_logging_bucket = "true"
}

module "vpc_setup" {
  source = "../../../terraform/modules/pci-starter-vpc"

  is_shared_vpc_host = "false"
  project_id         = var.project_id
  region             = var.region
  vpc_name           = local.vpc_name

  # Management Subnetwork
  mgmt_subnet_name = local.mgmt_subnet_name
  mgmt_subnet_cidr = var.mgmt_subnet_cidr

  # In Scope Subnetwork
  in_scope_subnet_name            = local.in_scope_subnet_name
  in_scope_subnet_cidr            = var.in_scope_subnet_cidr
  in_scope_services_ip_range_name = local.in_scope_services_ip_range_name
  in_scope_pod_ip_range_name      = local.in_scope_pod_ip_range_name

  # Out of Scope Subnetwork
  out_of_scope_subnet_name            = local.out_of_scope_subnet_name
  out_of_scope_subnet_cidr            = var.out_of_scope_subnet_cidr
  out_of_scope_services_ip_range_name = local.out_of_scope_services_ip_range_name
  out_of_scope_pod_ip_range_name      = local.out_of_scope_pod_ip_range_name
}



module "helloworld-app" {
  source                = "../../../terraform/modules/helloworld_app"
  project_id            = var.project_id
  region                = var.region
  network_project_id    = module.vpc_setup.project_id
  subnetwork_name       = module.vpc_setup.subnets["${var.region}/${local.in_scope_subnet_name}"].name
  #subnetwork_name       = local.in_scope_subnet_name
  vpc_name              = module.vpc_setup.network_name
  disk_encryption_key   = data.google_kms_crypto_key.helloworld-key.self_link
  service_account_email = google_service_account.test_service_account.email
}

//module "in-scope-hipsterstore" {
//  source              = "../../../terraform/modules/in-scope-hipsterstore-cluster"
//  region              = var.region
//  project_id          = var.project_id
//  cluster_name        = "hipsterstore"
//  cluster_location    = var.cluster_location
//  node_locations      = var.node_locations
//  gke_minimum_version = var.gke_minimum_version
//
//  # Network Configuration
//  subnetwork_name        = local.in_scope_subnet_name
//  network_project_id     = var.project_id
//  network_self_link      = "https://www.googleapis.com/compute/v1/projects/${var.project_id}/global/networks/${local.vpc_name}"
//  pod_ip_range_name      = local.in_scope_pod_ip_range_name
//  services_ip_range_name = local.in_scope_services_ip_range_name
//
//  # Access Controls
//  service_account_email = google_service_account.test_service_account.email
//  mgmt_subnet_cidr      = var.mgmt_subnet_cidr
//}


/*
module "notifications" {
  source                = "../../../terraform/modules/notifications"
  project_id            = var.project_id
  bucket_location       = "US"
  bucket_name           = "${var.project_id}-cloud-function-code"
  service_account_email = "${var.project_id}@appspot.gserviceaccount.com"
}
*/
