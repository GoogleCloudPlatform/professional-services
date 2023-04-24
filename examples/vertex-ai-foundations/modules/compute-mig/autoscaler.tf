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

# tfdoc:file:description Autoscaler resource.

locals {
  as_enabled = true
  as_scaling = try(var.autoscaler_config.scaling_control, null)
  as_signals = try(var.autoscaler_config.scaling_signals, null)
}

resource "google_compute_autoscaler" "default" {
  provider    = google-beta
  count       = local.is_regional || var.autoscaler_config == null ? 0 : 1
  project     = var.project_id
  name        = var.name
  zone        = var.location
  description = var.description
  target      = google_compute_instance_group_manager.default.0.id

  autoscaling_policy {
    max_replicas    = var.autoscaler_config.max_replicas
    min_replicas    = var.autoscaler_config.min_replicas
    cooldown_period = var.autoscaler_config.cooldown_period

    dynamic "scale_down_control" {
      for_each = local.as_scaling.down == null ? [] : [""]
      content {
        time_window_sec = local.as_scaling.down.time_window_sec
        dynamic "max_scaled_down_replicas" {
          for_each = (
            local.as_scaling.down.max_replicas_fixed == null &&
            local.as_scaling.down.max_replicas_percent == null
            ? []
            : [""]
          )
          content {
            fixed   = local.as_scaling.down.max_replicas_fixed
            percent = local.as_scaling.down.max_replicas_percent
          }
        }
      }
    }

    dynamic "scale_in_control" {
      for_each = local.as_scaling.in == null ? [] : [""]
      content {
        time_window_sec = local.as_scaling.in.time_window_sec
        dynamic "max_scaled_in_replicas" {
          for_each = (
            local.as_scaling.in.max_replicas_fixed == null &&
            local.as_scaling.in.max_replicas_percent == null
            ? []
            : [""]
          )
          content {
            fixed   = local.as_scaling.in.max_replicas_fixed
            percent = local.as_scaling.in.max_replicas_percent
          }
        }
      }
    }

    dynamic "cpu_utilization" {
      for_each = local.as_signals.cpu_utilization == null ? [] : [""]
      content {
        target = local.as_signals.cpu_utilization.target
        predictive_method = (
          local.as_signals.cpu_utilization.optimize_availability == true
          ? "OPTIMIZE_AVAILABILITY"
          : null
        )
      }
    }

    dynamic "load_balancing_utilization" {
      for_each = local.as_signals.load_balancing_utilization == null ? [] : [""]
      content {
        target = local.as_signals.load_balancing_utilization.target
      }
    }

    dynamic "metric" {
      for_each = toset(
        local.as_signals.metrics == null ? [] : local.as_signals.metrics
      )
      content {
        name                       = metric.value.name
        type                       = metric.value.type
        target                     = metric.value.target_value
        single_instance_assignment = metric.value.single_instance_assignment
        filter                     = metric.value.time_series_filter
      }
    }

    dynamic "scaling_schedules" {
      for_each = toset(
        local.as_signals.schedules == null ? [] : local.as_signals.schedules
      )
      iterator = schedule
      content {
        duration_sec          = schedule.value.duration_sec
        min_required_replicas = schedule.value.min_required_replicas
        name                  = schedule.value.name
        schedule              = schedule.value.cron_schedule
        description           = schedule.value.description
        disabled              = schedule.value.disabled
        time_zone             = schedule.value.timezone
      }
    }

  }
}

resource "google_compute_region_autoscaler" "default" {
  provider    = google-beta
  count       = local.is_regional && var.autoscaler_config != null ? 1 : 0
  project     = var.project_id
  name        = var.name
  region      = var.location
  description = var.description
  target      = google_compute_region_instance_group_manager.default.0.id

  autoscaling_policy {
    max_replicas    = var.autoscaler_config.max_replicas
    min_replicas    = var.autoscaler_config.min_replicas
    cooldown_period = var.autoscaler_config.cooldown_period

    dynamic "scale_down_control" {
      for_each = local.as_scaling.down == null ? [] : [""]
      content {
        time_window_sec = local.as_scaling.down.time_window_sec
        dynamic "max_scaled_down_replicas" {
          for_each = (
            local.as_scaling.down.max_replicas_fixed == null &&
            local.as_scaling.down.max_replicas_percent == null
            ? []
            : [""]
          )
          content {
            fixed   = local.as_scaling.down.max_replicas_fixed
            percent = local.as_scaling.down.max_replicas_percent
          }
        }
      }
    }

    dynamic "scale_in_control" {
      for_each = local.as_scaling.in == null ? [] : [""]
      content {
        time_window_sec = local.as_scaling.in.time_window_sec
        dynamic "max_scaled_in_replicas" {
          for_each = (
            local.as_scaling.in.max_replicas_fixed == null &&
            local.as_scaling.in.max_replicas_percent == null
            ? []
            : [""]
          )
          content {
            fixed   = local.as_scaling.in.max_replicas_fixed
            percent = local.as_scaling.in.max_replicas_percent
          }
        }
      }
    }

    dynamic "cpu_utilization" {
      for_each = local.as_signals.cpu_utilization == null ? [] : [""]
      content {
        target = local.as_signals.cpu_utilization.target
        predictive_method = (
          local.as_signals.cpu_utilization.optimize_availability == true
          ? "OPTIMIZE_AVAILABILITY"
          : null
        )
      }
    }

    dynamic "load_balancing_utilization" {
      for_each = local.as_signals.load_balancing_utilization == null ? [] : [""]
      content {
        target = local.as_signals.load_balancing_utilization.target
      }
    }

    dynamic "metric" {
      for_each = toset(
        local.as_signals.metrics == null ? [] : local.as_signals.metrics
      )
      content {
        name                       = metric.value.name
        type                       = metric.value.type
        target                     = metric.value.target_value
        single_instance_assignment = metric.value.single_instance_assignment
        filter                     = metric.value.time_series_filter
      }
    }

    dynamic "scaling_schedules" {
      for_each = toset(
        local.as_signals.schedules == null ? [] : local.as_signals.schedules
      )
      iterator = schedule
      content {
        duration_sec          = schedule.value.duration_sec
        min_required_replicas = schedule.value.min_required_replicas
        name                  = schedule.value.name
        schedule              = schedule.cron_schedule
        description           = schedule.value.description
        disabled              = schedule.value.disabled
        time_zone             = schedule.value.timezone
      }
    }

  }
}
