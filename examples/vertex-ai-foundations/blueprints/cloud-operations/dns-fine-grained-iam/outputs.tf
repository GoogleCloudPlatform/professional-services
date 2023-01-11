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

output "gcloud_commands" {
  description = "Commands used to SSH to the VMs."
  value = {
    ns-editor  = "gcloud compute ssh ${module.vm-ns-editor.instance.name} --zone ${var.region}-b --tunnel-through-iap"
    svc-editor = "gcloud compute ssh ${module.vm-svc-editor.instance.name} --zone ${var.region}-b --tunnel-through-iap"
  }
}

output "vms" {
  description = "VM names."
  value = {
    ns-editor  = module.vm-ns-editor.instance.name
    svc-editor = module.vm-svc-editor.instance.name
  }
}
