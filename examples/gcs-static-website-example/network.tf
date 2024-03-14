#    Copyright 2023 Google LLC

#    Licensed under the Apache License, Version 2.0 (the "License");
#    you may not use this file except in compliance with the License.
#    You may obtain a copy of the License at

#        http://www.apache.org/licenses/LICENSE-2.0

#    Unless required by applicable law or agreed to in writing, software
#    distributed under the License is distributed on an "AS IS" BASIS,
#    WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
#    See the License for the specific language governing permissions and
#    limitations under the License.

resource "google_compute_network" "default" {
  name                    = "vpc-network"
  project = data.google_project.project.project_id
  auto_create_subnetworks = "false"
}

resource "google_compute_subnetwork" "subnet" {
  name                     = "subnet"
  ip_cidr_range            = "10.125.0.0/20"
  network                  = google_compute_network.default.self_link
  region                   = var.region
  private_ip_google_access = true
}

# Router and Cloud NAT are required for installing packages from repos (apache, php etc)
module "cloud-nat" {
  source     = "terraform-google-modules/cloud-nat/google"
  version    = "~> 1.2"
  project_id = data.google_project.project.project_id
  region     = var.region
  router     = module.cloud_router.router.name
}

module "cloud_router" {
  source  = "terraform-google-modules/cloud-router/google"
  version = "~> 5.0"
  name    = "nat-router"
  project = data.google_project.project.project_id
  region  = var.region
  network = google_compute_network.default.name
}

# SSH is optional, but helpful for debugging. For extra security, limit to IAP ranges only and 
# ssh into VM via Google Cloud Console
resource "google_compute_firewall" "allow-iap-ssh" {
  name        = "allow-iap-ssh"
  network     = google_compute_network.default.name
  description = "Creates firewall rule targeting tagged instances"

  allow {
    protocol  = "tcp"
    ports     = ["22"]
  }

  source_ranges = ["35.235.240.0/20"]
  target_tags = ["allow-iap-ssh"]
}


# Allow HTTP requests from GCLB (classic) ranges only. This is also required for health checks.
resource "google_compute_firewall" "allow-http" {
  name        = "allow-http"
  network     = google_compute_network.default.name
  description = "Creates firewall rule targeting tagged instances"

  allow {
    protocol  = "tcp"
    ports     = ["80"]
  }

  source_ranges = ["130.211.0.0/22","35.191.0.0/16"]
  target_tags = ["allow-http"]
}