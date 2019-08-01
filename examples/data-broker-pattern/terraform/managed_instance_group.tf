/*
 * Copyright 2018 Google Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
resource "google_compute_instance_group_manager" "data_broker_server_instance_group" {
  name               = "data-broker-server"
  instance_template  = "${google_compute_instance_template.data_broker_server_template.self_link}"
  base_instance_name = "data-broker-server-instance"
  zone               = "${var.region}-c"
  target_size        = "1"
  project            = "${google_project.project.project_id}"
}