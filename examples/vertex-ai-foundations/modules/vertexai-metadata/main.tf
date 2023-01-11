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

resource "google_vertex_ai_metadata_store" "store" {
  name          = var.name
  description   = var.description
  region        = var.region
  project       = var.project_id
  provider      = google-beta

  dynamic "encryption_spec" {
    for_each = var.kms_key == null ? [] : [""]
    content {
      kms_key_name = var.kms_key
    }
  }
}