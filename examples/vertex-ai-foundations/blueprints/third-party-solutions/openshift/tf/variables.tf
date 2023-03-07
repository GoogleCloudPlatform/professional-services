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

variable "allowed_ranges" {
  description = "Ranges that can SSH to the boostrap VM and API endpoint."
  type        = list(any)
  default     = ["10.0.0.0/8"]
}

variable "cluster_name" {
  description = "Name used for the cluster and DNS zone."
  type        = string
}

variable "domain" {
  description = "Domain name used to derive the DNS zone."
  type        = string
}

variable "disk_encryption_key" {
  description = "Optional CMEK for disk encryption."
  type = object({
    keyring    = string
    location   = string
    name       = string
    project_id = string
  })
  default = null
}

variable "host_project" {
  description = "Shared VPC project and network configuration."
  type = object({
    default_subnet_name = string
    masters_subnet_name = string
    project_id          = string
    vpc_name            = string
    workers_subnet_name = string
  })
}

# https://github.com/openshift/installer/blob/master/docs/user/customization.md

variable "install_config_params" {
  description = "OpenShift cluster configuration."
  type = object({
    disk_size = number
    labels    = map(string)
    network = object({
      cluster     = string
      host_prefix = number
      machine     = string
      service     = string
    })
    proxy = object({
      http    = string
      https   = string
      noproxy = string
    })
  })
  default = {
    disk_size = 16
    labels    = {}
    network = {
      cluster     = "10.128.0.0/14"
      host_prefix = 23
      machine     = "10.0.0.0/16"
      service     = "172.30.0.0/16"
    }
    proxy = null
  }
}

variable "fs_paths" {
  description = "Filesystem paths for commands and data, supports home path expansion."
  type = object({
    credentials       = string
    config_dir        = string
    openshift_install = string
    pull_secret       = string
    ssh_key           = string
  })
}

# oc -n openshift-cloud-credential-operator get CredentialsRequest \
#   openshift-machine-api-gcp \
#   -o jsonpath='{.status.providerStatus.serviceAccountID}{"\n"}'

variable "post_bootstrap_config" {
  description = "Name of the service account for the machine operator. Removes bootstrap resources when set."
  type = object({
    machine_op_sa_prefix = string
  })
  default = null
}

variable "region" {
  description = "Region where resources will be created."
  type        = string
  default     = "europe-west1"
}

variable "rhcos_gcp_image" {
  description = "RHCOS image used."
  type        = string
  # okd
  # default = "projects/fedora-coreos-cloud/global/images/fedora-coreos-33-20210217-3-0-gcp-x86-64"
  default = "projects/rhcos-cloud/global/images/rhcos-47-83-202102090044-0-gcp-x86-64"
}

variable "service_project" {
  description = "Service project configuration."
  type = object({
    project_id = string
  })
}

variable "tags" {
  description = "Additional tags for instances."
  type        = list(string)
  default     = ["ssh"]
}

variable "zones" {
  description = "Zones used for instances."
  type        = list(string)
  default     = ["b", "c", "d"]
}
