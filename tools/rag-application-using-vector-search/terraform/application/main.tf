terraform {
  required_providers {
    google = {
      source  = "hashicorp/google"
      version = "6.18.1"
    }
    docker = {
      source  = "kreuzwerker/docker"
      version = "3.0.2"
    }
  }
}

provider "google" {
  project = var.project_id
  region  = var.region
}

provider "docker" {
  alias = "private"
  registry_auth {
    address     = "${var.region}-docker.pkg.dev"
    config_file = pathexpand("~/.docker/config.json")
  }
}

resource "google_artifact_registry_repository" "rag_repo" {
  location      = var.region
  repository_id = "rag-repo-${var.deployment_id}"
  project       = var.project_id
  format        = "docker"
  description   = "A repository for testing docker via terraform"
  labels = {
    environment = "production"
  }
}

resource "docker_image" "backend_service_image" {
  provider = docker.private
  name     = "${google_artifact_registry_repository.rag_repo.location}-docker.pkg.dev/${var.project_id}/${google_artifact_registry_repository.rag_repo.name}/backend-image:latest"
  build {
    context = "../../backend/backend_service/"
    tag     = ["${google_artifact_registry_repository.rag_repo.location}-docker.pkg.dev/${var.project_id}/${google_artifact_registry_repository.rag_repo.name}/backend-image:latest"]
    label = {
      author : "terraform"
    }
  }
  triggers = {
    dir_sha1 = sha1(join("", [for f in fileset("../../backend/backend_service/", "**"): filesha1("../../backend/backend_service/${f}")]))
  }
}

resource "docker_registry_image" "backend" {
  provider = docker.private
  name     = docker_image.backend_service_image.name
  keep_remotely = true
}

resource "docker_image" "poller_image" {
  provider = docker.private
  name     = "${google_artifact_registry_repository.rag_repo.location}-docker.pkg.dev/${var.project_id}/${google_artifact_registry_repository.rag_repo.name}/poller:latest"
  build {
    context = "../../backend/poller_job/"
    tag     = ["${google_artifact_registry_repository.rag_repo.location}-docker.pkg.dev/${var.project_id}/${google_artifact_registry_repository.rag_repo.name}/poller:latest"]
    label = {
      author : "terraform"
    }
  }
  triggers = {
    dir_sha1 = sha1(join("", [for f in fileset("../../backend/poller_job/", "**"): filesha1("../../backend/poller_job/${f}")]))
  }
}

resource "docker_registry_image" "poller" {
  provider = docker.private
  name     = docker_image.poller_image.name
  keep_remotely = true
}

resource "docker_image" "frontend_image" {
  provider = docker.private
  name     = "${google_artifact_registry_repository.rag_repo.location}-docker.pkg.dev/${var.project_id}/${google_artifact_registry_repository.rag_repo.name}/frontend-image:latest"
  build {
    context = "../../frontend/"
    tag     = ["${google_artifact_registry_repository.rag_repo.location}-docker.pkg.dev/${var.project_id}/${google_artifact_registry_repository.rag_repo.name}/frontend-image:latest"]
    label = {
      author : "terraform"
    }
  }
  triggers = {
    dir_sha1 = sha1(join("", [for f in fileset("../../frontend/", "**"): filesha1("../../frontend/${f}")]))
  }
}

resource "docker_registry_image" "frontend" {
  provider = docker.private
  name     = docker_image.frontend_image.name
  keep_remotely = true
}

resource "google_firestore_database" "lro_status_database" {
  project                 = var.project_id
  location_id             = var.region
  name                    = "rag-lro-status-${var.deployment_id}"
  type                    = "FIRESTORE_NATIVE"
  deletion_policy         = "DELETE"
  delete_protection_state = "DELETE_PROTECTION_DISABLED"
}

resource "google_service_account" "backend_service_sa" {
  account_id   = "backend-${var.deployment_id}"
  display_name = "Backend Cloud Run Service Account"
}

resource "google_service_account" "frontend_service_sa" {
  account_id   = "frontend-${var.deployment_id}"
  display_name = "Frontend Cloud Run Service Account"
}


resource "google_service_account" "poller_sa" {
  account_id   = "poller-${var.deployment_id}"
  display_name = "Poller Cloud Run Job Service Account"
}

resource "google_service_account" "scheduler_sa" {
  account_id   = "scheduler-${var.deployment_id}"
  display_name = "Scheduler Service Account"
}

resource "google_project_iam_binding" "aiplatform_user_binding" {
  project = var.project_id
  role    = "roles/aiplatform.user"
  members = [
    "serviceAccount:${google_service_account.backend_service_sa.email}",
    "serviceAccount:${google_service_account.poller_sa.email}",
  ]
  depends_on = [google_service_account.backend_service_sa]
}

resource "google_project_iam_binding" "datastore_user_binding" {
  project = var.project_id
  role    = "roles/datastore.user"
  members = [
    "serviceAccount:${google_service_account.backend_service_sa.email}",
    "serviceAccount:${google_service_account.poller_sa.email}",
  ]
  depends_on = [google_service_account.backend_service_sa]
}

resource "google_project_iam_binding" "discoveryengine_viewer_binding" {
  project = var.project_id
  role    = "roles/discoveryengine.viewer"
  members = [
    "serviceAccount:${google_service_account.backend_service_sa.email}",
  ]
  depends_on = [google_service_account.backend_service_sa]
}

resource "google_project_iam_binding" "storage_object_viewer_binding" {
  project = var.project_id
  role    = "roles/storage.objectViewer"
  members = [
    "serviceAccount:${var.rag_engine_service_account}",
  ]
}

resource "google_storage_bucket" "rag_import_result_sink" {
  name          = "import-result-${var.project_id}-${var.deployment_id}"
  location      = var.region
  project       = var.project_id
  force_destroy = true
}

resource "google_storage_bucket_iam_binding" "storage_object_user_binding" {
  bucket = google_storage_bucket.rag_import_result_sink.name
  role   = "roles/storage.objectUser"
  members = [
    "serviceAccount:${var.rag_engine_service_account}",
  ]
}

resource "google_cloud_run_v2_service" "backend_service" {
  name     = "backend-service-${var.deployment_id}"
  location = var.region

  deletion_protection = false

  template {
    containers {
      image = docker_registry_image.backend.name
      env {
        name  = "PROJECT_ID"
        value = var.project_id
      }
      env {
        name  = "REGION"
        value = var.region
      }
      env {
        name  = "CORPUS_NAME"
        value = var.corpus_name
      }
      env {
        name  = "DATABASE_NAME"
        value = google_firestore_database.lro_status_database.name
      }
      env {
        name  = "GCS_IMPORT_RESULT_BUCKET"
        value = google_storage_bucket.rag_import_result_sink.url
      }
    }
    service_account = google_service_account.backend_service_sa.email
  }
  depends_on = [google_project_iam_binding.datastore_user_binding, google_project_iam_binding.aiplatform_user_binding, google_firestore_database.lro_status_database]
}


resource "google_cloud_run_v2_job" "poller_job" {
  name     = "poller-job-${var.deployment_id}"
  location = var.region

  deletion_protection = false

  template {
    template {
      timeout = "1800s"
      containers {
        image = docker_registry_image.poller.name
        env {
          name  = "PROJECT_ID"
          value = var.project_id
        }
        env {
          name  = "REGION"
          value = var.region
        }
        env {
          name  = "DATABASE_NAME"
          value = google_firestore_database.lro_status_database.name
        }
      }
      service_account = google_service_account.poller_sa.email
    }
  }
  depends_on = [google_project_iam_binding.datastore_user_binding, google_project_iam_binding.aiplatform_user_binding, google_firestore_database.lro_status_database]
}

resource "google_cloud_run_v2_job_iam_binding" "run_invoker_binding_poller" {
  project  = google_cloud_run_v2_job.poller_job.project
  location = google_cloud_run_v2_job.poller_job.location
  name     = google_cloud_run_v2_job.poller_job.name
  role     = "roles/run.invoker"
  members = [
    "serviceAccount:${google_service_account.scheduler_sa.email}",
  ]
}

resource "google_cloud_scheduler_job" "job" {
  name             = "scheduler-poller-${var.deployment_id}"
  schedule         = "*/30 * * * *"
  attempt_deadline = "1800s"
  region           = var.region
  project          = var.project_id

  http_target {
    http_method = "POST"
    uri         = "https://${google_cloud_run_v2_job.poller_job.location}-run.googleapis.com/apis/run.googleapis.com/v1/namespaces/${var.project_number}/jobs/${google_cloud_run_v2_job.poller_job.name}:run"

    oauth_token {
      service_account_email = google_service_account.scheduler_sa.email
    }
  }

  depends_on = [resource.google_cloud_run_v2_job_iam_binding.run_invoker_binding_poller]
}

resource "google_cloud_run_v2_service" "frontend_service" {
  name     = "frontend-service-${var.deployment_id}"
  location = var.region

  deletion_protection = false

  template {
    scaling {
      min_instance_count = 0
      max_instance_count = 5
    }
    containers {
      image = docker_registry_image.frontend.name
      env {
        name  = "BACKEND_SERVICE_URI"
        value = google_cloud_run_v2_service.backend_service.uri
      }
    }
    service_account = google_service_account.frontend_service_sa.email
  }
  # # Optional: Add labels for better tracking
  #   labels = {
  #     "deployment-time" = formatdate("YYYYMMDDhhmmss", timestamp())
  #   }
  depends_on = [google_project_iam_binding.datastore_user_binding, google_project_iam_binding.aiplatform_user_binding, google_firestore_database.lro_status_database]
}

resource "google_cloud_run_v2_service_iam_member" "public_access" {
  project  = google_cloud_run_v2_service.frontend_service.project
  location = google_cloud_run_v2_service.frontend_service.location
  name     = google_cloud_run_v2_service.frontend_service.name
  role     = "roles/run.invoker"
  member   = "allUsers"
}

resource "google_cloud_run_v2_service_iam_binding" "frontend_invokes_backend" {
  project  = google_cloud_run_v2_service.backend_service.project
  location = google_cloud_run_v2_service.backend_service.location
  name     = google_cloud_run_v2_service.backend_service.name
  role     = "roles/run.invoker"
  members   = ["serviceAccount:${google_service_account.frontend_service_sa.email}"]
}