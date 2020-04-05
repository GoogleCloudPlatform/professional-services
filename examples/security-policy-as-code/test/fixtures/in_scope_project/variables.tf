variable "project_id" {}
variable "region" {
  default = "us-central1"
}
variable "mgmt_subnet_cidr" {
  default = "10.10.1.0/24"
}
variable "in_scope_subnet_cidr" {
  default = "10.10.10.0/24"
}
variable "out_of_scope_subnet_cidr" {
  default = "10.10.20.0/24"
}
variable "cluster_location" {
  default = "us-central1-a"
}
variable "node_locations" {
  default = ["us-central1-b"]
}
variable "gke_minimum_version" {
  default = "1.14.10-gke.27"
}
