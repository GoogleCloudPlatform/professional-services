#    Copyright 2023 Google LLC

#    Licensed under the Apache License, Version 2.0 (the "License");
#    you may not use this file except in compliance with the License.
#    You may obtain a copy of the License at

#        http://www.apache.org/licenses/LICENSE-2.0

#    Unless required by applicable law or agreed to in writing, software
#    distributed under the License is distributed on an "AS IS" BASIS,
#    WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
#    See the License for the specific language governing permissions and
#    limitations under the License.

variable "project" {
  description = "Google Cloud Platform project"
  default     = "test"
}

variable "region" {
  description = "Google Cloud Platform's selected region"
  default     = "us-central1"
}

variable "zone" {
  description = "Google Cloud Platform's selected Zone"
  default     = "us-central1-f"
}

variable "database_version" {
  description = "database version"
  default     = "test"
}

variable "database_type" {
  description = "database type"
  default     = "test"
}

variable "credentials_path" {
  description = "Path to the service account's keys.json file"
  default     = "./keys.json"
}

variable "hive_audit_db_name" {
  description = "Hive Audit DB Name"
  default     = "hive_audit_db"
}

variable "teradata_audit_db_name" {
  description = "Teradata Audit DB Name"
  default     = "teradata_audit_db"
}

variable "snowflake_audit_db_name" {
  description = "Snowflake Audit DB Name"
  default     = "snowflake_metadata_audit_db"
}

variable "oracle_audit_db_name" {
  description = "Oracle Audit DB Name"
  default     = "oracle_audit_db"
}
