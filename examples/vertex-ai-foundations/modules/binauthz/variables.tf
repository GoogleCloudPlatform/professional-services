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

variable "project_id" {
  description = "Project ID."
  type        = string
}

variable "global_policy_evaluation_mode" {
  description = "Global policy evaluation mode."
  type        = string
  default     = null
}

variable "admission_whitelist_patterns" {
  description = "An image name pattern to allowlist"
  type        = list(string)
  default     = null
}

variable "default_admission_rule" {
  description = "Default admission rule"
  type = object({
    evaluation_mode  = string
    enforcement_mode = string
    attestors        = list(string)
  })
  default = {
    evaluation_mode  = "ALWAYS_ALLOW"
    enforcement_mode = "ENFORCED_BLOCK_AND_AUDIT_LOG"
    attestors        = null
  }
}

variable "cluster_admission_rules" {
  description = "Admission rules"
  type = map(object({
    evaluation_mode  = string
    enforcement_mode = string
    attestors        = list(string)
  }))
  default = null
}

variable "attestors_config" {
  description = "Attestors configuration"
  type = map(object({
    note_reference  = string
    iam             = map(list(string))
    pgp_public_keys = list(string)
    pkix_public_keys = list(object({
      id                  = string
      public_key_pem      = string
      signature_algorithm = string
    }))
  }))
  default = null
}
