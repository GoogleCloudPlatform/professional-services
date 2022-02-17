# Copyright 2021 Google Inc. All Rights Reserved.
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#    http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.


variable "project" {
  description = "Value of the Project Id to deploy the solution"
  type        = string
}

variable "email_address" {
  description = "Email Address for notifications."
  type        = string
}

variable "dashboard_link" {
  description = "Link to Datastudio dashboard threshold report page."
  type        = string
}
