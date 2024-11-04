variable "project_id" {
  description = "The project ID to host the cluster in"
}

variable "cluster_name" {
  description = "GKE cluster name"
}

variable "zones" {
  type        = list(string)
  description = "The zone to host the cluster in (required if is a zonal cluster)"
}

variable "network_name" {
  description = "The VPC network to host the cluster in"
}

variable "location" {
  description = "Location for the keyring."
  type        = string
  default     = "global"
}

variable "keyring" {
  description = "Keyring name."
  type        = string
}

variable "keys" {
  description = "Key names."
  type        = list(string)
  default     = []
}

variable "gar_repo" {
  description = "Google Artifact Registry repository."
  type        = string
  default     = "gcs-proxy"
}
