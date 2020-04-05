/**
 * Copyright 2020 Google LLC
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

# TODO: Merge this with existing `logging` component`

# CIS GCP 2.6 custom role changes
resource "google_logging_metric" "custom-role-changes-count" {
  provider = google-beta
  project  = var.project_id

  name = "custom-role-changes-cis-2-6"

  filter = "resource.type=\"iam_role\" AND protoPayload.methodName=\"google.iam.admin.v1.CreateRole\" OR protoPayload.methodName=\"google.iam.admin.v1.DeleteRole\" OR protoPayload.methodName=\"google.iam.admin.v1.UpdateRole\""

  metric_descriptor {
    metric_kind = "DELTA"
    value_type  = "INT64"
  }

  provisioner "local-exec" {
    command = "sleep 2"
  }
}

# CIS GCP 2.10 GCS IAM changes
resource "google_logging_metric" "gcs-bucket-iam-count" {
  provider = google-beta
  project  = var.project_id

  name = "gcs-bucket-iam-cis-2-10"

  filter = "resource.type=gcs_bucket AND protoPayload.methodName=\"storage.setIamPermissions\""

  metric_descriptor {
    metric_kind = "DELTA"
    value_type  = "INT64"
  }

  provisioner "local-exec" {
    command = "sleep 2"
  }
}

# CIS GCP 2.9 VPC Network changes
resource "google_logging_metric" "network-change-count" {
  provider = google-beta
  project  = var.project_id

  name = "network-change-cis-2-9"

  filter = "resource.type=gce_network AND jsonPayload.event_subtype=\"compute.networks.insert\" OR jsonPayload.event_subtype=\"compute.networks.patch\" OR jsonPayload.event_subtype=\"compute.networks.delete\" OR jsonPayload.event_subtype=\"compute.networks.removePeering\" OR jsonPayload.event_subtype=\"compute.networks.addPeering\""

  metric_descriptor {
    metric_kind = "DELTA"
    value_type  = "INT64"
  }

  provisioner "local-exec" {
    command = "sleep 2"
  }
}

# CIS GCP 2.4 project ownership changes
resource "google_logging_metric" "project-ownership-changes-count" {
  provider = google-beta
  project  = var.project_id

  name = "project-ownership-changes-cis-2-4"

  filter = "(protoPayload.serviceName=\"cloudresourcemanager.googleapis.com\") AND (ProjectOwnership OR projectOwnerInvitee) OR (protoPayload.serviceData.policyDelta.bindingDeltas.action=\"REMOVE\" AND protoPayload.serviceData.policyDelta.bindingDeltas.role=\"roles/owner\") OR (protoPayload.serviceData.policyDelta.bindingDeltas.action=\"ADD\" AND protoPayload.serviceData.policyDelta.bindingDeltas.role=\"roles/owner\")"

  metric_descriptor {
    metric_kind = "DELTA"
    value_type  = "INT64"
  }

  provisioner "local-exec" {
    command = "sleep 2"
  }
}

# CIS GCP 2.7 VPC FW Rule changes
resource "google_logging_metric" "vpc-fw-change-count" {
  provider = google-beta
  project  = var.project_id

  name = "vpc-fw-change-cis-2-7"

  filter = "resource.type=\"gce_firewall_rule\" AND jsonPayload.event_subtype=\"compute.firewalls.patch\" OR jsonPayload.event_subtype=\"compute.firewalls.insert\""

  metric_descriptor {
    metric_kind = "DELTA"
    value_type  = "INT64"
  }

  provisioner "local-exec" {
    command = "sleep 2"
  }
}

# CIS GCP 2.2 project log sink to GCS
resource "google_logging_project_sink" "in-scope-project-sink" {
  provider = google-beta
  project  = var.project_id

  name = "project-sink-cis-2-2"

  # Send to GCS
  destination = format("storage.googleapis.com/%s", google_storage_bucket.in-scope-project-log-sink.name)
  # Must be empty
  filter = ""
}

# CIS GCP 2.3
# project level sink to GCS with versioning
resource "google_storage_bucket" "in-scope-project-log-sink" {
  provider = google-beta
  project  = var.project_id

  name = format("%s-project-sink", var.project_id)

  logging {
    log_bucket = format("%s-project-sink", var.project_id)
  }

  force_destroy = var.force_destroy_logging_bucket

  versioning {
    enabled = true
  }
}
// TODO Allow configuration of this IAM control to use user-supplied IAM accounts
// instead of the system default "cloud-logs"
resource "google_storage_bucket_iam_member" "in-scope-project-log-sink-member" {
  bucket = google_storage_bucket.in-scope-project-log-sink.name
  role   = "roles/storage.objectCreator"
  member = "serviceAccount:cloud-logs@system.gserviceaccount.com"
}

# CIS GCP 2.8 VPC Route changes
resource "google_logging_metric" "vpc-route-change-count" {
  provider = google-beta
  project  = var.project_id

  name = "vpc-route-change-cis-2-8"

  filter = "resource.type=\"gce_route\" AND jsonPayload.event_subtype=\"compute.routes.delete\" OR jsonPayload.event_subtype=\"compute.routes.insert\""

  metric_descriptor {
    metric_kind = "DELTA"
    value_type  = "INT64"
  }

  provisioner "local-exec" {
    command = "sleep 2"
  }
}

# CIS GCP 2.5 audit configuration changes
resource "google_logging_metric" "audit-config-change-count" {
  provider = google-beta
  project  = var.project_id

  name = "audit-config-change-cis-2-5"

  filter = "protoPayload.methodName=\"SetIamPolicy\" AND protoPayload.serviceData.policyDelta.auditConfigDeltas:*"

  metric_descriptor {
    metric_kind = "DELTA"
    value_type  = "INT64"
  }

  provisioner "local-exec" {
    command = "sleep 2"
  }
}

# CIS GCP 2.11 CloudSQL changes
resource "google_logging_metric" "cloudsql-change-count" {
  provider = google-beta
  project  = var.project_id

  name = "cloudsql-change-cis-2-11"

  filter = "protoPayload.methodName=\"cloudsql.instances.update\""

  metric_descriptor {
    metric_kind = "DELTA"
    value_type  = "INT64"
  }

  provisioner "local-exec" {
    command = "sleep 2"
  }
}
