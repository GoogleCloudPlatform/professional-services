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

/*
 * Required in case if Spanner instance is
 * created via terraform or imported to
 * maintain via terraform.
*/
resource "google_spanner_instance" "spanner-instance-data" {
  config       = "regional-${var.region}"
  name         = var.spanner_instance_name_for_userdata
  display_name = var.spanner_instance_name_for_userdata
  project      = var.project_id
  num_nodes    = 1
}

/*
 * This block is to create the Cloud Spanner
 * instance to use for the change streams
 * connector metadata table.
*/
resource "google_spanner_instance" "spanner-instance-metadata" {
  config       = "regional-${var.region}"
  name         = var.spanner_instance_name_for_metadata
  display_name = var.spanner_instance_name_for_metadata
  project      = var.project_id
  num_nodes    = 1
}

/*
 * This block is required to create
 * The Cloud Spanner database to use for
 * the change streams connector metadata table.
*/
resource "google_spanner_database" "spanner-database-metadata" {
  instance                 = google_spanner_instance.spanner-instance-metadata.name
  name                     = var.spanner_database_name_for_metadata
  project                  = var.project_id
  version_retention_period = "3d"
  deletion_protection      = false
}

/*
 * This block is required if you are creating
 * a database initially via terraform.
*/
resource "google_spanner_database" "spanner-database-data" {
  instance                 = google_spanner_instance.spanner-instance-data.name
  name                     = var.spanner_database_name_for_userdata
  project                  = var.project_id
  version_retention_period = "3d"
  ddl = [
    "CREATE TABLE employee (id INT64,name STRING(50),age INT64,address STRING(100),salary FLOAT64) PRIMARY KEY (id)",
    "CREATE CHANGE STREAM cs_poc_tf FOR employee",
  ]
  deletion_protection = false
}
