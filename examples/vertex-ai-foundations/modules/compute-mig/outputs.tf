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

output "autoscaler" {
  description = "Auto-created autoscaler resource."
  value = var.autoscaler_config == null ? null : try(
    google_compute_autoscaler.default.0,
    google_compute_region_autoscaler.default.0,
    {}
  )
}

output "group_manager" {
  description = "Instance group resource."
  value = try(
    google_compute_instance_group_manager.default.0,
    google_compute_region_instance_group_manager.default.0,
    {}
  )
}

output "health_check" {
  description = "Auto-created health-check resource."
  value = (
    var.health_check_config == null
    ? null
    : google_compute_health_check.default.0
  )
}
