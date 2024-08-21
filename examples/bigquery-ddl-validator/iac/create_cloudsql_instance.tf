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

resource "google_sql_database_instance" "migration-ddl-utility" {
  name             = "migration-ddl-utility"
  region           = var.region
  database_version = var.database_version
  settings {
    tier = "db-f1-micro"
  }
}

resource "google_sql_database" "my_database" {
  name     = var.database_type == "h" ? var.hive_audit_db_name : (var.database_type == "s" ? var.snowflake_audit_db_name : (var.database_type == "t" ? var.snowflake_audit_db_name : (var.database_type == "o" ? var.oracle_audit_db_name : "")))
  instance = google_sql_database_instance.migration-ddl-utility.name
}

resource "google_sql_user" "users" {
  name     = "me"
  instance = google_sql_database_instance.migration-ddl-utility.name
  host     = "me.com"
  password = "changeme"
}


