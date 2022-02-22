# Copyright 2020 Google Inc.
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#     http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.
#
#
# This software is provided as-is,
# without warranty or representation for any use or purpose.
# Your use of it is subject to your agreement with Google.

variable "tmpl_file" {
  description = "Template file in which to render the variables with and logic file. This should contain a header defining variables referenced by the logic file."
}

variable "subs" {
  description = "a map of variables to substitute in the template file"
  type        = map
  default     = {}
}

variable "logic_file" {
  description = "logic file which references variables rendered in the header defined in the template. If not specified this will be replaced with  `var.tmpl_suffix` with `var.logic_suffix`"
  default     = ""
}

variable "tmpl_suffix" {
  description = "if `logic_file` not specified will default to replacing this suffix from template file with `var.logic_suffix`"
  default     = ".tmpl"
}

variable "logic_suffix" {
  description = "if `logic_file` not specified will default to replacing `var.tmpl_suffix` with this suffix suffix"
  default     = ".logic"
}
