# Copyright 2020 Google Inc.
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#   http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.
#

variable "project" {}

variable "region" {
	default = "us-central1"
}

variable "dataflow_bucket" {
	type = string
	default = ""
}

variable "cloudfunction_bucket" {
	type = string
	default = ""
}

variable "secret_name" {
	type = string
	default = "hash-key-64"
	description = "Secret name where base64 encoded hash key exists"
}

variable "firestore_collection" {
	type = string
	default = "hashed_socials"
	description = "The name of the Firestore collection where the hashed SSNs are"
}

variable "output_topic" {
	type = string
	default = "hashpipeline"
	description = "The Pubsub topic name that the output is written to"
}

variable "salt" {
	type = string
	default = "4ec6c189401de41c"
	description = "BLAKE2b-compatible 16-byte salt"
}

variable "cf_runner_permissions" {
	type = list
	default = [
		"roles/cloudfunctions.serviceAgent",
		"roles/dataflow.developer",
		"roles/compute.viewer",
	]
}

variable "df_worker_project_permissions" {
	type = list
	default = [
		"roles/dataflow.worker",
		"roles/datastore.viewer",
		"roles/dlp.user",
	]
}
