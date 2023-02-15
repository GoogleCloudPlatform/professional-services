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

variable "delegated_role_grants" {
  description = "List of roles that project administrators will be allowed to grant/revoke."
  type        = list(string)
  default = [
    "roles/storage.admin",
    "roles/storage.hmacKeyAdmin",
    "roles/storage.legacyBucketOwner",
    "roles/storage.objectAdmin",
    "roles/storage.objectCreator",
    "roles/storage.objectViewer",
    "roles/compute.admin",
    "roles/compute.imageUser",
    "roles/compute.instanceAdmin",
    "roles/compute.instanceAdmin.v1",
    "roles/compute.networkAdmin",
    "roles/compute.networkUser",
    "roles/compute.networkViewer",
    "roles/compute.orgFirewallPolicyAdmin",
    "roles/compute.orgFirewallPolicyUser",
    "roles/compute.orgSecurityPolicyAdmin",
    "roles/compute.orgSecurityPolicyUser",
    "roles/compute.orgSecurityResourceAdmin",
    "roles/compute.osAdminLogin",
    "roles/compute.osLogin",
    "roles/compute.osLoginExternalUser",
    "roles/compute.packetMirroringAdmin",
    "roles/compute.packetMirroringUser",
    "roles/compute.publicIpAdmin",
    "roles/compute.securityAdmin",
    "roles/compute.serviceAgent",
    "roles/compute.storageAdmin",
    "roles/compute.viewer",
    "roles/viewer"
  ]
}

variable "direct_role_grants" {
  description = "List of roles granted directly to project administrators."
  type        = list(string)
  default = [
    "roles/compute.admin",
    "roles/storage.admin",
  ]
}

variable "project_administrators" {
  description = "List identities granted administrator permissions."
  type        = list(string)
}

variable "project_create" {
  description = "Create project instead of using an existing one."
  type        = bool
  default     = false
}

variable "project_id" {
  description = "GCP project id where to grant direct and delegated roles to the users listed in project_administrators."
  type        = string
}

variable "restricted_role_grant" {
  description = "Role grant to which the restrictions will apply."
  type        = string
  default     = "roles/resourcemanager.projectIamAdmin"
}
