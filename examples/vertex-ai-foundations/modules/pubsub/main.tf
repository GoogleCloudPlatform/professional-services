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
  sub_iam_members = flatten([
    for sub, roles in var.subscription_iam : [
      for role, members in roles : {
        sub     = sub
        role    = role
        members = members
      }
    ]
  ])
  oidc_config = {
    for k, v in var.push_configs : k => v.oidc_token
  }
  subscriptions = {
    for k, v in var.subscriptions : k => {
      labels  = try(v.labels, v, null) == null ? var.labels : v.labels
      options = try(v.options, v, null) == null ? var.defaults : v.options
    }
  }
}

resource "google_pubsub_topic" "default" {
  project                    = var.project_id
  name                       = var.name
  kms_key_name               = var.kms_key
  labels                     = var.labels
  message_retention_duration = var.message_retention_duration

  dynamic "message_storage_policy" {
    for_each = length(var.regions) > 0 ? [var.regions] : []
    content {
      allowed_persistence_regions = var.regions
    }
  }
}

resource "google_pubsub_topic_iam_binding" "default" {
  for_each = var.iam
  project  = var.project_id
  topic    = google_pubsub_topic.default.name
  role     = each.key
  members  = each.value
}

resource "google_pubsub_subscription" "default" {
  for_each                   = local.subscriptions
  project                    = var.project_id
  name                       = each.key
  topic                      = google_pubsub_topic.default.name
  labels                     = each.value.labels
  ack_deadline_seconds       = each.value.options.ack_deadline_seconds
  message_retention_duration = each.value.options.message_retention_duration
  retain_acked_messages      = each.value.options.retain_acked_messages
  filter                     = each.value.options.filter

  dynamic "expiration_policy" {
    for_each = each.value.options.expiration_policy_ttl == null ? [] : [""]
    content {
      ttl = each.value.options.expiration_policy_ttl
    }
  }

  dynamic "dead_letter_policy" {
    for_each = try(var.dead_letter_configs[each.key], null) == null ? [] : [""]
    content {
      dead_letter_topic     = var.dead_letter_configs[each.key].topic
      max_delivery_attempts = var.dead_letter_configs[each.key].max_delivery_attempts
    }
  }

  dynamic "push_config" {
    for_each = try(var.push_configs[each.key], null) == null ? [] : [""]
    content {
      push_endpoint = var.push_configs[each.key].endpoint
      attributes    = var.push_configs[each.key].attributes
      dynamic "oidc_token" {
        for_each = (
          local.oidc_config[each.key] == null ? [] : [""]
        )
        content {
          service_account_email = local.oidc_config[each.key].service_account_email
          audience              = local.oidc_config[each.key].audience
        }
      }
    }
  }
}

resource "google_pubsub_subscription_iam_binding" "default" {
  for_each = {
    for binding in local.sub_iam_members :
    "${binding.sub}.${binding.role}" => binding
  }
  project      = var.project_id
  subscription = google_pubsub_subscription.default[each.value.sub].name
  role         = each.value.role
  members      = each.value.members
}
