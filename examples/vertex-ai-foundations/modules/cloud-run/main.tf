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
  _vpcaccess_annotation = (
    local.vpc_connector_create
    ? {
      "run.googleapis.com/vpc-access-connector" = google_vpc_access_connector.connector.0.id
    }
    : (
      try(var.revision_annotations.vpcaccess_connector, null) == null
      ? {}
      : {
        "run.googleapis.com/vpc-access-connector" = var.revision_annotations.vpcaccess_connector
      }
    )
  )
  annotations = merge(
    var.ingress_settings == null ? {} : {
      "run.googleapis.com/ingress" = var.ingress_settings
    }
  )
  prefix = var.prefix == null ? "" : "${var.prefix}-"
  revision_annotations = merge(
    try(var.revision_annotations.autoscaling.max_scale, null) == null ? {} : {
      "autoscaling.knative.dev/maxScale" = var.revision_annotations.autoscaling.max_scale
    },
    try(var.revision_annotations.autoscaling.min_scale, null) == null ? {} : {
      "autoscaling.knative.dev/minScale" = var.revision_annotations.autoscaling.min_scale
    },
    try(var.revision_annotations.cloudsql_instances, null) == null ? {} : {
      "run.googleapis.com/cloudsql-instances" = join(",", coalesce(
        var.revision_annotations.cloudsql_instances, []
      ))
    },
    local._vpcaccess_annotation,
    try(var.revision_annotations.vpcaccess_egress, null) == null ? {} : {
      "run.googleapis.com/vpc-access-egress" = var.revision_annotations.vpcaccess_egress
    },
  )
  revision_name = (
    try(var.revision_name, null) == null
    ? null
    : "${var.name}-${var.revision_name}"
  )
  service_account_email = (
    var.service_account_create
    ? (
      length(google_service_account.service_account) > 0
      ? google_service_account.service_account[0].email
      : null
    )
    : var.service_account
  )
  vpc_connector_create = var.vpc_connector_create != null
}

resource "google_vpc_access_connector" "connector" {
  count         = local.vpc_connector_create ? 1 : 0
  project       = var.project_id
  name          = var.vpc_connector_create.name
  region        = var.region
  ip_cidr_range = var.vpc_connector_create.ip_cidr_range
  network       = var.vpc_connector_create.vpc_self_link
}

resource "google_cloud_run_service" "service" {
  provider = google-beta
  project  = var.project_id
  location = var.region
  name     = "${local.prefix}${var.name}"

  template {
    spec {
      dynamic "containers" {
        for_each = var.containers == null ? {} : {
          for i, container in var.containers : i => container
        }
        content {
          image   = containers.value.image
          command = try(containers.value.options.command, null)
          args    = try(containers.value.options.args, null)
          dynamic "env" {
            for_each = (
              try(containers.value.options.env, null) == null
              ? {}
              : containers.value.options.env
            )
            content {
              name  = env.key
              value = env.value
            }
          }
          dynamic "env" {
            for_each = (
              try(containers.value.options.env_from, null) == null
              ? {}
              : containers.value.options.env_from
            )
            content {
              name = env.key
              value_from {
                secret_key_ref {
                  name = env.value.name
                  key  = env.value.key
                }
              }
            }
          }
          dynamic "ports" {
            for_each = (
              containers.value.ports == null
              ? {}
              : {
                for port in containers.value.ports :
                "${port.name}-${port.container_port}" => port
              }
            )
            content {
              name           = ports.value.name
              protocol       = ports.value.protocol
              container_port = ports.value.container_port
            }
          }
          dynamic "resources" {
            for_each = containers.value.resources == null ? [] : [""]
            content {
              limits   = containers.value.resources.limits
              requests = containers.value.resources.requests
            }
          }
          dynamic "volume_mounts" {
            for_each = (
              containers.value.volume_mounts == null
              ? {}
              : containers.value.volume_mounts
            )
            content {
              name       = volume_mounts.key
              mount_path = volume_mounts.value
            }
          }
        }
      }
      service_account_name = local.service_account_email
      dynamic "volumes" {
        for_each = var.volumes == null ? [] : var.volumes
        content {
          name = volumes.value.name
          secret {
            secret_name = volumes.value.secret_name
            dynamic "items" {
              for_each = (
                volumes.value.items == null ? [] : volumes.value.items
              )
              content {
                key  = items.value.key
                path = items.value.path
              }
            }
          }
        }
      }
    }
    metadata {
      name        = local.revision_name
      annotations = local.revision_annotations
    }
  }

  metadata {
    annotations = local.annotations
  }

  dynamic "traffic" {
    for_each = var.traffic == null ? {} : var.traffic
    content {
      percent       = traffic.value
      revision_name = "${var.name}-${traffic.key}"
    }
  }

}

resource "google_cloud_run_service_iam_binding" "binding" {
  for_each = var.iam
  project  = google_cloud_run_service.service.project
  location = google_cloud_run_service.service.location
  service  = google_cloud_run_service.service.name
  role     = each.key
  members  = each.value
}

resource "google_service_account" "service_account" {
  count        = var.service_account_create ? 1 : 0
  project      = var.project_id
  account_id   = "tf-cr-${var.name}"
  display_name = "Terraform Cloud Run ${var.name}."
}

resource "google_eventarc_trigger" "audit_log_triggers" {
  for_each = var.audit_log_triggers == null ? {} : {
    for trigger in var.audit_log_triggers :
    "${trigger.service_name}-${trigger.method_name}" => trigger
  }
  name     = "${local.prefix}${each.key}-audit-log-trigger"
  location = google_cloud_run_service.service.location
  project  = google_cloud_run_service.service.project
  matching_criteria {
    attribute = "type"
    value     = "google.cloud.audit.log.v1.written"
  }
  matching_criteria {
    attribute = "serviceName"
    value     = each.value.service_name
  }
  matching_criteria {
    attribute = "methodName"
    value     = each.value.method_name
  }
  destination {
    cloud_run_service {
      service = google_cloud_run_service.service.name
      region  = google_cloud_run_service.service.location
    }
  }
}

resource "google_eventarc_trigger" "pubsub_triggers" {
  for_each = var.pubsub_triggers == null ? [] : toset(var.pubsub_triggers)
  name = (
    each.value == ""
    ? "${local.prefix}default-pubsub-trigger"
    : "${local.prefix}${each.value}-pubsub-trigger"
  )
  location = google_cloud_run_service.service.location
  project  = google_cloud_run_service.service.project
  matching_criteria {
    attribute = "type"
    value     = "google.cloud.pubsub.topic.v1.messagePublished"
  }
  dynamic "transport" {
    for_each = each.value == null ? [] : [""]
    content {
      pubsub {
        topic = each.value
      }
    }
  }
  destination {
    cloud_run_service {
      service = google_cloud_run_service.service.name
      region  = google_cloud_run_service.service.location
    }
  }
}
