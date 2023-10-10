# Copyright 2023 Google Inc.
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#     http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

provider "google" {
  project = var.project_id
  region  = var.region
}

resource "google_project_service" "composer_api" {
  provider = google-beta
  project = var.project_id
  service = "composer.googleapis.com"
  disable_on_destroy = false
}

resource "google_composer_environment" "latest" {
  name   = "${var.environment_name}-t"
  project = var.project_id
  region = var.region
  config {
    software_config {
      pypi_packages = var.pypi_packages
    }
    workloads_config {
      scheduler {
        cpu        = var.scheduler_cpu
        memory_gb  = var.scheduler_mem
        storage_gb = var.scheduler_storage
        count      = var.scheduler_count
      }
#      triggerer {
#        cpu       = var.trigger_cpu
#        memory_gb = var.trigger_mem
#        count     = var.trigger_count
#      }
      web_server {
        cpu        = var.web_server_cpu
        memory_gb  = var.web_server_mem
        storage_gb = var.web_server_storage
      }
      worker {
        cpu = var.worker_cpu
        memory_gb  = var.worker_mem
        storage_gb = var.worker_storage
        min_count  = var.min_workers
        max_count  = var.max_workers
      }
    }
    node_config {
      network = var.network
      service_account = var.service_account
    }
    
    environment_size = var.environment_size
  }
}
