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


variable "name" {
  description = "Value that will be used for SA creation etc."
  type        = string
  default     = "quota-export"
}

variable "org" {
  description = "Value of the Org Id to deploy the solution"
  type        = string
}

variable "project" {
  description = "Value of the Project Id to deploy the solution"
  type        = string
}

variable "project_number" {
  description = "Value of the Project number to deploy the solution"
  type        = string
}

variable "region" {
  description = "Value of the region to deploy the solution."
  type        = string
}
