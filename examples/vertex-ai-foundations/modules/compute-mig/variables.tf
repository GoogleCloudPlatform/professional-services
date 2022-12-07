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

variable "all_instances_config" {
  description = "Metadata and labels set to all instances in the group."
  type = object({
    labels   = optional(map(string))
    metadata = optional(map(string))
  })
  default = null
}

variable "auto_healing_policies" {
  description = "Auto-healing policies for this group."
  type = object({
    health_check      = optional(string)
    initial_delay_sec = number
  })
  default = null
}

variable "autoscaler_config" {
  description = "Optional autoscaler configuration."
  type = object({
    max_replicas    = number
    min_replicas    = number
    cooldown_period = optional(number)
    mode            = optional(string) # OFF, ONLY_UP, ON
    scaling_control = optional(object({
      down = optional(object({
        max_replicas_fixed   = optional(number)
        max_replicas_percent = optional(number)
        time_window_sec      = optional(number)
      }))
      in = optional(object({
        max_replicas_fixed   = optional(number)
        max_replicas_percent = optional(number)
        time_window_sec      = optional(number)
      }))
    }), {})
    scaling_signals = optional(object({
      cpu_utilization = optional(object({
        target                = number
        optimize_availability = optional(bool)
      }))
      load_balancing_utilization = optional(object({
        target = number
      }))
      metrics = optional(list(object({
        name                       = string
        type                       = string # GAUGE, DELTA_PER_SECOND, DELTA_PER_MINUTE
        target_value               = number
        single_instance_assignment = optional(number)
        time_series_filter         = optional(string)
      })))
      schedules = optional(list(object({
        duration_sec          = number
        name                  = string
        min_required_replicas = number
        cron_schedule         = string
        description           = optional(bool)
        timezone              = optional(string)
        disabled              = optional(bool)
      })))
    }), {})
  })
  default = null
}

variable "default_version_name" {
  description = "Name used for the default version."
  type        = string
  default     = "default"
}

variable "description" {
  description = "Optional description used for all resources managed by this module."
  type        = string
  default     = "Terraform managed."
}

variable "distribution_policy" {
  description = "DIstribution policy for regional MIG."
  type = object({
    target_shape = optional(string)
    zones        = optional(list(string))
  })
  default = null
}

variable "health_check_config" {
  description = "Optional auto-created health check configuration, use the output self-link to set it in the auto healing policy. Refer to examples for usage."
  type = object({
    check_interval_sec  = optional(number)
    description         = optional(string, "Terraform managed.")
    enable_logging      = optional(bool, false)
    healthy_threshold   = optional(number)
    timeout_sec         = optional(number)
    unhealthy_threshold = optional(number)
    grpc = optional(object({
      port               = optional(number)
      port_name          = optional(string)
      port_specification = optional(string) # USE_FIXED_PORT USE_NAMED_PORT USE_SERVING_PORT
      service_name       = optional(string)
    }))
    http = optional(object({
      host               = optional(string)
      port               = optional(number)
      port_name          = optional(string)
      port_specification = optional(string) # USE_FIXED_PORT USE_NAMED_PORT USE_SERVING_PORT
      proxy_header       = optional(string)
      request_path       = optional(string)
      response           = optional(string)
    }))
    http2 = optional(object({
      host               = optional(string)
      port               = optional(number)
      port_name          = optional(string)
      port_specification = optional(string) # USE_FIXED_PORT USE_NAMED_PORT USE_SERVING_PORT
      proxy_header       = optional(string)
      request_path       = optional(string)
      response           = optional(string)
    }))
    https = optional(object({
      host               = optional(string)
      port               = optional(number)
      port_name          = optional(string)
      port_specification = optional(string) # USE_FIXED_PORT USE_NAMED_PORT USE_SERVING_PORT
      proxy_header       = optional(string)
      request_path       = optional(string)
      response           = optional(string)
    }))
    tcp = optional(object({
      port               = optional(number)
      port_name          = optional(string)
      port_specification = optional(string) # USE_FIXED_PORT USE_NAMED_PORT USE_SERVING_PORT
      proxy_header       = optional(string)
      request            = optional(string)
      response           = optional(string)
    }))
    ssl = optional(object({
      port               = optional(number)
      port_name          = optional(string)
      port_specification = optional(string) # USE_FIXED_PORT USE_NAMED_PORT USE_SERVING_PORT
      proxy_header       = optional(string)
      request            = optional(string)
      response           = optional(string)
    }))
  })
  default = null
  validation {
    condition = (
      (try(var.health_check_config.grpc, null) == null ? 0 : 1) +
      (try(var.health_check_config.http, null) == null ? 0 : 1) +
      (try(var.health_check_config.tcp, null) == null ? 0 : 1) <= 1
    )
    error_message = "Only one health check type can be configured at a time."
  }
}

variable "instance_template" {
  description = "Instance template for the default version."
  type        = string
}

variable "location" {
  description = "Compute zone or region."
  type        = string
}

variable "name" {
  description = "Managed group name."
  type        = string
}

variable "named_ports" {
  description = "Named ports."
  type        = map(number)
  default     = null
}

variable "project_id" {
  description = "Project id."
  type        = string
}

variable "stateful_disks" {
  description = "Stateful disk configuration applied at the MIG level to all instances, in device name => on permanent instance delete rule as boolean."
  type        = map(bool)
  default     = {}
  nullable    = false
}

variable "stateful_config" {
  description = "Stateful configuration for individual instances."
  type = map(object({
    minimal_action          = optional(string)
    most_disruptive_action  = optional(string)
    remove_state_on_destroy = optional(bool)
    preserved_state = optional(object({
      disks = optional(map(object({
        source                      = string
        delete_on_instance_deletion = optional(bool)
        read_only                   = optional(bool)
      })))
      metadata = optional(map(string))
    }))
  }))
  default  = {}
  nullable = false
}

variable "target_pools" {
  description = "Optional list of URLs for target pools to which new instances in the group are added."
  type        = list(string)
  default     = []
}

variable "target_size" {
  description = "Group target size, leave null when using an autoscaler."
  type        = number
  default     = null
}

variable "update_policy" {
  description = "Update policy. Minimal action and type are required."
  type = object({
    minimal_action = string
    type           = string
    max_surge = optional(object({
      fixed   = optional(number)
      percent = optional(number)
    }))
    max_unavailable = optional(object({
      fixed   = optional(number)
      percent = optional(number)
    }))
    min_ready_sec                = optional(number)
    most_disruptive_action       = optional(string)
    regional_redistribution_type = optional(string)
    replacement_method           = optional(string)
  })
  default = null
}

variable "versions" {
  description = "Additional application versions, target_size is optional."
  type = map(object({
    instance_template = string
    target_size = optional(object({
      fixed   = optional(number)
      percent = optional(number)
    }))
  }))
  default  = {}
  nullable = false
}

variable "wait_for_instances" {
  description = "Wait for all instances to be created/updated before returning."
  type = object({
    enabled = bool
    status  = optional(string)
  })
  default = null
}
