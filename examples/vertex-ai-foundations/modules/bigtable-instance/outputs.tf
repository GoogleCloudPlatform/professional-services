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

output "id" {
  description = "An identifier for the resource with format projects/{{project}}/instances/{{name}}."
  value       = google_bigtable_instance.default.id
  depends_on = [
    google_bigtable_instance_iam_binding.default,
    google_bigtable_table.default
  ]
}

output "instance" {
  description = "BigTable intance."
  value       = google_bigtable_instance.default
  depends_on = [
    google_bigtable_instance_iam_binding.default,
    google_bigtable_table.default
  ]
}

output "table_ids" {
  description = "Map of fully qualified table ids keyed by table name."
  value       = { for k, v in google_bigtable_table.default : v.name => v.id }
}

output "tables" {
  description = "Table resources."
  value       = google_bigtable_table.default
}



