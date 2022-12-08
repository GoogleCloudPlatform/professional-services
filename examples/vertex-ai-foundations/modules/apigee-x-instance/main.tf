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

resource "google_apigee_instance" "apigee_instance" {
  org_id                   = var.apigee_org_id
  name                     = var.name
  location                 = var.region
  ip_range                 = var.ip_range
  disk_encryption_key_name = var.disk_encryption_key
  consumer_accept_list     = var.consumer_accept_list
}

resource "google_apigee_instance_attachment" "apigee_instance_attchment" {
  for_each    = toset(var.apigee_environments)
  instance_id = google_apigee_instance.apigee_instance.id
  environment = each.key
}
