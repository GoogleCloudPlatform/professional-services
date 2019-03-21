variable "project" {
  description = "Project ID for your history cluster"
}

variable "history-server" {
  description = "Cluster ID for the Spark / YARN history server"
}

variable "history-region" {
  description = "GCP Compute Region for your history server and bucket"
  default     = "us-central1"
}

variable "history-bucket" {
  description = "The bucket name for your YARN logs and Spark event logs"
}

variable "network" {
  description = "The network to create that your hadoop clusters should use"
}

variable "data-eng-cidr-range" {
  description = "CIDR range for the IPs that should be able to access the hadoop admin UIs. This should be a range of IPs owned by your organization."
}

variable "hadoop-cidr-range" {
  description = "CIDR range for the hadooop subnetwork."
}

variable "hadoop-subnet" {
  description = "Name for hadoop subnetwork"
}
