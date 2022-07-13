# GCP Vars

variable "gcp_network" {
  description = "gcp VPC network name."
  type        = string
}

variable "gcp_bgp" {
  description = "gcp router bgp ASN"
  default     = "65273"
}

variable "gcp_project_id" {
  description = "gcp project ID."
  type        = string
}

variable "gcp_region" {
  description = "gcp region."
  type        = string
}

# AWS Vars

variable "aws_vpc_id" {
  description = "aws VPC ID."
  type        = string
}

variable "aws_region" {
  description = "aws region."
  type        = string
}

variable "aws_route_table_id" {
  description = "aws route table ID."
  type        = string
  default     = ""
}
