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

output "folders" {
  description = "Map of folders attributes keyed by folder id."
  value       = local.all_folders
}

output "projects" {
  description = "Map of projects attributes keyed by projects id."
  value       = local.projects
}

output "project_numbers" {
  description = "List of project numbers."
  value       = [for _, v in local.projects : v.number]
}
