variable "organization_id" {
  description = "Organisation which should be scanned"
}

variable "region" {
  default = "europe-west1"
}

variable "artifact_registry_location" {
  default = "europe"
}


variable "container_version" {
  default = "3"
}

variable "project_id" {
}
