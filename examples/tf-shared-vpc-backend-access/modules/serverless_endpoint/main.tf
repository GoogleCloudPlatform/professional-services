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

locals {
  # This value can not be a variable since it's derived from another variable. You can redefine it here.
  example_server_image = "gcr.io/${var.cloud_run_project}/helloproxy"

  # Documentation here: https://cloud.google.com/vpc/docs/configure-serverless-vpc-access#firewall-rules-shared-vpc
  firewall_nat_ip_ranges         = ["107.178.230.64/26", "35.199.224.0/19", ]
  firewall_healthcheck_ip_ranges = ["130.211.0.0/22", "35.191.0.0/16", "108.170.220.0/23", ]
}

data "google_project" "project" {
  project_id = var.cloud_run_project
}

# Submit a build to Cloud Run to deploy the container
resource "null_resource" "helloproxy" {
  provisioner "local-exec" {
    command     = "cd server; gcloud builds submit --project ${var.cloud_run_project} --tag ${local.example_server_image}"
    interpreter = ["bash", "-c"]
  }
  triggers = {
    for file in fileset("server/", "*") : file => filesha256("server/${file}")
  }
}

# Deploy Cloud Run
resource "google_cloud_run_service" "default" {
  project  = var.cloud_run_project
  name     = var.name
  location = var.region

  metadata {
    annotations = {
      # Do not allow requests coming from the internet, only ones that passed GCLB or coming from the internal network
      # Documentation here: https://cloud.google.com/run/docs/securing/ingress#yaml
      "run.googleapis.com/ingress" = "internal-and-cloud-load-balancing"
    }
  }

  template {
    spec {
      containers {
        # One could use environment variables here for the IP of the server
        # Out of the scope of this example
        image = local.example_server_image
        ports {
          container_port = 80
        }
      }
    }

    metadata {
      annotations = {
        "autoscaling.knative.dev/maxScale" = "101"
        # Allow using the VPC Serverless connector
        # Documented here: https://cloud.google.com/run/docs/configuring/connecting-vpc#yaml_1
        "run.googleapis.com/vpc-access-connector" = google_vpc_access_connector.connector.id
        "run.googleapis.com/vpc-access-egress"    = "private-ranges-only"
      }
    }
  }

  depends_on = [google_project_iam_member.cloudrun-use-vpc-connector, null_resource.helloproxy]
}

# Grant Cloud Run usage rights to someone who is authorized to access the end-point
resource "google_cloud_run_service_iam_member" "default" {
  project  = var.cloud_run_project
  location = google_cloud_run_service.default.location
  service  = google_cloud_run_service.default.name

  role = "roles/run.invoker"

  # Replace with "user:YOUR_IAM_USER" for granting access only to yourself
  member = var.cloud_run_invoker
}

# Serverless Network Endpoint Group (NEG) to be used in the load balancer backend
resource "google_compute_region_network_endpoint_group" "default" {
  provider              = google-beta
  project               = var.cloud_run_project
  name                  = "${var.name}-neg"
  network_endpoint_type = "SERVERLESS"
  region                = var.region
  cloud_run {
    service = google_cloud_run_service.default.name
  }
}

# Load balancer with the serverless NEG defined above
module "lb-http_serverless_negs" {
  source  = "GoogleCloudPlatform/lb-http/google//modules/serverless_negs"
  version = "5.0.0"

  project = var.cloud_run_project
  name    = "${var.name}-lb"

  ssl = false

  backends = {
    default = {
      description            = "Load balancer for Cloud Run"
      enable_cdn             = false
      custom_request_headers = null
      # Attach the Cloud Armor security policy defined below to limit access only from the specific IPs
      security_policy = google_compute_security_policy.ip-limit.self_link

      log_config = {
        enable      = true
        sample_rate = 1.0
      }

      # Attach the NEG defined above
      groups = [
        {
          group = google_compute_region_network_endpoint_group.default.id
        }
      ]

      iap_config = {
        enable               = false
        oauth2_client_id     = null
        oauth2_client_secret = null
      }
    }
  }
}

# Create a Cloud Armor security policy to limit access only from the specific IPs
# Documentation: https://cloud.google.com/armor/docs/configure-security-policies
resource "google_compute_security_policy" "ip-limit" {
  project = var.cloud_run_project
  name    = "${var.name}-ip-limit"

  rule {
    action   = "allow"
    priority = "1000"
    match {
      versioned_expr = "SRC_IPS_V1"
      config {
        src_ip_ranges = var.source_ip_range_for_security_policy
      }
    }
    description = "allow from specific IPs"
  }

  rule {
    action   = "deny(403)"
    priority = "2147483647"
    match {
      versioned_expr = "SRC_IPS_V1"
      config {
        src_ip_ranges = ["*"]
      }
    }
    description = "Deny access by default"
  }

}

# Allow the Cloud Run service to use the VPC Serverless connector
resource "google_project_iam_member" "cloudrun-use-vpc-connector" {
  project = var.cloud_run_project
  role    = "roles/vpcaccess.user"
  member  = "serviceAccount:service-${data.google_project.project.number}@gcp-sa-vpcaccess.iam.gserviceaccount.com"
}

# Give access to the VPC Serverless Connector to use the shared VPC
resource "google_project_iam_member" "connector-allow-shared-vpc-access-1" {
  project = var.shared_vpc_host_project
  role    = "roles/compute.networkUser"
  member  = "serviceAccount:service-${data.google_project.project.number}@gcp-sa-vpcaccess.iam.gserviceaccount.com"
}

resource "google_project_iam_member" "connector-allow-shared-vpc-access-2" {
  project = var.shared_vpc_host_project
  role    = "roles/compute.networkUser"
  member  = "serviceAccount:${data.google_project.project.number}@cloudservices.gserviceaccount.com"
}

# Create the VPC Serverless Connector instance
resource "google_vpc_access_connector" "connector" {
  provider = google-beta
  # Beware that the name can only be not more than 25 characters long
  name    = "${var.name}-vpc-connector"
  project = var.cloud_run_project
  region  = var.region
  subnet {
    name       = var.shared_vpc_host_connector_name
    project_id = var.shared_vpc_host_project
  }

  machine_type = "f1-micro"

  depends_on = [google_project_iam_member.connector-allow-shared-vpc-access-1, google_project_iam_member.connector-allow-shared-vpc-access-2]
}

# Create required firewall rules
# Documented in https://cloud.google.com/vpc/docs/configure-serverless-vpc-access#firewall-rules-shared-vpc
# Note: these rules target any connector, if you want to target only this specific connector,
# check the documentation at https://cloud.google.com/vpc/docs/configure-serverless-vpc-access#narrow-scope-rules ,
# the target_tags then would be [ "vpc-connector-${var.region}-${google_vpc_access_connector.connector.name}" ]
# For the source_ranges IPs used here please refer to the documentation:
# https://cloud.google.com/vpc/docs/configure-serverless-vpc-access#firewall-rules-shared-vpc

# Allow Cloud Run to access the connector instances
resource "google_compute_firewall" "serverless-to-vpc-connector" {
  project = var.shared_vpc_host_project
  name    = "${var.name}-fw-shared-vpc-serverless-to-vpc-connector"
  network = var.shared_vpc_self_link

  target_tags = ["vpc-connector"]

  allow { protocol = "icmp" }
  allow {
    protocol = "tcp"
    ports    = ["667"]
  }
  allow {
    protocol = "udp"
    ports    = ["665-666"]
  }

  direction     = "INGRESS"
  source_ranges = local.firewall_nat_ip_ranges
}

# Allow the connector instances to communicate with Cloud Run
resource "google_compute_firewall" "vpc-connector-to-serverless" {
  project = var.shared_vpc_host_project
  name    = "${var.name}-fw-shared-vpc-vpc-connector-to-serverless"
  network = var.shared_vpc_self_link

  target_tags = ["vpc-connector"]

  allow { protocol = "icmp" }
  allow {
    protocol = "tcp"
    ports    = ["667"]
  }
  allow {
    protocol = "udp"
    ports    = ["665-666"]
  }

  direction          = "EGRESS"
  destination_ranges = local.firewall_nat_ip_ranges
}

# Allow health checks
resource "google_compute_firewall" "vpc-connector-health-checks" {
  project = var.shared_vpc_host_project
  name    = "${var.name}-fw-shared-vpc-vpc-connector-health-checks"
  network = var.shared_vpc_host_name

  target_tags = ["vpc-connector"]

  allow {
    protocol = "tcp"
    ports    = ["667"]
  }

  direction     = "INGRESS"
  source_ranges = local.firewall_healthcheck_ip_ranges
}

# Restrict the traffic between the serverless VPC connector and the example server
resource "google_compute_firewall" "connector-access-to-vpc" {
  project = var.shared_vpc_host_project
  name    = "${var.name}-fw-connector-to-vpc"
  network = var.shared_vpc_self_link

  allow {
    protocol = "tcp"
    ports    = ["80", "8000", "8080"]
  }

  direction = "INGRESS"
  # See resource "google_compute_firewall" "vpc-connector-to-serverless"
  source_tags = ["vpc-connector-${var.region}-${google_vpc_access_connector.connector.name}"]

  # This selects the VM with the example server, see example_server.tf
  target_tags = ["webhook-responder"]
}