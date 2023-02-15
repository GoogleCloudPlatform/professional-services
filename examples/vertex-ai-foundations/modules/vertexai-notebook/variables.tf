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

variable "name" {
  description = "The name specified for the Notebook instance."
  type        = string
}

variable "machine_type" {
  description = "A reference to a machine type which defines VM kind."
  type        = string
}

variable "location" {
  description = "A reference to the zone where the machine resides."
  type        = string
}

variable "project_id" {
  description = "Project where resources will be created."
  type        = string
}

variable "post_startup_script" {
  description = "Path to a Bash script that automatically runs after a notebook instance fully boots up. The path must be a URL or Cloud Storage path."
  type        = string
  default     = null
}

variable "instance_owners" {
  description = "The list of owners of this instance after creation. Format: alias@example.com. Currently supports one owner only. If not specified, all of the service account users of your VM instance's service account can use the instance."
  type        = list(string)
  default     = null
}

variable "service_account" {
  description = "The service account on this instance, giving access to other Google Cloud services. You can use any service account within the same project, but you must have the service account user permission to use the instance. If not specified, the Compute Engine default service account is used."
  type        = string
  default     = null
}

variable "service_account_scopes" {
  description = "The URIs of service account scopes to be included in Compute Engine instances."
  type        = list(string)
  default     = null
}

variable "nic_type" {
  description = "The type of vNIC driver."
  type        = string
  default     = null
}

variable "install_gpu_driver" {
  description = "Whether the end user authorizes Google Cloud to install GPU driver on this instance."
  type        = bool
  default     = null
}

variable "custom_gpu_driver_path" {
  description = "Specify a custom Cloud Storage path where the GPU driver is stored."
  type        = string
  default     = null
}

variable "boot_disk_type" {
  description = "Possible disk types for notebook instances. "
  type        = string
  default     = null
}

variable "boot_disk_size_gb" {
  description = "The size of the boot disk in GB attached to this instance, up to a maximum of 64000 GB (64 TB)."
  type        = number
  default     = null
}

variable "data_disk_type" {
  description = "Possible disk types for notebook instances. "
  type        = string
  default     = null
}

variable "data_disk_size_gb" {
  description = "The size of the data disk in GB attached to this instance, up to a maximum of 64000 GB (64 TB)."
  type        = number
  default     = null
}

variable "no_remove_data_disk" {
  description = "If true, the data disk will not be auto deleted when deleting the instance."
  type        = bool
  default     = null
}

variable "disk_encryption" {
  description = "Disk encryption method used on the boot and data disks, defaults to GMEK. "
  type        = string
  default     = null
}

variable "kms_key" {
  description = "The KMS key used to encrypt the disks, only applicable if diskEncryption is CMEK."
  type        = string
  default     = null
}

variable "no_public_ip" {
  description = "No public IP will be assigned to this instance"
  type        = bool
  default     = null
}

variable "no_proxy_access" {
  description = "The notebook instance will not register with the proxy."
  type        = bool
  default     = null
}

variable "network" {
  description = "The name of the VPC that this instance is in."
  type        = string
  default     = null
}

variable "subnet" {
  description = "The name of the subnet that this instance is in."
  type        = string
  default     = null
}

variable "labels" {
  description = "Labels to apply to this instance."
  type        = map(string)
  default     = {}
}

variable "tags" {
  description = "The Compute Engine tags to add to instance."
  type        = list(string)
  default     = []
}

variable "metadata" {
  description = "Custom metadata to apply to this instance."
  type        = map(string)
  default     = {}
}

variable "vm_image" {
  description = "Use a Compute Engine VM image to start the notebook instance."
  type = object({
    project      = string
    image_family = optional(string)
    image_name   = optional(string)
  })
  default = null
}

variable "container_image" {
  description = "Use a container image to start the notebook instance."
  type = object({
    repository = string
    tag        = optional(string, "latest")
  })
  default = null
}

variable "accelerator_config" {
  description = "The hardware accelerator used on this instance. If you use accelerators, make sure that your configuration has enough vCPUs and memory to support the machineType you have selected."
  type = object({
    type       = string
    core_count = string
  })
  default = null
}

variable "shielded_instance_config" {
  description = "A set of Shielded Instance options."
  type = object({
    enable_integrity_monitoring = optional(bool)
    enable_secure_boot          = optional(bool)
    enable_vtpm                 = optional(bool)
  })
  default = null
}

variable "reservation_affinity" {
  description = "Reservation Affinity for consuming Zonal reservation."
  type = object({
    consume_reservation_type = string
    key                      = optional(string)
    values                   = optional(string)
  })
  default = null
}