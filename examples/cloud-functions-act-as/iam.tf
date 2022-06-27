/**
 * Copyright 2022 Google LLC
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

 /*
  * Cloud Function Service Account IAM Permissions:
  *   - roles/secretmanager.secretVersionManager 
  *        to create the GSM secret for access token for the "Invocation with central secret" case.
  *   - roles/secretmanager.secretAccessor 
  *        to read the access token from GSM secret
  * 
  *  Please note that no other permissions are granted to the Cloud Function Service Account
  *  In particular the Cloud Function Service Account does NOT have permissions to list GCE VM instances.
  */

resource "google_secret_manager_secret_iam_member" "cf-sv-manager" {
  project = google_secret_manager_secret.access-token-secret.project
  secret_id = google_secret_manager_secret.access-token-secret.secret_id
  role = "roles/secretmanager.secretVersionManager"
  member = "serviceAccount:${google_service_account.cf-sample-account.email}"
}

resource "google_secret_manager_secret_iam_member" "cf-sv-accessor" {
  project = google_secret_manager_secret.access-token-secret.project
  secret_id = google_secret_manager_secret.access-token-secret.secret_id
  role = "roles/secretmanager.secretAccessor"
  member = "serviceAccount:${google_service_account.cf-sample-account.email}"
}

 /*
  * Workload Identity Service Account IAM Permissions:
  *   - roles/secretmanager.secretVersionManager 
  *        to create the GSM secret for access token for the "Invocation with application owned secret" case
  *        to store the access token in the GSM secret in the "Invocation with application owned secret" case
  *   - roles/iam.workloadIdentityUser
  *        maps the external GitHub Workload Identity to the Workload Identity Service Account
  *   - roles/cloudfunctions.developer
  *        `cloudfunctions.functions.call` permission to invoke the sample Cloud Function
  *   - roles/viewer
  *        sample IAM permissions to list GCE VM instances granted to the Workload Identity Service Account
  *        but not to the Cloud Function Service Account
  *      
  *  Please note that the Workload Identity Service Account does have permissions to list GCE VM instances.
  *  This is this account permissions allow sample Cloud Function to access the list of GCE VM instances.
  */

resource "google_secret_manager_secret_iam_member" "wi-sv-manager" {
  project = google_secret_manager_secret.access-token-secret.project
  secret_id = google_secret_manager_secret.access-token-secret.secret_id
  role = "roles/secretmanager.secretVersionManager"
  member = "serviceAccount:${google_service_account.wi-sample-account.email}"
}

resource "google_service_account_iam_member" "wi-sa-mapping" {
  service_account_id = google_service_account.wi-sample-account.name
  role               = "roles/iam.workloadIdentityUser"
  member             = "principal://iam.googleapis.com/projects/${var.project_number}/locations/global/workloadIdentityPools/${google_iam_workload_identity_pool.wi-pool.workload_identity_pool_id}/subject/repo:${var.github_repo}:ref:${var.github_ref}"
}

resource "google_cloudfunctions_function_iam_member" "wi-cf-caller" {
  project = google_cloudfunctions_function.function.project
  region = google_cloudfunctions_function.function.region
  cloud_function = google_cloudfunctions_function.function.name
  # We actually only need permissions/cloudfunctions.functions.call out of the following role
  role = "roles/cloudfunctions.developer"
  member = "serviceAccount:${google_service_account.wi-sample-account.email}"
}

resource "google_project_iam_member" "wi-gce-viewer" {
  project = var.project_id
  role    = "roles/viewer"
  member  = "serviceAccount:${google_service_account.wi-sample-account.email}"
}