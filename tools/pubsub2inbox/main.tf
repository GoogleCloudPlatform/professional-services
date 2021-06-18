#   Copyright 2021 Google LLC
#
#   Licensed under the Apache License, Version 2.0 (the "License");
#   you may not use this file except in compliance with the License.
#   You may obtain a copy of the License at
#
#       http://www.apache.org/licenses/LICENSE-2.0
#
#   Unless required by applicable law or agreed to in writing, software
#   distributed under the License is distributed on an "AS IS" BASIS,
#   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
#   See the License for the specific language governing permissions and
#   limitations under the License.

terraform {
  required_version = ">= 0.13.0"

  required_providers {
    google = ">= 3.40.0"
  }
}

provider "google" {
  project = var.project_id
  region  = var.region
}

resource "google_secret_manager_secret" "config-secret" {
  secret_id = var.secret_id != "" ? var.secret_id : var.function_name

  replication {
    automatic = true
  }
}

resource "google_secret_manager_secret_version" "config-secret-version" {
  secret = google_secret_manager_secret.config-secret.id

  secret_data = file(var.config_file)
}

resource "google_service_account" "service-account" {
  account_id   = var.service_account != "" ? var.service_account : var.function_name
  display_name = format("%s Service Account", title(var.service_account))
}

resource "google_service_account_iam_member" "service-account-actas-self" {
  service_account_id = google_service_account.service-account.name
  role               = "roles/iam.serviceAccountTokenCreator"
  member             = format("serviceAccount:%s", google_service_account.service-account.email)
}

resource "google_secret_manager_secret_iam_member" "config-secret-iam" {
  secret_id = google_secret_manager_secret.config-secret.secret_id
  role      = "roles/secretmanager.secretAccessor"
  member    = format("serviceAccount:%s", google_service_account.service-account.email)
}

resource "random_id" "bucket-suffix" {
  byte_length = 8
}

resource "google_storage_bucket" "function-bucket" {
  name = format("%s-%s", var.bucket_name, random_id.bucket-suffix.hex)
}

resource "null_resource" "function-zip" {
  triggers = {
    always_run = timestamp()
  }

  provisioner "local-exec" {
    command = format("zip %s/index.zip main.py requirements.txt filters/*.py output/*.py processors/*.py", path.root)
  }
}

resource "random_string" "function-zip-name" {
  length  = 8
  special = false
  upper   = false
  keepers = {
    md5 = filemd5(format("%s/index.zip", path.root))
  }
}

resource "google_storage_bucket_object" "function-archive" {
  name   = format("index-%s.zip", random_string.function-zip-name.result)
  bucket = google_storage_bucket.function-bucket.name
  source = format("%s/index.zip", path.root)
  depends_on = [
    null_resource.function-zip
  ]
}

# If you are getting error messages relating to iam.serviceAccount.actAs, see this bug:
# https://github.com/hashicorp/terraform-provider-google/issues/5889
#
# Workaround is to use "terraform taint google_cloudfunctions_function.function"
# before plan/apply.
resource "google_cloudfunctions_function" "function" {
  name        = var.function_name
  description = "Pubsub2Inbox"
  runtime     = "python38"

  service_account_email = google_service_account.service-account.email

  available_memory_mb   = 256
  source_archive_bucket = google_storage_bucket.function-bucket.name
  source_archive_object = google_storage_bucket_object.function-archive.name
  entry_point           = "process_pubsub"

  event_trigger {
    event_type = "google.pubsub.topic.publish"
    resource   = var.pubsub_topic
    failure_policy {
      retry = true
    }
  }

  environment_variables = {
    CONFIG          = google_secret_manager_secret_version.config-secret-version.name
    LOG_LEVEL       = 10
    SERVICE_ACCOUNT = google_service_account.service-account.email
  }

  depends_on = [
    null_resource.function-zip
  ]
}
