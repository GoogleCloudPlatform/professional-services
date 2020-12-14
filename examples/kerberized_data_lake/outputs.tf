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

output "gcs_encrypted_keytab_path" {
  description = "GCS path to keep keytabs"
  value       = "gs://${module.data_lake_buckets.names["dataproc-secrets"]}/keytabs"
}

output "kms_key" {
  description = "kms key for decrypting keytabs"
  value       = module.kms.keys[var.dataproc_kms_key]
}

output "analytics_cluster_fqdn" {
  description = "Fully qualified domain name for cluster on which to run presto / spark jobs"
  value       = "${google_dataproc_cluster.analytics_cluster.name}-m.${var.zone}.c.${var.project}.internal"
}
