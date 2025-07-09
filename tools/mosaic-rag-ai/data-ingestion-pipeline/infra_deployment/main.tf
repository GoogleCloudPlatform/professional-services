provider "google" {
  project = var.gcp_project_id
  region  = var.region
}

# Enable necessary Google Cloud APIs
resource "google_project_service" "project_apis" {
  for_each = toset([
    "cloudfunctions.googleapis.com",
    "run.googleapis.com",
    "eventarc.googleapis.com",
    "iam.googleapis.com",
    "cloudbuild.googleapis.com",
    "artifactregistry.googleapis.com",
  ])
  service            = each.key
  disable_on_destroy = false
}

resource "random_id" "bucket_prefix" {
  byte_length = 8
}

resource "google_storage_bucket" "source_bucket" {
  name                        = "${random_id.bucket_prefix.hex}-mosaic-rag-source-bucket"
  location                    = "US"
  uniform_bucket_level_access = true
  force_destroy = true
}

data "archive_file" "default" {
  type        = "zip"
  output_path = "/tmp/function-source.zip"
  source_dir  = "function_source/"
}

resource "google_storage_bucket_object" "default" {
  name   = "app-${data.archive_file.default.output_sha256}.zip"
  bucket = google_storage_bucket.source_bucket.name
  source = data.archive_file.default.output_path # Path to the zipped function source code
}

resource "google_storage_bucket" "trigger_bucket" {
  name                        = "${random_id.bucket_prefix.hex}-mosaic-rag-trigger-bucket"
  location                    = "us-central1" # The trigger must be in the same location as the bucket
  uniform_bucket_level_access = true
  force_destroy = true
}

data "google_storage_project_service_account" "default" {
}

# To use GCS CloudEvent triggers, the GCS service account requires the Pub/Sub Publisher(roles/pubsub.publisher) IAM role in the specified project.
# (See https://cloud.google.com/eventarc/docs/run/quickstart-storage#before-you-begin)
data "google_project" "project" {
}

resource "google_project_iam_member" "gcs_pubsub_publishing" {
  project = data.google_project.project.project_id
  role    = "roles/pubsub.publisher"
  member  = "serviceAccount:${data.google_storage_project_service_account.default.email_address}"
}

resource "google_service_account" "account" {
  account_id   = "mosaic-rag-test-account-sa"
  display_name = "Test Service Account - used for both the cloud function and eventarc trigger in the test"
}

# Permissions on the service account used by the function and Eventarc trigger
resource "google_project_iam_member" "invoking" {
  project    = data.google_project.project.project_id
  role       = "roles/run.invoker"
  member     = "serviceAccount:${google_service_account.account.email}"
  depends_on = [google_project_iam_member.gcs_pubsub_publishing]
}

resource "google_project_iam_member" "event_receiving" {
  project    = data.google_project.project.project_id
  role       = "roles/eventarc.eventReceiver"
  member     = "serviceAccount:${google_service_account.account.email}"
  depends_on = [google_project_iam_member.invoking]
}

resource "google_project_iam_member" "artifactregistry_reader" {
  project    = data.google_project.project.project_id
  role       = "roles/artifactregistry.reader"
  member     = "serviceAccount:${google_service_account.account.email}"
  depends_on = [google_project_iam_member.event_receiving]
}

resource "google_project_iam_member" "storage_object_viewer" {
  project    = data.google_project.project.project_id
  role       = "roles/storage.objectViewer"
  member     = "serviceAccount:${google_service_account.account.email}"
  depends_on = [google_project_iam_member.artifactregistry_reader]
}

resource "google_project_iam_member" "ai_platform_user" {
  project    = data.google_project.project.project_id
  role       = "roles/aiplatform.user"
  member     = "serviceAccount:${google_service_account.account.email}"
  depends_on = [google_project_iam_member.storage_object_viewer]
}

resource "google_cloudfunctions2_function" "mosaic_rag_function_additions" {
  depends_on = [
    google_project_iam_member.event_receiving,
    google_project_iam_member.artifactregistry_reader,
  ]
  name        = "mosaic-rag-ingestion-pipeline-function-additions"
  location    = var.region
  description = "Ingestion Pipeline function which processes all the files for mosaic-rag-ingestion"

  build_config {
    runtime     = "python310"
    entry_point = "process_event" # Set the entry point in the code
    environment_variables = {
      BUILD_CONFIG_TEST = "build_test"
      GEMINI_API_KEY = var.gemini_api_key
      GEMINI_MODEL = var.gemini_model
      CORPUS_PATH = var.corpus_path
      PROJECT_ID = var.gcp_project_id
      REGION = var.region
    }
    source {
      storage_source {
        bucket = google_storage_bucket.source_bucket.name
        object = google_storage_bucket_object.default.name
      }
    }
  }

  service_config {
    max_instance_count = 6
    min_instance_count = 1
    available_memory   = "4Gi"
    available_cpu = "8"
    timeout_seconds    = 60
    max_instance_request_concurrency = 10
    environment_variables = {
      SERVICE_CONFIG_TEST = "config_test"
      GEMINI_API_KEY = var.gemini_api_key
      GEMINI_MODEL = var.gemini_model
      CORPUS_PATH = var.corpus_path
      PROJECT_ID = var.gcp_project_id
      REGION = var.region
    }
    ingress_settings               = "ALLOW_INTERNAL_ONLY"
    all_traffic_on_latest_revision = true
    service_account_email          = google_service_account.account.email
  }

  event_trigger {
    trigger_region        = var.region # The trigger must be in the same location as the bucket
    event_type            = "google.cloud.storage.object.v1.finalized"
    service_account_email = google_service_account.account.email
    event_filters {
      attribute = "bucket"
      value     = google_storage_bucket.trigger_bucket.name
    }
    retry_policy = "RETRY_POLICY_RETRY"
  }
}

resource "google_cloudfunctions2_function" "mosaic_rag_function_deletions" {
  depends_on = [
    google_project_iam_member.event_receiving,
    google_project_iam_member.artifactregistry_reader,
  ]
  name        = "mosaic-rag-ingestion-pipeline-function-deletions"
  location    = var.region
  description = "Ingestion Pipeline function which processes all the files for mosaic-rag-ingestion"

  build_config {
    runtime     = "python310"
    entry_point = "process_event" # Set the entry point in the code
    environment_variables = {
      BUILD_CONFIG_TEST = "build_test"
      GEMINI_API_KEY = var.gemini_api_key
      GEMINI_MODEL = var.gemini_model
      CORPUS_PATH = var.corpus_path
      PROJECT_ID = var.gcp_project_id
      REGION = var.region
    }
    source {
      storage_source {
        bucket = google_storage_bucket.source_bucket.name
        object = google_storage_bucket_object.default.name
      }
    }
  }

  service_config {
    max_instance_count = 6
    min_instance_count = 1
    available_memory   = "4Gi"
    available_cpu = "8"
    timeout_seconds    = 60
    max_instance_request_concurrency = 10
    environment_variables = {
      SERVICE_CONFIG_TEST = "config_test"
      GEMINI_API_KEY = var.gemini_api_key
      GEMINI_MODEL = var.gemini_model
      CORPUS_PATH = var.corpus_path
      PROJECT_ID = var.gcp_project_id
      REGION = var.region
    }
    ingress_settings               = "ALLOW_INTERNAL_ONLY"
    all_traffic_on_latest_revision = true
    service_account_email          = google_service_account.account.email
  }

  event_trigger {
    trigger_region        = var.region # The trigger must be in the same location as the bucket
    event_type            = "google.cloud.storage.object.v1.deleted"
    service_account_email = google_service_account.account.email
    event_filters {
      attribute = "bucket"
      value     = google_storage_bucket.trigger_bucket.name
    }
    retry_policy = "RETRY_POLICY_RETRY"
  }
}

output "trigger_bucket_name" {
  value = google_storage_bucket.trigger_bucket.url
}
