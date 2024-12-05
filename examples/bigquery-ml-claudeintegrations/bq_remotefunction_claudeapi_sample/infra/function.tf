/**
 * Copyright 2024 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

resource "google_cloudfunctions2_function" "function" {
  name        = "bqclaude-remotefunction"
  location    = var.region
  description = "Claude API interaction function which will be called from a BQ routine."
  project     = var.project

  build_config {
    runtime     = "java21"
    entry_point = "io.micronaut.gcp.function.http.HttpFunction"
    environment_variables = {
      # Causes a re-deploy of the function when the source changes
      "SOURCE_SHA" = data.archive_file.function_zip.output_sha
    }
    source {
      storage_source {
        bucket = google_storage_bucket.cf_bucket.name
        object = google_storage_bucket_object.cf_code.name
      }
    }
  }

  service_config {
    min_instance_count               = 1
    max_instance_count               = 1
    max_instance_request_concurrency = 3
    available_memory                 = "2G"
    available_cpu                    = 2
    timeout_seconds                  = 600
    service_account_email            = google_service_account.bqclaude_sa.email

    secret_environment_variables {
      key        = "CLAUDE_TOKENS"
      project_id = var.project
      secret     = google_secret_manager_secret.claude_tokens.secret_id
      version    = "latest"
    }
  }

  depends_on = [google_project_iam_member.bqclaude_sa_secrets]
}
