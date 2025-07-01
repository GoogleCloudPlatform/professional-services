/**
 * Copyright 2025 Google LLC
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

variable "project_id" {
  type        = string
  description = "GCP project id"
}

variable "cluster_name" {
  type        = string
  description = "GKE Cluster name"
}

variable "org_id" {
  type        = string
  description = "GCP Organization Id"
}

variable "suffix" {
  type        = string
  description = "Give a unique suffix to each resource created by this reference architecture. Some resource like KMS key ring. So you want to specify a unique suffix for these resources."
  default     = "01"
}

variable "machine_type" {
  type        = string
  description = "GKE node pool machine type"
  default     = "n2-standard-2"
}

variable "min_node_count" {
  type        = number
  description = "Minimum number of nodes in the node pool"
  default     = 1
}

variable "max_node_count" {
  type        = number
  description = "Maximum number of nodes in the node pool"
  default     = 1
}

variable "disk_type" {
  type        = string
  description = "GKE worker nodes boot disk type for node pool"
  default     = "hyperdisk-balanced"
}

variable "disk_size" {
  type        = number
  description = "GKE worker nodes boot disk size in GB for node pool"
  default     = 100
}

variable "region" {
  type        = string
  description = "GCP region for the regional GKE cluster"
  default     = "us-central1"
}

variable "zones" {
  type        = list(string)
  description = "Node Locations zone"
  default     = ["us-central1-a", "us-central1-b"]
}

variable "release_channel" {
  type        = string
  description = "GKE Version release channel. https://registry.terraform.io/providers/hashicorp/google/latest/docs/resources/container_cluster#nested_release_channel"
  default     = "REGULAR"
}

variable "network_project_id" {
  type        = string
  description = "name of VPC project (could be shared VPC from another project)"
}

variable "network" {
  type        = string
  description = "Name of the VPC network"
}

variable "subnetwork" {
  type        = string
  description = "Name of VPC subnet"
}

variable "ip_range_pods" {
  type        = string
  description = "Secondary CIDR range name for POD networking"
  default     = null
}

variable "ip_range_services" {
  type        = string
  description = "Secondary CIDR range name for Service networking"
  default     = null
}

variable "worker_service_account" {
  type        = string
  description = "GKE Workers service account email"
}

variable "kms_rotation_period" {
  type        = string
  description = "Key Rotation Period for KMS"
  default     = "7776000s"
}

variable "wait_duration" {
  type        = string
  description = "Delay the creation of the Cluster after all iam binding and CA pool creation. Sometimes IAM binding takes time and cluster creation can fail in the first run. If you notice the ermission 'privateca.caPools.get' denied on 'projects/PROJECT_ID/locations/REGION/caPools/NAME' in the logs, likely to increase this timeout. "
  default     = "10m"
}

variable "root_ca_certs_maximum_lifetime" {
  type        = string
  description = "The maximum lifetime allowed for issued Certificates. Default to 1 Year. Note that if the issuing CertificateAuthority expires before a Certificate's requested maximumLifetime, the effective lifetime will be explicitly truncated to match it"
  default     = "31536000s" # 1 year
}

variable "root_ca_lifetime" {
  type        = string
  description = "Root Certificate Authority lifetime in seconds. Once this timeline is reached, your cluster can become unrecoverable. In that case we must follow https://cloud.google.com/kubernetes-engine/docs/how-to/credential-rotation. Recommendation is to perform root ca rotation at least 1 month before the expiry"
  default     = "315360000s" # 10 Years
}

variable "oauth_scopes" {
  type        = list(string)
  description = "GKE Worker nodes oauth scopes"
  default = [
    "https://www.googleapis.com/auth/cloud-platform"
  ]
}

variable "tags" {
  type        = list(string)
  description = "Network tags for GKE worker nodes"
  default     = []
}
