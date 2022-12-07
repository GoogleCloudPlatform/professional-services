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

variable "amount" {
  description = "Amount in the billing account's currency for the budget. Use 0 to set budget to 100% of last period's spend."
  type        = number
  default     = 0
}

variable "billing_account" {
  description = "Billing account id."
  type        = string
}

variable "credit_treatment" {
  description = "How credits should be treated when determining spend for threshold calculations. Only INCLUDE_ALL_CREDITS or EXCLUDE_ALL_CREDITS are supported."
  type        = string
  default     = "INCLUDE_ALL_CREDITS"
  validation {
    condition = (
      var.credit_treatment == "INCLUDE_ALL_CREDITS" ||
      var.credit_treatment == "EXCLUDE_ALL_CREDITS"
    )
    error_message = "Argument credit_treatment must be INCLUDE_ALL_CREDITS or EXCLUDE_ALL_CREDITS."
  }
}

variable "email_recipients" {
  description = "Emails where budget notifications will be sent. Setting this will create a notification channel for each email in the specified project."
  type = object({
    project_id = string
    emails     = list(string)
  })
  default = null
}

variable "name" {
  description = "Budget name."
  type        = string
}

variable "notification_channels" {
  description = "Monitoring notification channels where to send updates."
  type        = list(string)
  default     = null
}

variable "notify_default_recipients" {
  description = "Notify Billing Account Administrators and Billing Account Users IAM roles for the target account."
  type        = bool
  default     = false
}

variable "projects" {
  description = "List of projects of the form projects/{project_number}, specifying that usage from only this set of projects should be included in the budget. Set to null to include all projects linked to the billing account."
  type        = list(string)
  default     = null
}

variable "pubsub_topic" {
  description = "The ID of the Cloud Pub/Sub topic where budget related messages will be published."
  type        = string
  default     = null
}

variable "services" {
  description = "List of services of the form services/{service_id}, specifying that usage from only this set of services should be included in the budget. Set to null to include usage for all services."
  type        = list(string)
  default     = null
}

variable "thresholds" {
  description = "Thresholds percentages at which alerts are sent. Must be a value between 0 and 1."
  type = object({
    current    = list(number)
    forecasted = list(number)
  })
  validation {
    condition     = length(var.thresholds.current) > 0 || length(var.thresholds.forecasted) > 0
    error_message = "Must specify at least one budget threshold."
  }
}
