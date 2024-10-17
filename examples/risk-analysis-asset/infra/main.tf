# Copyright 2020 Google LLC
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#      http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

# Configure the Google Cloud provider
terraform {
  required_providers {
    google = {
      source  = "hashicorp/google"
      version = "~> 4.0"
    }
  }
}

provider "google" {
  project = var.project_id 
  region  = var.region      
}


resource "google_project_service" "host_project_service" {
  for_each                   = toset(var.enabled_apis)
  project                    = var.project_id
  service                    = each.key
  disable_on_destroy         = false
}

# Create a Firestore database
module "firestore" {
  source = "./modules/firestore"
  db_name = var.db_name
  db_location_id = var.db_location_id
  db_project_id = var.db_project_id
  depends_on = [ google_project_service.host_project_service ]
}

# Create the frontend Cloud Run service
module "cloud_run" {
  source = "./modules/cloud_run"
  db_project_id = var.db_project_id
  db_name = var.db_name
  frontend_svc_name = var.frontend_svc_name
  frontend_svc_location = var.frontend_svc_location
  frontend_svc_image = var.frontend_svc_image
  frontend_svc_port = var.frontend_svc_port
  backend_svc_name = var.backend_svc_name
  backend_svc_location = var.backend_svc_location
  backend_svc_image = var.backend_svc_image
  backend_svc_port = var.backend_svc_port
  env=var.env
  depends_on = [ google_project_service.host_project_service ]
}