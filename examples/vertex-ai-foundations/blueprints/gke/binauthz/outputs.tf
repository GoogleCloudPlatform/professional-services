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

output "image_repo_url" {
  description = "Image source repository url."
  value       = "ssh://<USER>@source.developers.google.com:2022/p/${module.project.project_id}/r/${module.image_repo.name}"
}

output "app_repo_url" {
  description = "App source repository url."
  value       = "ssh://<USER>@source.developers.google.com:2022/p/${module.project.project_id}/r/${module.app_repo.name}"
}
