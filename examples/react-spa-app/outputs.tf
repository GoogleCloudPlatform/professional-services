# Copyright 2024 Google LLC
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#     https://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

output "global_lb" {
  value       = var.global_lb ? (var.dns_config != null ? format("http://%s", trimsuffix(google_dns_record_set.frontend[""].name, ".")) : format("http://%s", module.xlb[""].address)) : null
  description = "Global load balancer address."
}

output "regional_lb" {
  value       = var.regional_lb ? (var.dns_config != null ? format("http://%s", trimsuffix(google_dns_record_set.frontend-regional[""].name, ".")) : format("http://%s", module.xlb-regional[""].address)) : null
  description = "Regional load balancer address."
}
