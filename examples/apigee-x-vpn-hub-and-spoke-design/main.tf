terraform {
  required_version = ">= 0.13"
  required_providers {
    google = {
      source  = "hashicorp/google"
      version = "3.87.0"
    }
  }
}

# provider "google" {
#   # Configuration options
# }

# resource "google_project" "project" {
#   name       = "My First Project"
#   project_id = "instant-form-328123"
#   org_id     = "174736863632"
# }

# resource "google_project_iam_binding" "project" {
#   project = "instant-form-328123"
#   role    = "roles/resourcemanager.projectCreator"

#   members = [
#     "serviceAccount:266708478495-compute@developer.gserviceaccount.com",
#     "serviceAccount:apigee-sandbox@instant-form-328123.iam.gserviceaccount.com",
#   ]
# }


# resource "google_project_iam_policy" "project" {
#   project     = "instant-form-328123"
#   policy_data = data.google_iam_policy.admin.policy_data
# }

# data "google_iam_policy" "admin" {
#   binding {
#     role = "roles/resourcemanager.projectCreator"

#     members = [
#       "user:judy@hudywu.com",
#     ]
#   }
# }
# resource "google_project_service" "resource_manager" {
#   service = "cloudresourcemanager.googleapis.com"
#   project = "instant-form-328123"

#   timeouts {
#     create = "30m"
#     update = "40m"
#   }

#   disable_dependent_services = true
# }


resource "google_project_service" "apigee" {
  service = "apigee.googleapis.com"
  project = "instant-form-328123"

  timeouts {
    create = "30m"
    update = "40m"
  }

  disable_dependent_services = true
}


# resource "google_compute_instance" "vm_instance" {
#   name         = "terraform-instance"
#   machine_type = "f1-micro"

#   boot_disk {
#     initialize_params {
#       image = "debian-cloud/debian-9"
#     }
#   }

#   network_interface {
#     # A default network is created for all GCP projects
#     network = google_compute_network.vpc_network.self_link
#     access_config {
#     }
#   }
# }

# resource "google_compute_network" "vpc_network" {
#   name                    = "terraform-network"
#   auto_create_subnetworks = "true"
# }