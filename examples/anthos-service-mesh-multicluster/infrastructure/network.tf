/**
 * Copyright 2021 Google LLC
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

# Creating the network
# Create two VPCs, each with a private GKE cluster and one bastion server

# VPC 3
resource "google_compute_network" "asm-vpc-3" {
  name                    = "${var.prefix}-vpc-3"
  project                 = var.project_id
  auto_create_subnetworks = false
}

resource "google_compute_subnetwork" "bastion-subnet" {
  name                     = "bastion-subnet"
  project                  = var.project_id
  region                   = "us-west2"
  network                  = google_compute_network.asm-vpc-3.self_link
  private_ip_google_access = true
  ip_cidr_range            = "10.0.0.0/24"
}

resource "google_compute_subnetwork" "cluster3" {
  name                     = "cluster3"
  project                  = var.project_id
  region                   = var.region
  network                  = google_compute_network.asm-vpc-3.self_link
  private_ip_google_access = true
  ip_cidr_range            = "10.184.19.0/24"
  secondary_ip_range {
    range_name    = "cluster3-pod-cidr"
    ip_cidr_range = "10.185.128.0/18"
  }
  secondary_ip_range {
    range_name    = "cluster3-services-cidr"
    ip_cidr_range = "172.16.2.0/24"
  }
}

resource "google_compute_router" "router3" {
  name    = "${var.prefix}-router3"
  project = var.project_id
  region  = var.region
  network = google_compute_network.asm-vpc-3.self_link
}

# outbound NAT for private clusters
resource "google_compute_router_nat" "nat3" {
  name                               = "${var.prefix}-nat3"
  project                            = var.project_id
  region                             = var.region
  router                             = google_compute_router.router3.name
  nat_ip_allocate_option             = "AUTO_ONLY"
  source_subnetwork_ip_ranges_to_nat = "LIST_OF_SUBNETWORKS"

  subnetwork {
    name                    = google_compute_subnetwork.cluster3.self_link
    source_ip_ranges_to_nat = ["PRIMARY_IP_RANGE"]
  }

  subnetwork {
    name                    = google_compute_subnetwork.cluster4.self_link
    source_ip_ranges_to_nat = ["PRIMARY_IP_RANGE"]
  }
}

resource "google_compute_subnetwork" "cluster4" {
  name                     = "cluster4"
  project                  = var.project_id
  region                   = var.region
  network                  = google_compute_network.asm-vpc-3.self_link
  private_ip_google_access = true
  ip_cidr_range            = "10.184.20.0/24"
  secondary_ip_range {
    range_name    = "cluster4-pod-cidr"
    ip_cidr_range = "10.185.192.0/18"
  }
  secondary_ip_range {
    range_name    = "cluster4-services-cidr"
    ip_cidr_range = "172.16.3.0/24"
  }
}

# setting IAM policy
data "google_iam_policy" "cluster-policy" {
  binding {
    role = "roles/compute.networkUser"
    members = ["serviceAccount:${data.google_project.project.number}@cloudservices.gserviceaccount.com",]
  }
  binding {
    role = "roles/compute.networkUser"
    members = ["serviceAccount:service-${data.google_project.project.number}@container-engine-robot.iam.gserviceaccount.com",]
  }
}

resource "google_compute_subnetwork_iam_policy" "cluster3" {
  project     = var.project_id
  region      = var.region
  subnetwork  = google_compute_subnetwork.cluster3.name
  policy_data = data.google_iam_policy.cluster-policy.policy_data
}

resource "google_compute_subnetwork_iam_policy" "cluster4" {
  project     = var.project_id
  region      = var.region
  subnetwork  = google_compute_subnetwork.cluster4.name
  policy_data = data.google_iam_policy.cluster-policy.policy_data
}
