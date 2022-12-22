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

output "test_instance" {
  description = "Optional test instance name and address."
  value = (var.test_instance == null ? {} : {
    address = google_compute_instance.default[0].network_interface.0.network_ip
    name    = google_compute_instance.default[0].name
    nat_address = try(
      google_compute_instance.default[0].network_interface.0.access_config.0.nat_ip,
      null
    )
    service_account = google_service_account.default[0].email
  })
}
