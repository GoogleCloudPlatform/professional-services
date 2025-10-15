# Copyright 2025 Google LLC
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

# --- Shared Platform Resources ---

resource "google_storage_bucket" "genmedia" {
  name                        = "${var.gcp_project_id}-cs-${var.environment}-bucket"
  location                    = var.gcp_region
  uniform_bucket_level_access = true
}

resource "google_service_account" "bucket_reader_sa" {
  account_id   = "cs-${var.environment}-read"
  display_name = "SA for reading GenMedia (${var.environment}) bucket"
}

resource "google_storage_bucket_iam_member" "bucket_viewer_binding" {
  bucket = google_storage_bucket.genmedia.name
  role   = "roles/storage.objectViewer"
  member = "serviceAccount:${google_service_account.bucket_reader_sa.email}"
}

data "google_project" "project" {
  project_id = var.gcp_project_id
}

# --- Predictable URLs & Environment Variables ---
locals {
  region_code  = join("", [for s in split("-", var.gcp_region) : substr(s, 0, 1)])
  backend_url = "https://${var.backend_service_name}-${data.google_project.project.number}.${var.gcp_region}.run.app"

  frontend_url = "https://${var.gcp_project_id}.web.app" # Predictable Firebase URL

  backend_env_vars = merge(
    lookup(var.be_env_vars, "common", {}),
    lookup(var.be_env_vars, var.environment, {}),
    {
      "CORS_ORIGINS"     = "[\"${local.frontend_url}\"]"
      "GENMEDIA_BUCKET"  = google_storage_bucket.genmedia.name
      "SIGNING_SA_EMAIL" = google_service_account.bucket_reader_sa.email
    }
  )
}

resource "google_firestore_database" "default" {
  project       = var.gcp_project_id
  name          = "${var.firebase_db_name}-${var.environment}"
  location_id   = var.gcp_region

  # IMPORTANT: This choice is permanent for the project.
  # Choose FIRESTORE_NATIVE for modern applications.
  type          = "FIRESTORE_NATIVE"
}

# --- Firestore Indexes ---

# Index for: media_library by user_email, created_at
resource "google_firestore_index" "media_library_user_email" {
  project    = var.gcp_project_id
  database   = google_firestore_database.default.name
  collection = "media_library"

  fields {
    field_path = "user_email"
    order      = "ASCENDING"
  }
  fields {
    field_path = "created_at"
    order      = "DESCENDING"
  }
}

# Index for: media_library by mime_type, created_at
resource "google_firestore_index" "media_library_mime_type" {
  project    = var.gcp_project_id
  database   = google_firestore_database.default.name
  collection = "media_library"

  fields {
    field_path = "mime_type"
    order      = "ASCENDING"
  }
  fields {
    field_path = "created_at"
    order      = "DESCENDING"
  }
}

# Index for: media_library by model, created_at
resource "google_firestore_index" "media_library_model" {
  project    = var.gcp_project_id
  database   = google_firestore_database.default.name
  collection = "media_library"

  fields {
    field_path = "model"
    order      = "ASCENDING"
  }
  fields {
    field_path = "created_at"
    order      = "DESCENDING"
  }
}

# Index for: media_library by status, created_at
resource "google_firestore_index" "media_library_status" {
  project    = var.gcp_project_id
  database   = google_firestore_database.default.name
  collection = "media_library"

  fields {
    field_path = "status"
    order      = "ASCENDING"
  }
  fields {
    field_path = "created_at"
    order      = "DESCENDING"
  }
}

# Index for: media_library by workspace_id, user_email, created_at
resource "google_firestore_index" "media_library_workspace_email_created" {
  project    = var.gcp_project_id
  database   = google_firestore_database.default.name
  collection = "media_library"

  fields {
    field_path = "workspace_id"
    order      = "ASCENDING"
  }
  fields {
    field_path = "user_email"
    order      = "ASCENDING"
  }
  fields {
    field_path = "created_at"
    order      = "DESCENDING"
  }
}

# Index for: media_library by workspace_id, mime_type, created_at
resource "google_firestore_index" "media_library_workspace_mime_created" {
  project    = var.gcp_project_id
  database   = google_firestore_database.default.name
  collection = "media_library"

  fields {
    field_path = "workspace_id"
    order      = "ASCENDING"
  }
  fields {
    field_path = "mime_type"
    order      = "ASCENDING"
  }
  fields {
    field_path = "created_at"
    order      = "DESCENDING"
  }
}

# Index for: media_library by workspace_id, model, created_at
resource "google_firestore_index" "media_library_workspace_model_created" {
  project    = var.gcp_project_id
  database   = google_firestore_database.default.name
  collection = "media_library"

  fields {
    field_path = "workspace_id"
    order      = "ASCENDING"
  }
  fields {
    field_path = "model"
    order      = "ASCENDING"
  }
  fields {
    field_path = "created_at"
    order      = "DESCENDING"
  }
}

# Index for: media_library by workspace_id, status, created_at
resource "google_firestore_index" "media_library_workspace_status_created" {
  project    = var.gcp_project_id
  database   = google_firestore_database.default.name
  collection = "media_library"

  fields {
    field_path = "workspace_id"
    order      = "ASCENDING"
  }
  fields {
    field_path = "status"
    order      = "ASCENDING"
  }
  fields {
    field_path = "created_at"
    order      = "DESCENDING"
  }
}

# Index for: media_library by workspace_id, created_at, __name__
resource "google_firestore_index" "media_library_workspace_created___name" {
  project    = var.gcp_project_id
  database   = google_firestore_database.default.name
  collection = "media_library"

  fields {
    field_path = "workspace_id"
    order      = "ASCENDING"
  }
  fields {
    field_path = "created_at"
    order      = "DESCENDING"
  }
  fields {
    field_path = "__name__"
    order      = "DESCENDING"
  }
}

# For Users

# Index for: users by role, created_at
resource "google_firestore_index" "users_role" {
  project    = var.gcp_project_id
  database   = google_firestore_database.default.name
  collection = "users"

  fields {
    field_path = "role"
    order      = "ASCENDING"
  }
  fields {
    field_path = "created_at"
    order      = "DESCENDING"
  }
}

# Index for: users by email, created_at
resource "google_firestore_index" "users_email" {
  project    = var.gcp_project_id
  database   = google_firestore_database.default.name
  collection = "users"

  fields {
    field_path = "email"
    order      = "ASCENDING"
  }
  fields {
    field_path = "created_at"
    order      = "DESCENDING"
  }
}


# --- NEW INDEXES FOR source_assets ---

# Index for: source_assets by user_id, file_hash
resource "google_firestore_index" "source_assets_user_hash" {
  project    = var.gcp_project_id
  database   = google_firestore_database.default.name
  collection = "source_assets"

  fields {
    field_path = "user_id"
    order      = "ASCENDING"
  }
  fields {
    field_path = "file_hash"
    order      = "ASCENDING"
  }
}

# Index for: source_assets by user_id, created_at
resource "google_firestore_index" "source_assets_user_created" {
  project    = var.gcp_project_id
  database   = google_firestore_database.default.name
  collection = "source_assets"

  fields {
    field_path = "user_id"
    order      = "ASCENDING"
  }
  fields {
    field_path = "created_at"
    order      = "DESCENDING"
  }
}

# Index for: source_assets by user_id, mime_type, created_at
resource "google_firestore_index" "source_assets_user_mime_created" {
  project    = var.gcp_project_id
  database   = google_firestore_database.default.name
  collection = "source_assets"

  fields {
    field_path = "user_id"
    order      = "ASCENDING"
  }
  fields {
    field_path = "mime_type"
    order      = "ASCENDING"
  }
  fields {
    field_path = "created_at"
    order      = "DESCENDING"
  }
}

# Index for: source_assets by mime_type, created_at
resource "google_firestore_index" "source_assets_mime_type" {
  project    = var.gcp_project_id
  database   = google_firestore_database.default.name
  collection = "source_assets"

  fields {
    field_path = "mime_type"
    order      = "ASCENDING"
  }
  fields {
    field_path = "created_at"
    order      = "DESCENDING"
  }
}

# Index for: source_assets by scope, asset_type
resource "google_firestore_index" "source_assets_scope_type" {
  project    = var.gcp_project_id
  database   = google_firestore_database.default.name
  collection = "source_assets"

  fields {
    field_path = "scope"
    order      = "ASCENDING"
  }
  fields {
    field_path = "asset_type"
    order      = "ASCENDING"
  }
}


# Index for: source_assets by created_at, original_filename
resource "google_firestore_index" "source_assets_created_ogfilename" {
  project    = var.gcp_project_id
  database   = google_firestore_database.default.name
  collection = "source_assets"

  fields {
    field_path = "created_at"
    order      = "DESCENDING"
  }
  fields {
    field_path = "original_filename"
    order      = "DESCENDING"
  }
}


# Index for: source_assets by user_id, scope, asset_type
resource "google_firestore_index" "source_assets_user_scope_type" {
  project    = var.gcp_project_id
  database   = google_firestore_database.default.name
  collection = "source_assets"

  fields {
    field_path = "user_id"
    order      = "ASCENDING"
  }
  fields {
    field_path = "scope"
    order      = "ASCENDING"
  }
  fields {
    field_path = "asset_type"
    order      = "ASCENDING"
  }
}

# Index for: source_assets by workspace_id, created_at, __name__
resource "google_firestore_index" "source_assets_ws_crtd_nme" {
  project    = var.gcp_project_id
  database   = google_firestore_database.default.name
  collection = "source_assets"

  fields {
    field_path = "workspace_id"
    order      = "ASCENDING"
  }
  fields {
    field_path = "created_at"
    order      = "DESCENDING"
  }
  fields {
    field_path = "__name__"
    order      = "DESCENDING"
  }
}

# Index for: source_assets by asset_type, user_id, created_at, __name__
resource "google_firestore_index" "source_assets_asset_usrid_crtd_name" {
  project    = var.gcp_project_id
  database   = google_firestore_database.default.name
  collection = "source_assets"

  fields {
    field_path = "asset_type"
    order      = "ASCENDING"
  }
  fields {
    field_path = "user_id"
    order      = "ASCENDING"
  }
  fields {
    field_path = "created_at"
    order      = "DESCENDING"
  }
  fields {
    field_path = "__name__"
    order      = "DESCENDING"
  }
}

# Index for: source_assets by workspace_id, created_at, __name__
resource "google_firestore_index" "source_assets_user_mime_name" {
  project    = var.gcp_project_id
  database   = google_firestore_database.default.name
  collection = "source_assets"

  fields {
    field_path = "user_id"
    order      = "ASCENDING"
  }
  fields {
    field_path = "mime_type"
    order      = "ASCENDING"
  }
  fields {
    field_path = "__name__"
    order      = "ASCENDING"
  }
}

# Index for: source_assets by workspace_id, created_at, __name__
resource "google_firestore_index" "source_assets_user_crtd_mime_name" {
  project    = var.gcp_project_id
  database   = google_firestore_database.default.name
  collection = "source_assets"

  fields {
    field_path = "user_id"
    order      = "ASCENDING"
  }
  fields {
    field_path = "created_at"
    order      = "DESCENDING"
  }
  fields {
    field_path = "mime_type"
    order      = "DESCENDING"
  }
  fields {
    field_path = "__name__"
    order      = "DESCENDING"
  }
}

# Index for: source_assets by scope, created_at, __name__
resource "google_firestore_index" "source_assets_scope_crtd_name" {
  project    = var.gcp_project_id
  database   = google_firestore_database.default.name
  collection = "source_assets"

  fields {
    field_path = "scope"
    order      = "ASCENDING"
  }
  fields {
    field_path = "created_at"
    order      = "DESCENDING"
  }
  fields {
    field_path = "__name__"
    order      = "DESCENDING"
  }
}

# Index for: source_assets by asset_type, created_at, __name__
resource "google_firestore_index" "source_assets_assettype_crtd_name" {
  project    = var.gcp_project_id
  database   = google_firestore_database.default.name
  collection = "source_assets"

  fields {
    field_path = "asset_type"
    order      = "ASCENDING"
  }
  fields {
    field_path = "created_at"
    order      = "DESCENDING"
  }
  fields {
    field_path = "__name__"
    order      = "DESCENDING"
  }
}

# --- END OF NEW source_assets INDEXES ---

# BRAND GUIDELINES INDEXES
# Index for: source_assets by workspace_id, created_at, __name__
resource "google_firestore_index" "brand_guidelines_wrkid_created_name" {
  project    = var.gcp_project_id
  database   = google_firestore_database.default.name
  collection = "brand_guidelines"

  fields {
    field_path = "workspace_id"
    order      = "ASCENDING"
  }
  fields {
    field_path = "created_at"
    order      = "DESCENDING"
  }
  fields {
    field_path = "__name__"
    order      = "DESCENDING"
  }
}

# --- Cloud Build Repository Connection ---
resource "google_cloudbuildv2_repository" "source_repo" {
  provider          = google-beta
  name              = var.github_repo_name
  location          = var.gcp_region
  parent_connection = "projects/${var.gcp_project_id}/locations/${var.gcp_region}/connections/${var.github_conn_name}"
  remote_uri        = "https://github.com/${var.github_repo_owner}/${var.github_repo_name}.git"
}

# --- Service Module Calls ---
module "backend_service" {
  source = "../cloud-run-service"

  gcp_project_id        = var.gcp_project_id
  gcp_region            = var.gcp_region
  environment           = var.environment
  service_name          = var.backend_service_name
  resource_prefix       = "cs-be"
  github_conn_name      = var.github_conn_name
  github_repo_owner     = var.github_repo_owner
  github_repo_name      = var.github_repo_name
  github_branch_name    = var.github_branch_name
  cloudbuild_yaml_path  = "examples/creative-studio/backend/cloudbuild.yaml"
  included_files_glob   = ["**/creative-studio/backend/**"]
  container_env_vars    = local.backend_env_vars
  runtime_secrets = var.backend_runtime_secrets
  custom_audiences      = var.backend_custom_audiences
  scaling_min_instances = 1
  source_repository_id = google_cloudbuildv2_repository.source_repo.id
  cpu = var.be_cpu
  memory = var.be_memory
  build_substitutions   = merge(var.be_build_substitutions,
    {
      _REGION = var.gcp_region
      _SERVICE_NAME = var.backend_service_name
    }
  )
}

resource "google_firebase_project" "default" {
  provider = google-beta
  project = var.gcp_project_id
}

module "frontend_service" {
  source = "../firebase-hosting-service"

  source_repository_id = google_cloudbuildv2_repository.source_repo.id
  gcp_project_id       = var.gcp_project_id
  gcp_region            = var.gcp_region
  firebase_project_id  = google_firebase_project.default.project
  service_name         = var.gcp_project_id
  environment          = var.environment
  resource_prefix      = "cs-fe"
  github_branch_name   = var.github_branch_name
  cloudbuild_yaml_path = "examples/creative-studio/frontend/cloudbuild-deploy.yaml"
  included_files_glob  = ["**/creative-studio/backend/**"]

  build_substitutions = merge(
    var.fe_build_substitutions,
    {
      # This block should ONLY contain non-secret, underscore-prefixed values
      _BACKEND_URL         = local.frontend_url # The frontend will redirect the api calls to the backend
      _FE_SERVICE_NAME     = var.frontend_service_name
      _BACKEND_SERVICE_ID  = var.backend_service_name
      _FIREBASE_PROJECT_ID = var.gcp_project_id
    }
  )
}

module "frontend_secrets" {
  source = "../secret-manager"

  gcp_project_id    = var.gcp_project_id
  secret_names      = var.frontend_secrets
  accessor_sa_email = module.frontend_service.trigger_sa_email
}

module "backend_secrets" {
  source = "../secret-manager"

  gcp_project_id    = var.gcp_project_id
  secret_names      = var.backend_secrets
  accessor_sa_email = module.backend_service.trigger_sa_email
}

# --- Cross-Module Permissions ---

# Grant the Frontend's deploy trigger (which runs `firebase deploy`)
# permission to "get" the Backend's Cloud Run service to validate the rewrite rule.
resource "google_cloud_run_v2_service_iam_member" "fe_trigger_can_view_backend" {
  provider = google-beta
  project  = var.gcp_project_id
  name     = module.backend_service.service_name
  location = module.backend_service.location
  role     = "roles/run.viewer"
  member   = "serviceAccount:${module.frontend_service.trigger_sa_email}"
}
