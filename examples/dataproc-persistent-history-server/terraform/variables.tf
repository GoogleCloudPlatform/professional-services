variable "project" {
  description = "Project ID for your history cluster"
}

variable "history-bucket" {
  description = "The bucket name for your YARN logs and Spark event logs"
}

variable "history-server" {
  description = "Cluster ID for the Spark / YARN history server"
}

variable "long-running-cluster" {
  description = "Cluster ID for a long running dataproc cluster which will persist logs on gcs"
}

variable "history-region" {
  description = "GCP Compute Region for your history server and bucket"
}

variable "network" {
  description = "The network to create that your hadoop clusters should use"
}

variable "hadoop-subnet" {
  description = "Name for hadoop subnetwork"
}
