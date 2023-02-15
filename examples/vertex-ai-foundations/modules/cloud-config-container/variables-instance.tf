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

variable "test_instance" {
  description = "Test/development instance attributes, leave null to skip creation."
  type = object({
    project_id = string
    zone       = string
    name       = string
    type       = string
    network    = string
    subnetwork = string
  })
  default = null
}

variable "test_instance_defaults" {
  description = "Test/development instance defaults used for optional configuration. If image is null, COS stable will be used."
  type = object({
    disks = map(object({
      read_only = bool
      size      = number
    }))
    image                 = string
    metadata              = map(string)
    nat                   = bool
    service_account_roles = list(string)
    tags                  = list(string)
  })
  default = {
    disks    = {}
    image    = null
    metadata = {}
    nat      = false
    service_account_roles = [
      "roles/logging.logWriter",
      "roles/monitoring.metricWriter"
    ]
    tags = ["ssh"]
  }
}
