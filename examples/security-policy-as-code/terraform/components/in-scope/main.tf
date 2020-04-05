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

data "terraform_remote_state" "project_in_scope" {
  backend = "gcs"

  config = {
    bucket = var.remote_state_bucket
    prefix = "terraform/state/in-scope"
  }
}

data "terraform_remote_state" "vpc_info" {
  backend = "gcs"

  config = {
    bucket = var.remote_state_bucket
    prefix = "terraform/state/network_vpc"
  }
}

data "google_kms_key_ring" "helloworld-keyring" {
  project  = local.this_inscope_project_id
  name     = "helloworld-keyring"
  location = "us-central1"
}

data "google_kms_crypto_key" "helloworld-key" {
  name     = "helloworld-key"
  key_ring = data.google_kms_key_ring.helloworld-keyring.self_link
}

locals {
  remote_network_project_id = "${data.terraform_remote_state.vpc_info.outputs.project_id}"
  remote_inscope_project_id = "${data.terraform_remote_state.vpc_info.outputs.project_id}"

  this_inscope_project_id = "${local.remote_inscope_project_id == "" ? local.project_in_scope : local.remote_inscope_project_id}"
  this_network_project_id = "${local.remote_network_project_id == "" ? local.project_network : local.remote_network_project_id}"
}

module "in-scope-hipsterstore" {
  # Enable
  source  = "../../modules/in-scope-hipsterstore-cluster"
  enabled = var.enable_hipsterstore_app

  # Basic Info
  region              = var.region
  project_id          = local.this_inscope_project_id
  cluster_name        = var.in_scope_cluster_name
  cluster_location    = var.cluster_location
  node_locations      = var.node_locations
  gke_minimum_version = var.gke_minimum_version

  # Network Configuration
  subnetwork_name        = var.in_scope_subnet_name
  network_project_id     = local.this_network_project_id
  network_self_link      = data.terraform_remote_state.vpc_info.outputs.vpc_self_link
  pod_ip_range_name      = var.in_scope_pod_ip_range_name
  services_ip_range_name = var.in_scope_services_ip_range_name

  # Access Controls
  service_account_email = var.override_inscope_sa_email == "" ? data.terraform_remote_state.project_in_scope.outputs.service_account_email : var.override_inscope_sa_email
  mgmt_subnet_cidr      = var.mgmt_subnet_cidr

}

module "helloworld-app" {
  source = "../../modules/helloworld_app"
  // TODO: implement enabled/disabled behavior
  //enabled = var.enable_helloworld_app

  project_id = local.this_inscope_project_id
  region     = var.region

  # Network Configuration
  network_project_id = local.this_network_project_id
  subnetwork_name    = var.in_scope_subnet_name
  vpc_name           = var.shared_vpc_name

  # Access Controls
  disk_encryption_key   = data.google_kms_crypto_key.helloworld-key.self_link
  service_account_email = var.override_inscope_sa_email == "" ? data.terraform_remote_state.project_in_scope.outputs.service_account_email : var.override_inscope_sa_email
}


module "logging" {
  source = "../../modules/logging"

  project_id = local.this_inscope_project_id
}

/* ** this code calls the module that create the cloud function that handles eMail notifications
** for this code to be functional, you must sign up for a Mailgun account and update placeholder values in env_setup.shared_vpc_name
** see the main README for details
module "notifications" {
  source                = "../../modules/notifications"
  project_id            = local.this_inscope_project_id
  bucket_location       = var.bucket_location
  bucket_name           = format("%s-cloud-function-code", local.this_inscope_project_id)
  service_account_email = format("%s@appspot.gserviceaccount.com", local.this_inscope_project_id)
}
*/
