# Copyright 2026 Google LLC
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#     https://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

data "google_project" "current" {
  project_id = var.project_id
}

# 1. BigQuery Dataset & Partitioned/Clustered Table
resource "google_bigquery_dataset" "cloud_logging" {
  project       = var.project_id
  dataset_id    = var.dataset_id
  location      = var.region
  friendly_name = "Cloud Logging Analytics Dataset"
  description   = "Cost-optimized dataset for high-scale Cloud Logging analytics streamed via Pub/Sub inline SMT."
}

resource "google_bigquery_table" "unified_cloud_logs" {
  project             = var.project_id
  dataset_id          = google_bigquery_dataset.cloud_logging.dataset_id
  table_id            = var.table_id
  deletion_protection = false
  description         = "Unified Cloud Logging table partitioned daily by timestamp and clustered by logName and severity."

  time_partitioning {
    type  = "DAY"
    field = "timestamp"
  }

  clustering = ["logName", "severity"]

  schema = file("${path.module}/schema.json")
}

# 2. Pub/Sub Ingestion Topic, Dead-Letter Topic & DLQ Pull Subscription
resource "google_pubsub_topic" "ingestion" {
  project = var.project_id
  name    = "cloud-logs-ingestion-topic"
}

resource "google_pubsub_topic" "dlq" {
  project = var.project_id
  name    = "cloud-logs-dlq-topic"
}

resource "google_pubsub_subscription" "dlq_sub" {
  project = var.project_id
  name    = "cloud-logs-dlq-sub"
  topic   = google_pubsub_topic.dlq.id

  message_retention_duration = "604800s"
  retain_acked_messages      = false
  ack_deadline_seconds       = 60
}

# 3. Least-Privilege IAM Bindings for Pub/Sub Service Agent & Log Router Sink
locals {
  pubsub_service_agent = "serviceAccount:service-${data.google_project.current.number}@gcp-sa-pubsub.iam.gserviceaccount.com"
}

resource "google_bigquery_dataset_iam_member" "pubsub_bq_editor" {
  project    = var.project_id
  dataset_id = google_bigquery_dataset.cloud_logging.dataset_id
  role       = "roles/bigquery.dataEditor"
  member     = local.pubsub_service_agent
}

resource "google_pubsub_topic_iam_member" "pubsub_dlq_publisher" {
  project = var.project_id
  topic   = google_pubsub_topic.dlq.name
  role    = "roles/pubsub.publisher"
  member  = local.pubsub_service_agent
}

# 4. Pub/Sub BigQuery Subscription with Inline JavaScript SMT
resource "google_pubsub_subscription" "bq_sub" {
  project = var.project_id
  name    = "cloud-logs-bq-sub"
  topic   = google_pubsub_topic.ingestion.id

  bigquery_config {
    table               = "${var.project_id}.${google_bigquery_dataset.cloud_logging.dataset_id}.${google_bigquery_table.unified_cloud_logs.table_id}"
    use_table_schema    = true
    write_metadata      = true
    drop_unknown_fields = false
  }

  dead_letter_policy {
    dead_letter_topic     = google_pubsub_topic.dlq.id
    max_delivery_attempts = 5
  }

  message_transforms {
    javascript_udf {
      function_name = "processCloudLogs"
      code          = file("${path.module}/../udf/process_cloud_logs.js")
    }
  }

  depends_on = [
    google_bigquery_dataset_iam_member.pubsub_bq_editor,
    google_pubsub_topic_iam_member.pubsub_dlq_publisher
  ]
}

resource "google_pubsub_subscription_iam_member" "pubsub_bq_subscriber" {
  project      = var.project_id
  subscription = google_pubsub_subscription.bq_sub.name
  role         = "roles/pubsub.subscriber"
  member       = local.pubsub_service_agent
}

# 5. Cloud Logging Project Sink & Optional _Default Exclusion Filter
resource "google_logging_project_sink" "pubsub_sink" {
  project                = var.project_id
  name                   = "cloud-logging-pubsub-log-sink"
  destination            = "pubsub.googleapis.com/${google_pubsub_topic.ingestion.id}"
  filter                 = var.log_filter
  unique_writer_identity = true
}

resource "google_pubsub_topic_iam_member" "sink_publisher" {
  project = var.project_id
  topic   = google_pubsub_topic.ingestion.name
  role    = "roles/pubsub.publisher"
  member  = google_logging_project_sink.pubsub_sink.writer_identity
}

resource "google_logging_project_exclusion" "log_exclusion" {
  count       = var.enable_log_exclusion ? 1 : 0
  project     = var.project_id
  name        = "exclude-routed-logs-from-default"
  description = "Excludes high-volume logs routed to BigQuery from the _Default log bucket to save $0.50/GB ingestion costs."
  filter      = var.exclusion_filter
}

# 6. Cloud Monitoring Alert Policies (DLQ Undelivered Messages & High SMT Latency)
resource "google_monitoring_alert_policy" "dlq_undelivered_messages_alert" {
  project      = var.project_id
  display_name = "Cloud Logging Pipeline - DLQ Undelivered Messages Alert"
  combiner     = "OR"

  conditions {
    display_name = "DLQ Subscription Undelivered Messages > 0"
    condition_threshold {
      filter          = "metric.type=\"pubsub.googleapis.com/subscription/num_undelivered_messages\" AND resource.type=\"pubsub_subscription\" AND resource.label.\"subscription_id\"=\"${google_pubsub_subscription.dlq_sub.name}\""
      duration        = "60s"
      comparison      = "COMPARISON_GT"
      threshold_value = 0

      aggregations {
        alignment_period   = "60s"
        per_series_aligner = "ALIGN_MAX"
      }
    }
  }

  notification_channels = var.notification_channels

  documentation {
    content   = "Alert triggered when failed log entries arrive in the Dead-Letter Queue subscription (${google_pubsub_subscription.dlq_sub.name}). Inspect and replay using cli/log_pipeline_tool.py inspect-dlq and replay-dlq."
    mime_type = "text/markdown"
  }
}

resource "google_monitoring_alert_policy" "udf_high_latency_alert" {
  project      = var.project_id
  display_name = "Cloud Logging Pipeline - High SMT UDF Execution Latency (> 500ms)"
  combiner     = "OR"

  conditions {
    display_name = "Pub/Sub SMT UDF Latency > 500ms"
    condition_threshold {
      filter          = "metric.type=\"pubsub.googleapis.com/subscription/message_transform_latencies\" AND resource.type=\"pubsub_subscription\" AND resource.label.\"subscription_id\"=\"${google_pubsub_subscription.bq_sub.name}\""
      duration        = "120s"
      comparison      = "COMPARISON_GT"
      threshold_value = 500

      aggregations {
        alignment_period   = "60s"
        per_series_aligner = "ALIGN_PERCENTILE_99"
      }
    }
  }

  notification_channels = var.notification_channels

  documentation {
    content   = "Alert triggered when 99th percentile execution latency of the inline JavaScript UDF (processCloudLogs) on subscription ${google_pubsub_subscription.bq_sub.name} exceeds 500ms."
    mime_type = "text/markdown"
  }
}
