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

resource "google_cloud_run_service" "backend_service" {
  name     = var.backend_svc_name
  location = var.backend_svc_location

  template {
    spec {
      containers {
        image = var.backend_svc_image 
        ports {
          container_port = var.backend_svc_port  
        }
        env {
          name  = "FIRESTORE_PROJECT_ID"
          value = var.db_project_id
        }
        env {
          name  = "FIRESTORE_DATABASE_ID"
          value = var.db_name
        }
        env {
          name  = "ENV"
          value = var.env
        }
        resources {
            limits = {
                cpu = "6.0"
                memory = "4Gi"
            }
        }
      }
    }
  }
}

resource "google_cloud_run_service" "frontend_service" {
  name     = var.frontend_svc_name
  location = var.frontend_svc_location
  depends_on = [ google_cloud_run_service.backend_service ]
  template {
    spec {
      containers {
        image = var.frontend_svc_image 
        ports {
          container_port = var.frontend_svc_port  
        }
        env {
          name  = "REACT_APP_BACKEND_SERVICE_URL"
          value = google_cloud_run_service.backend_service.status[0].url
        }
        env {
          name  = "REACT_APP_ENV"
          value = var.env
        }
        resources {
            limits = {
                cpu = "6.0"
                memory = "4Gi"
            }
        }
      }
    }
  }
}

data "google_iam_policy" "noauth_frontend" {
  binding {
    role = "roles/run.invoker"
    members = [
      "allUsers"
    ]
  }
}

data "google_iam_policy" "cloud_run_sa" {
  binding {
    role = "roles/run.invoker"
    members = [
     "serviceAccount:${google_service_account.frontend_service_account.email}"
    ]
  }
  binding {
    role = "roles/datastore.user"
    members = [
     "serviceAccount:${google_service_account.frontend_service_account.email}"
    ]
  }
}

resource "google_service_account" "frontend_service_account" {
  account_id   = "frontend-service-account" 
  display_name = "Risk Analysis Frontend Service Account"
}

resource "google_cloud_run_service_iam_policy" "noauth_frontend" {
  location    = google_cloud_run_service.frontend_service.location
  project     = google_cloud_run_service.frontend_service.project
  service     = google_cloud_run_service.frontend_service.name
  policy_data = data.google_iam_policy.noauth_frontend.policy_data
}

resource "google_cloud_run_service_iam_policy" "backend_sa_invocation" {
  location    = google_cloud_run_service.backend_service.location
  project     = google_cloud_run_service.backend_service.project
  service     = google_cloud_run_service.backend_service.name
  policy_data = data.google_iam_policy.cloud_run_sa.policy_data
}

resource "null_resource" "update_backend_env" {
  depends_on = [google_cloud_run_service.frontend_service] 

  provisioner "local-exec" {
    command = <<EOT
gcloud run services update ${google_cloud_run_service.backend_service.name} \
--update-env-vars FRONTEND_SERVICE_URL=${google_cloud_run_service.frontend_service.status[0].url} \
--region=${google_cloud_run_service.backend_service.location}
EOT
  }
}