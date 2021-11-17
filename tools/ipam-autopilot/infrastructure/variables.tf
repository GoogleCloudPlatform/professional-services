variable "organization_id" {
  default = "203384149598"
  description = "Organisation which should be scanned"
}

variable "region" {
  default = "europe-west1"
}

variable "project_id" {
  default = "ipam-autopilot"
}

variable "deployment_sa" {
  default = "deployment@ipam-autopilot.iam.gserviceaccount.com"
}