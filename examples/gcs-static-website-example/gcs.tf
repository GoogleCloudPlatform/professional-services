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

resource "google_storage_bucket" "static_website" {
  project = google_project.project.project_id

  name          = "static_website_example"
  location      = var.region

  website {
    main_page_suffix = "index.html"
    not_found_page   = "404.html"
  }
}

resource "google_storage_bucket_object" "index_html" {
  name   = "index.html"
  source = "./src/static/index.html"
  bucket = google_storage_bucket.static_website.name
}

resource "google_storage_bucket_object" "not_found_html" {
  name   = "404.html"
  source = "./src/static/404.html"
  bucket = google_storage_bucket.static_website.name
}

# Make bucket public by granting allUsers READER access
resource "google_storage_bucket_iam_member" "public_bucket" {
  bucket = google_storage_bucket.static_website.name
  role = "roles/storage.objectViewer"
  member = "allUsers"
}