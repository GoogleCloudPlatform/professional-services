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
  prefix = (
    var.prefix == null || var.prefix == "" # keep "" for backward compatibility
    ? ""
    : "${var.prefix}-"
  )
  notification = try(var.notification_config.enabled, false)
}

resource "google_storage_bucket" "bucket" {
  name                        = "${local.prefix}${lower(var.name)}"
  project                     = var.project_id
  location                    = var.location
  storage_class               = var.storage_class
  force_destroy               = var.force_destroy
  uniform_bucket_level_access = var.uniform_bucket_level_access
  labels                      = var.labels
  versioning {
    enabled = var.versioning
  }

  dynamic "website" {
    for_each = var.website == null ? [] : [""]

    content {
      main_page_suffix = var.website.main_page_suffix
      not_found_page   = var.website.not_found_page
    }
  }

  dynamic "encryption" {
    for_each = var.encryption_key == null ? [] : [""]

    content {
      default_kms_key_name = var.encryption_key
    }
  }

  dynamic "retention_policy" {
    for_each = var.retention_policy == null ? [] : [""]
    content {
      retention_period = var.retention_policy.retention_period
      is_locked        = var.retention_policy.is_locked
    }
  }

  dynamic "logging" {
    for_each = var.logging_config == null ? [] : [""]
    content {
      log_bucket        = var.logging_config.log_bucket
      log_object_prefix = var.logging_config.log_object_prefix
    }
  }

  dynamic "cors" {
    for_each = var.cors == null ? [] : [""]
    content {
      origin          = var.cors.origin
      method          = var.cors.method
      response_header = var.cors.response_header
      max_age_seconds = max(3600, var.cors.max_age_seconds)
    }
  }

  dynamic "lifecycle_rule" {
    for_each = var.lifecycle_rule == null ? [] : [""]
    content {
      action {
        type          = var.lifecycle_rule.action["type"]
        storage_class = var.lifecycle_rule.action["storage_class"]
      }
      condition {
        age                        = var.lifecycle_rule.condition["age"]
        created_before             = var.lifecycle_rule.condition["created_before"]
        with_state                 = var.lifecycle_rule.condition["with_state"]
        matches_storage_class      = var.lifecycle_rule.condition["matches_storage_class"]
        num_newer_versions         = var.lifecycle_rule.condition["num_newer_versions"]
        custom_time_before         = var.lifecycle_rule.condition["custom_time_before"]
        days_since_custom_time     = var.lifecycle_rule.condition["days_since_custom_time"]
        days_since_noncurrent_time = var.lifecycle_rule.condition["days_since_noncurrent_time"]
        noncurrent_time_before     = var.lifecycle_rule.condition["noncurrent_time_before"]
      }
    }
  }
}

resource "google_storage_bucket_iam_binding" "bindings" {
  for_each = var.iam
  bucket   = google_storage_bucket.bucket.name
  role     = each.key
  members  = each.value
}

resource "google_storage_notification" "notification" {
  count             = local.notification ? 1 : 0
  bucket            = google_storage_bucket.bucket.name
  payload_format    = var.notification_config.payload_format
  topic             = google_pubsub_topic.topic[0].id
  event_types       = var.notification_config.event_types
  custom_attributes = var.notification_config.custom_attributes

  depends_on = [google_pubsub_topic_iam_binding.binding]

}
resource "google_pubsub_topic_iam_binding" "binding" {
  count   = local.notification ? 1 : 0
  topic   = google_pubsub_topic.topic[0].id
  role    = "roles/pubsub.publisher"
  members = ["serviceAccount:${var.notification_config.sa_email}"]
}
resource "google_pubsub_topic" "topic" {
  count   = local.notification ? 1 : 0
  project = var.project_id
  name    = var.notification_config.topic_name
}
