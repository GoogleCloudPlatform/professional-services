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

locals {
  kms_keys = {
    for k, v in var.kms_keys : k => {
      iam    = coalesce(v.iam, {})
      labels = coalesce(v.labels, {})
      locations = (
        v.locations == null
        ? var.kms_defaults.locations
        : v.locations
      )
      rotation_period = (
        v.rotation_period == null
        ? var.kms_defaults.rotation_period
        : v.rotation_period
      )
    }
  }
  kms_locations = distinct(flatten([
    for k, v in local.kms_keys : v.locations
  ]))
  kms_locations_keys = {
    for loc in local.kms_locations : loc => {
      for k, v in local.kms_keys : k => v if contains(v.locations, loc)
    }
  }
  project_services = [
    "cloudkms.googleapis.com",
    "secretmanager.googleapis.com",
    "stackdriver.googleapis.com"
  ]
}
