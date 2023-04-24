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

output "backend-health" {
  description = "Command to monitor API internal backend health."
  value       = <<END
gcloud compute backend-services get-health ${google_compute_region_backend_service.api.name} \
  --project ${google_compute_region_backend_service.api.project} \
  --region ${google_compute_region_backend_service.api.region} \
  --format 'value(backend, status.healthStatus.healthState)'
END
}

output "bootstrap-ssh" {
  description = "Command to SSH to the bootstrap instance."
  value       = !local.bootstrapping ? null : <<END
gcloud compute ssh core@${google_compute_instance.bootstrap.0.name} \
  --project ${google_compute_instance.bootstrap.0.project} \
  --zone ${google_compute_instance.bootstrap.0.zone} \
  --ssh-key-file ${replace(var.fs_paths.ssh_key, ".pub", "")}
END
}

output "masters-ssh" {
  description = "Command to SSH to the master instances."
  value = {
    for k, v in google_compute_instance.master : k => <<END
gcloud compute ssh core@${v.name} \
  --project ${v.project} \
  --zone ${v.zone} \
  --ssh-key-file ${replace(var.fs_paths.ssh_key, ".pub", "")}
END
  }
}
