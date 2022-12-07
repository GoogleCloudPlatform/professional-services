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

variable "iam" {
  description = "Keyring IAM bindings in {ROLE => [MEMBERS]} format."
  type        = map(list(string))
  default     = {}
}

variable "iam_additive" {
  description = "Keyring IAM additive bindings in {ROLE => [MEMBERS]} format."
  type        = map(list(string))
  default     = {}
}

variable "key_iam" {
  description = "Key IAM bindings in {KEY => {ROLE => [MEMBERS]}} format."
  type        = map(map(list(string)))
  default     = {}
}

variable "key_iam_additive" {
  description = "Key IAM additive bindings in {ROLE => [MEMBERS]} format."
  type        = map(map(list(string)))
  default     = {}
}

variable "key_purpose" {
  description = "Per-key purpose, if not set defaults will be used. If purpose is not `ENCRYPT_DECRYPT` (the default), `version_template.algorithm` is required."
  type = map(object({
    purpose = string
    version_template = object({
      algorithm        = string
      protection_level = string
    })
  }))
  default = {}
}

variable "key_purpose_defaults" {
  description = "Defaults used for key purpose when not defined at the key level. If purpose is not `ENCRYPT_DECRYPT` (the default), `version_template.algorithm` is required."
  type = object({
    purpose = string
    version_template = object({
      algorithm        = string
      protection_level = string
    })
  })
  default = {
    purpose          = null
    version_template = null
  }
}

# cf https://cloud.google.com/kms/docs/locations

variable "keyring" {
  description = "Keyring attributes."
  type = object({
    location = string
    name     = string
  })
}

variable "keyring_create" {
  description = "Set to false to manage keys and IAM bindings in an existing keyring."
  type        = bool
  default     = true
}

variable "keys" {
  description = "Key names and base attributes. Set attributes to null if not needed."
  type = map(object({
    rotation_period = string
    labels          = map(string)
  }))
  default = {}
}

variable "project_id" {
  description = "Project id where the keyring will be created."
  type        = string
}

variable "tag_bindings" {
  description = "Tag bindings for this keyring, in key => tag value id format."
  type        = map(string)
  default     = null
}
