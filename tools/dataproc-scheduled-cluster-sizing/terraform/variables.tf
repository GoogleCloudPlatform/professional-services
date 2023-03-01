# Copyright 2022 Google Inc.
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

variable "project_id" {
	default 	= ""
    type    	= string
    description = "Google Cloud Project ID"
}

variable "app_id" {
	default 	= ""
    type    	= string
    description = "Application name/identifier"
}

variable "region" {
	default 	= ""
    type    	= string
    description = "Google Cloud Region"
}

variable "service_account_email" {
	default 	= ""
    type    	= string
    description = "Google Cloud IAM service account email"
}

variable "schedule" {
	default 	= ""
    type    	= string
    description = "Regex schedule"
}

variable "primary_size" {
	default 	= ""
    type    	= string
    description = "Number of primary workers"
}

variable "secondary_size" {
	default 	= ""
    type    	= string
    description = "Number of secondary workers"
}

variable "label_key" {
	default 	= ""
    type    	= string
    description = "Dataproc cluster label key"
}

variable "label_val" {
	default 	= ""
    type    	= string
    description = "Dataproc cluster label value"
}