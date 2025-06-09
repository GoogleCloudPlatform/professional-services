# Copyright 2025 Google LLC

# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at

#     https://www.apache.org/licenses/LICENSE-2.0

# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

variable "zone" {
  type        = string
  description = "the zone in which policy will be created"
  default     = "us-central1-c"
}

variable "region" {
  type        = string
  description = "the region where project resides"
  default     = "us-central1"
}

variable "folder_path" {
  type    = string
  default = "cloudresourcemanager.googleapis.com/folders/"
}

variable "org_id" {
  description = "Your Organizations ID"
  type        = string
}

variable "folder_id" {
  description = "The folder ID to place the policy within."
  type        = string
}

variable "networking_exception_principals" {
  type        = list(string)
  description = "The id of the google group associated with your networking team. Follows the format principalSet://goog/group/GROUP_EMAIL_ADDRESS" #https://cloud.google.com/iam/docs/principal-identifiers for wider syntax
}

variable "billing_exception_principals" {
  type        = list(string)
  description = "The id of the google group associated with your billing team. Follows the format principalSet://goog/group/GROUP_EMAIL_ADDRESS"
}

variable "sec_exception_principals" {
  type        = list(string)
  description = "A list of excluded principals from an IAM Deny Policy. Follows the format principalSet://goog/group/GROUP_EMAIL_ADDRESS"
}

variable "top_exception_principals" {
  type        = list(string)
  description = "A list of excluded principals from an IAM Deny Policy. Follows the format principalSet://goog/group/GROUP_EMAIL_ADDRESS"
  default     = []
}
