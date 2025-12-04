/**
 * Copyright 2025 Google LLC
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

resource "google_monitoring_alert_policy" "crl_validation_failure" {
  display_name = "CRL Validation"
  combiner     = "OR"
  project      = var.project_id

  conditions {
    display_name = "CRL Validation Failed"
    condition_threshold {
      filter          = "metric.type=\"custom.googleapis.com/crl_validation/success\" AND resource.type=\"generic_task\""
      duration        = var.alert_duration_threshold
      comparison      = "COMPARISON_LT"
      threshold_value = 1

      aggregations {
        alignment_period     = "60s"
        per_series_aligner   = "ALIGN_NEXT_OLDER"
        cross_series_reducer = "REDUCE_MAX"
        group_by_fields      = ["resource.label.job"]
      }

      trigger {
        count = 1
      }
    }
  }

  alert_strategy {
    auto_close = var.alert_autoclose
  }
}
