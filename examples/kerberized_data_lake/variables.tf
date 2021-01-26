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

variable "project" {
  description = "GCP Project ID in which to deploy data lake resources"
}

variable "region" {
  description = "GCP Compute region in which to deploy dataproc clusters"
  default     = "us-central1"
}

variable "zone" {
  description = "GCP Compute region in which to deploy dataproc clusters"
  default     = "us-central1-f"
}

variable "dataproc_subnet" {
  description = "self link for VPC subnet in which to spin up dataproc clusters"
}

variable "kms_key_ring" {
  description = "Name for KMS Keyring"
  default     = "dataproc-kerberos-keyring"
}

variable "dataproc_kms_key" {
  description = "Name for KMS Key for kerberized dataproc"
  default     = "dataproc-key"
}

variable "data_lake_super_admin" {
  description = "User email for super admin rights on data lake"
}

variable "corp_kdc_realm" {
  description = "Kerberos realm to represent centralized kerberos identities"
  default     = "FOO.COM"
}

variable "metastore_realm" {
  description = "Kerberos realm for hive metastore to use"
  default     = "HIVE-METASTORE.FOO.COM"
}

variable "analytics_realm" {
  description = "Kerberos realm for analytics clusters to use"
  default     = "ANALYTICS.FOO.COM"
}

variable "kdc_cluster" {
  description = "name for kdc dataproc cluster"
  default     = "kdc-cluster"
}

variable "metastore_cluster" {
  description = "name for Hive Metastore dataproc cluster"
  default     = "metastore-cluster"
}

variable "analytics_cluster" {
  description = "name for analytics dataproc cluster"
  default     = "analytics-cluster"
}

variable "tenants" {
  description = "list of non-human kerberos principals (one per tenant) to be created as unix users on each cluster"
  type        = list(string)
  default     = ["core-data",]
}

variable "users" {
  description = "list of human kerberos principals to be created as unix users on each cluster"
  type        = list(string)
  default     = ["user1", "user2"]
}

variable "bucket_location_map" {
  description = "map"
  type        = map(string)
  default     = {
    us            = "us"
    northamerica  = "us"
    southamerica  = "us"
    europe        = "eu"
    asia          = "asia"
    australia     = "asia"
  }
}
