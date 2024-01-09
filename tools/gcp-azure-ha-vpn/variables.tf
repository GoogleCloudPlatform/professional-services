/**
 * Copyright 2023 Google LLC
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


# Azure variables
variable "azure_resource_group" {
  description = "Azure Resource Group"
  type        = string
}

variable "azure_region" {
  description = "Azure Region"
  type        = string
}

variable "azure_vnet_name" {
  description = "Azure Virtual Network Name"
  type        = string
}

variable "azure_bgp_asn" {
  description = "The Azure BGP ASN"
  type        = string
  default     = "65515"
}

variable "azure_vpn_allowed_az_skus" {
  description = "List of allowed SKU values"
  type        = list(string)
  default     = ["VpnGw1AZ", "VpnGw2AZ", "VpnGw3AZ", "VpnGw4AZ", "VpnGw5AZ"]
}

variable "azure_vpn_sku" {
  type        = string
  default     = "VpnGw1"
  description = "The Azure VPN Sku/Size"
}

variable "azure_subscription_id" {
  type        = string
  description = "The Azure Subscription ID"

}

# GCP variables
variable "gcp_project_id" {
  description = "The GCP project ID."
  type        = string
}

variable "gcp_region" {
  description = "The GCP region."
  type        = string
}

variable "gcp_vpc_name" {
  description = "The GCP VPC name."
  type        = string
}

variable "gcp_router_name" {
  description = "The GCP VPN router name."
  type        = string
}

variable "gcp_bgp_asn" {
  description = "The GCP VPC Router ASN"
  type        = string
  default     = "65534"
}

# Shared secret
variable "shared_secret" {
  description = "The shared secret for the VPN connection."
  type        = string
  sensitive   = true
}