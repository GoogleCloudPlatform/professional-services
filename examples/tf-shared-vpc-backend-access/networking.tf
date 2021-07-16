# Copyright 2021 Google LLC
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

# Configure two existing projects - set up the shared VPC Host + attach the service project
# Create a VPC to be shared
resource "google_compute_network" "shared-vpc-host" {
  project                 = var.shared_vpc_host_project
  name                    = "shared-vpc"
  auto_create_subnetworks = false
}

# Reserve the /28 subnet for the VPC Serverless Connector
resource "google_compute_subnetwork" "shared-vpc-host-connector" {
  project       = var.shared_vpc_host_project
  name          = "shared-vpc-connector"
  ip_cidr_range = "${var.ip_prefix}.0.0/28"
  region        = var.region
  network       = google_compute_network.shared-vpc-host.id
}

# Reserve some random subnet for the example server
resource "google_compute_subnetwork" "shared-vpc-host-vm" {
  project       = var.shared_vpc_host_project
  name          = "shared-vpc-vm"
  ip_cidr_range = "${var.ip_prefix}.1.0/24"
  region        = var.region
  network       = google_compute_network.shared-vpc-host.id
}

# Reserve an IP address for the example server
resource "google_compute_address" "example-server-internal-ip" {
  project      = var.shared_vpc_host_project
  name         = "example-server-internal-ip"
  subnetwork   = google_compute_subnetwork.shared-vpc-host-vm.id
  address_type = "INTERNAL"
  # see index.js
  address = "${var.ip_prefix}.1.6"
  region  = var.region
}

# Assign the shared VPC host project
# Beware, destroying this might need to be done in two steps
# since the destroy process does not figure out the dependencies right
resource "google_compute_shared_vpc_host_project" "host" {
  project = var.shared_vpc_host_project
}

# Assign the shared VPC user project
resource "google_compute_shared_vpc_service_project" "cloudrun_svc" {
  host_project    = var.shared_vpc_host_project
  service_project = var.cloud_run_project
  depends_on = [
    google_compute_shared_vpc_host_project.host
  ]
}