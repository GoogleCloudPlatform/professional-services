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
  spend_basis = {
    current    = "CURRENT_SPEND"
    forecasted = "FORECASTED_SPEND"
  }
  threshold_pairs = flatten([
    for type, values in var.thresholds : [
      for value in values : {
        spend_basis       = local.spend_basis[type]
        threshold_percent = value
      }
    ]
  ])

  notification_channels = concat(
    [for channel in google_monitoring_notification_channel.email_channels : channel.id],
    coalesce(var.notification_channels, [])
  )
}

resource "google_monitoring_notification_channel" "email_channels" {
  for_each     = toset(try(var.email_recipients.emails, []))
  display_name = "${var.name} budget email notification (${each.value})"
  type         = "email"
  project      = var.email_recipients.project_id
  labels = {
    email_address = each.value
  }
  user_labels = {}
}


resource "google_billing_budget" "budget" {
  billing_account = var.billing_account
  display_name    = var.name

  budget_filter {
    projects               = var.projects
    credit_types_treatment = var.credit_treatment
    services               = var.services
  }

  dynamic "amount" {
    for_each = var.amount == 0 ? [1] : []
    content {
      last_period_amount = true
    }
  }

  dynamic "amount" {
    for_each = var.amount != 0 ? [1] : []
    content {
      dynamic "specified_amount" {
        for_each = var.amount != 0 ? [1] : []
        content {
          units = var.amount
        }
      }
    }
  }

  dynamic "threshold_rules" {
    for_each = local.threshold_pairs
    iterator = threshold
    content {
      threshold_percent = threshold.value.threshold_percent
      spend_basis       = threshold.value.spend_basis
    }
  }

  all_updates_rule {
    monitoring_notification_channels = local.notification_channels
    pubsub_topic                     = var.pubsub_topic
    # disable_default_iam_recipients can only be set if
    # monitoring_notification_channels is nonempty
    disable_default_iam_recipients = try(length(var.notification_channels), 0) > 0 && !var.notify_default_recipients
    schema_version                 = "1.0"
  }
}
