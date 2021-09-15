# Copyright 2021 Google Inc. All Rights Reserved.
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#    http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.


locals {
  email_notification_files = "/../../templates/inputs/*email*notification*.yaml"
  email_channel_fileset_data = [for i in fileset(path.module, local.email_notification_files) :
    yamldecode(replace(file(i), "$EMAIL_ADDRESS", var.email_address))
  ]

  policy_files = "/../../templates/inputs/*policy*.yaml"
  policy_fileset_data = [for i in fileset(path.module, local.policy_files) :
    yamldecode(replace(file(i), "$DASHBOARD_LINK", var.dashboard_link))
  ]
}


provider "google" {
  # Since this will be executed from cloud-shell for credentials use
  # gcloud auth application-default login 

  project = var.project
}


# Notification Channels
#...............................................................................
resource "google_monitoring_notification_channel" "notification_channels" {
  count = length(local.email_channel_fileset_data)

  display_name = local.email_channel_fileset_data[count.index].displayName
  type         = local.email_channel_fileset_data[count.index].type

  labels      = local.email_channel_fileset_data[count.index].labels
  description = local.email_channel_fileset_data[count.index].description
}


# Alert Policies
#...............................................................................
resource "google_monitoring_alert_policy" "alert_policy" {
  count = length(local.policy_fileset_data)

  display_name = local.policy_fileset_data[count.index].displayName
  combiner     = local.policy_fileset_data[count.index].combiner
  dynamic "conditions" {
    for_each = local.policy_fileset_data[count.index].conditions
    content {
      display_name = conditions.value.displayName
      condition_threshold {
        filter     = conditions.value.conditionThreshold.filter
        duration   = conditions.value.conditionThreshold.duration
        comparison = conditions.value.conditionThreshold.comparison
        trigger {
          count = conditions.value.conditionThreshold.trigger.count
        }
        dynamic "aggregations" {
          for_each = conditions.value.conditionThreshold.aggregations
          content {
            alignment_period     = aggregations.value.alignmentPeriod
            per_series_aligner   = aggregations.value.perSeriesAligner
            group_by_fields      = try(aggregations.value.groupByFields, null)
            cross_series_reducer = try(aggregations.value.crossSeriesReducer, null)
          }
        }
      }
    }
  }

  documentation {
    content   = local.policy_fileset_data[count.index].documentation.content
    mime_type = local.policy_fileset_data[count.index].documentation.mimeType
  }
  notification_channels = [for res in resource.google_monitoring_notification_channel.notification_channels : res.id]
}
