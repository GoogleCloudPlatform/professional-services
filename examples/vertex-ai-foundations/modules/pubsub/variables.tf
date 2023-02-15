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

variable "dead_letter_configs" {
  description = "Per-subscription dead letter policy configuration."
  type = map(object({
    topic                 = string
    max_delivery_attempts = number
  }))
  default = {}
}

variable "defaults" {
  description = "Subscription defaults for options."
  type = object({
    ack_deadline_seconds       = number
    message_retention_duration = string
    retain_acked_messages      = bool
    expiration_policy_ttl      = string
    filter                     = string
  })
  default = {
    ack_deadline_seconds       = null
    message_retention_duration = null
    retain_acked_messages      = null
    expiration_policy_ttl      = null
    filter                     = null
  }
}

variable "iam" {
  description = "IAM bindings for topic in {ROLE => [MEMBERS]} format."
  type        = map(list(string))
  default     = {}
}

variable "kms_key" {
  description = "KMS customer managed encryption key."
  type        = string
  default     = null
}

variable "labels" {
  description = "Labels."
  type        = map(string)
  default     = {}
}

variable "message_retention_duration" {
  description = "Minimum duration to retain a message after it is published to the topic."
  type        = string
  default     = null
}

variable "name" {
  description = "PubSub topic name."
  type        = string
}

variable "project_id" {
  description = "Project used for resources."
  type        = string
}

variable "push_configs" {
  description = "Push subscription configurations."
  type = map(object({
    attributes = map(string)
    endpoint   = string
    oidc_token = object({
      audience              = string
      service_account_email = string
    })
  }))
  default = {}
}

variable "regions" {
  description = "List of regions used to set persistence policy."
  type        = list(string)
  default     = []
}

variable "subscription_iam" {
  description = "IAM bindings for subscriptions in {SUBSCRIPTION => {ROLE => [MEMBERS]}} format."
  type        = map(map(list(string)))
  default     = {}
}

variable "subscriptions" {
  description = "Topic subscriptions. Also define push configs for push subscriptions. If options is set to null subscription defaults will be used. Labels default to topic labels if set to null."
  type = map(object({
    labels = map(string)
    options = object({
      ack_deadline_seconds       = number
      message_retention_duration = string
      retain_acked_messages      = bool
      expiration_policy_ttl      = string
      filter                     = string
    })
  }))
  default = {}
}
