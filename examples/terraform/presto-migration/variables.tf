variable project {
  description = "Project to be used by the resoruces"
}

variable region {
  description = "Region to be used by the resoruces"
  default     = "us-central1"
}

variable zone {
  description = "Zone to be used by the resoruces"
  default     = "us-central1-a"
}

variable bucket_name {
  description = "New bucket name for storing data"
}

variable cloud_sql_instance_name {
  description = "Name of the Cloud SQL instance to be created"
}

variable tier {
  description = "The machine tier (First Generation) or type (Second Generation). See this page for supported tiers and pricing: https://cloud.google.com/sql/pricing"
  default     = "db-f1-micro"
}

variable activation_policy {
  description = "This specifies when the instance should be active. Can be either `ALWAYS`, `NEVER` or `ON_DEMAND`."
  default     = "ALWAYS"
}

variable cloud_sql_disk_size {
  description = "Second generation only. The size of data disk, in GB. Size of a running instance cannot be reduced but can be increased."
  default     = 10
}

variable cloud_sql_disk_type {
  description = "Second generation only. The type of data disk: `PD_SSD` or `PD_HDD`."
  default     = "PD_SSD"
}

variable network {
  description = "VPC network to be used for resources"
  default     = "default"
}

variable private_ip_name {
  description = "VPC private network name to be created for Cloud SQL vpc peering."
  default     = "presto-private-network"
}

variable dataproc_cluster_name {
  description = "Dataproc cluster name"
}

variable dataproc_master_count {
  description = "Number of nodes for Dataproc master"
  default     = 1
}

variable dataproc_master_machine_type {
  description = "Dataproc master machine type"
  default     = "n1-standard-1"
}

variable dataproc_master_boot_disk_size_gb {
  description = "Dataproc master disk size"
  default     = 15
}

variable dataproc_worker_count {
  description = "Number of nodes for Dataproc worker"
  default     = 2
}

variable dataproc_worker_machine_type {
  description = "Dataproc worker machine type"
  default     = "n1-standard-1"
}

variable dataproc_worker_boot_disk_size_gb {
  description = "Dataproc worker disk size"
  default     = 15
}

variable presto_cluster_name {
  description = "Name of the Presto cluster"
}

variable presto_cluster_image {
  description = "Image used for Presto cluster machines"
  default     = "ubuntu-os-cloud/ubuntu-1604-lts"
}

variable presto_master_machine_type {
  description = "Presto master machine type"
  default     = "n1-standard-1"
}

variable presto_master_boot_disk_size_gb {
  description = "Presto master disk size"
  default     = 50
}

variable presto_worker_count {
  description = "Number of nodes for Presto worker"
  default     = 2
}

variable presto_worker_machine_type {
  description = "Presto worker machine type"
  default     = "n1-standard-1"
}

variable presto_worker_boot_disk_size_gb {
  description = "Presto worker disk size"
  default     = 50
}

variable dataproc_ip {
  description = "This variable is used internally to provide the IP address of dataproc master"
  default     = "default"
}
