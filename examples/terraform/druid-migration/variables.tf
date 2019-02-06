variable project {
  description = "Project in which resources should be created."
  default     = "<project_id>"
}

variable region {
  description = "Region in which following resources should be created."
  default     = "us-central1"
}

variable zone {
  description = "Zone in the region for the resources to be created."
  default     = "us-central1-a"
}

variable bucket_name {
  description = "Name for the bucket to be created, it will be used for storing the initialization script, dataproc logs and hadoop configuration files."
  default     = "<bucket_name>"
}

variable dataproc_cluster_name {
  description = "Cluster name for dataproc."
  default     = "<dataproc_cluster_name>"
}

variable cloud_sql_instance_name {
  description = "Name of the CloudSQL resource to be created."
  default     = "<sql_instance_name>"
}

variable historical_node_count {
  description = "Number of Historical node to be created."
  default     = 2
}

variable middlemanager_node_count {
  description = "Number of Middlemanager node to be created."
  default     = 1
}

variable coordinator_node_count {
  description = "Number of Cordinator node of druid to be created."
  default     = 1
}

variable broker_node_count {
  description = "Number of Broker node of druid to be created."
  default     = 2
}

variable overlord_node_count {
  description = "Number of Overlord node of druid to be created."
  default     = 1
}

variable router_node_count {
  description = "Number of Overlord node of druid to be created."
  default     = 1
}

variable historical_node_name {
  description = "Name of the Historical node"
  default     = "<historical_name>"
}

variable router_node_name {
  description = "Name of the Historical node"
  default     = "<router_node_name>"
}

variable middlemanager_node_name {
  description = "Name of the Middlemanager node"
  default     = "<middlemanager_node_name>"
}

variable broker_node_name {
  description = "Name of the Broker node"
  default     = "<broker_node_name>"
}

variable coordinator_node_name {
  description = "Name of the Coordinator node"
  default     = "<coordinator_node_name>"
}

variable overlord_node_name {
  description = "Name of the Overlord node"
  default     = "<overlord_node_name>"
}

variable zookeeper_name {
  description = "Name for zookeeper nodes"
  default     = "<zookeeper_node>"
}

variable zookeeper_machine_type {
  description = "Zookeeper cluster machine type."
  default     = "n1-standard-1"
}

variable kafka_machine_type {
  description = "Kafka cluster machine type."
  default     = "n1-standard-1"
}

variable zookeeper_disk {
  description = "Zookeeper Operating System."
  default     = "ubuntu-os-cloud/ubuntu-1604-lts"
}

variable kafka_name {
  description = "Name for kafka nodes"
  default     = "<kafka_node_name>"
}

variable kafka_disk {
  description = "Kafka Operating System."
  default     = "ubuntu-os-cloud/ubuntu-1604-lts"
}

variable zookeeper_ip_list {
  description = "This variable is used internally for storing the list of Zookeeper clusters IP Address"
  type        = "list"
  default     = ["iplist", "zookeeper", "kafka"]
}

variable zookeeper_ip_ls {
  description = "This variable is used for Kafka to store zookeeper clusters IP address"
  type        = "list"
  default     = ["iplist", "zookeeper", "kafka"]
}

variable dataproc_master_count {
  description = "Number of dataproc master node to be created."
  default     = 1
}

variable dataproc_master_machine_type {
  description = "Machine type for dataproc master node."
  default     = "n1-standard-8"
}

variable dataproc_master_boot_disk_size_gb {
  description = "Size of the disk for dataproc master node."
  default     = 200
}

variable dataproc_worker_count {
  description = "Number of dataproc worker node to be created."
  default     = 6
}

variable dataproc_worker_machine_type {
  description = "Machine type for dataproc worker node."
  default     = "n1-standard-32"
}

variable dataproc_worker_boot_disk_size_gb {
  description = "Size of the disk for dataproc worker node."
  default     = 500
}

variable mod_startup_script {
  description = "This variable is used internally."
  default     = "default"
}

variable druid_historical_disk_size {
  description = "Disk size for Druid Historical node."
  default     = 200
}

variable druid_middlemanager_disk_size {
  description = "Disk size for Druid Middlemanager node."
  default     = 200
}

variable druid_coordinator_disk_size {
  description = "Disk size for Druid Coordinator node."
  default     = 200
}

variable druid_broker_disk_size {
  description = "Disk size for Druid Broker node."
  default     = 200
}

variable druid_overlord_disk_size {
  description = "Disk size for Druid Overlord node."
  default     = 200
}

variable druid_router_disk_size {
  description = "Disk size for Druid Overlord node."
  default     = 200
}

variable druid_historical_machine_type {
  description = "Machine type for Druid Historical node."
  default     = "n1-standard-8"
}

variable druid_historical_disk {
  description = "Operating System for Druid Historical node."
  default     = "ubuntu-os-cloud/ubuntu-1604-lts"
}

variable druid_middlemanager_machine_type {
  description = "Machine type for Druid Middlemanager node."
  default     = "n1-standard-8"
}

variable druid_middlemanager_disk {
  description = "Operating System for Druid Middlemanager node."
  default     = "ubuntu-os-cloud/ubuntu-1604-lts"
}

variable druid_router_machine_type {
  description = "Machine type for Druid Router node."
  default     = "n1-standard-8"
}

variable druid_router_disk {
  description = "Operating System for Druid Router node."
  default     = "ubuntu-os-cloud/ubuntu-1604-lts"
}

variable druid_broker_machine_type {
  description = "Machine type for Druid Broker node."
  default     = "n1-standard-8"
}

variable druid_broker_disk {
  description = "Operating System for Druid Broker node."
  default     = "ubuntu-os-cloud/ubuntu-1604-lts"
}

variable druid_coordinator_machine_type {
  description = "Machine type for Druid Coordinator node."
  default     = "n1-standard-2"
}

variable druid_coordinator_disk {
  description = "Operating System for Druid Coordinator node."
  default     = "ubuntu-os-cloud/ubuntu-1604-lts"
}

variable druid_overlord_machine_type {
  description = "Machine type for Druid Overlord node."
  default     = "n1-standard-2"
}

variable druid_overlord_disk {
  description = "Operating System for Druid Overlord node."
  default     = "ubuntu-os-cloud/ubuntu-1604-lts"
}

variable database_version {
  description = "The version of of the database. For example, `MYSQL_5_6` or `POSTGRES_9_6`."
  default     = "MYSQL_5_7"
}

variable master_instance_name {
  description = "The name of the master instance to replicate"
  default     = "sql-master-instance-druid-0.13"
}

variable tier {
  description = "The machine tier (First Generation) or type (Second Generation). See this page for supported tiers and pricing: https://cloud.google.com/sql/pricing"
  default     = "db-f1-micro"
}

variable db_name {
  description = "Name of the default database to create"
  default     = "druid"
}

variable user_name {
  description = "The name of the default user"
  default     = "druid"
}

variable user_host {
  description = "The host for the default user"
  default     = "%"
}

variable activation_policy {
  description = "This specifies when the instance should be active. Can be either `ALWAYS`, `NEVER` or `ON_DEMAND`."
  default     = "ALWAYS"
}

variable disk_size {
  description = "Second generation only. The size of data disk, in GB. Size of a running instance cannot be reduced but can be increased."
  default     = 10
}

variable disk_type {
  description = "Second generation only. The type of data disk: `PD_SSD` or `PD_HDD`."
  default     = "PD_SSD"
}

variable druid_conf_path {
  description = "Path for configuration to be stored in all the druid nodes."
  default     = "/opt/druid/druid-0.13.0/conf/druid/_common/common.runtime.properties"
}

variable network {
  description = "VPC network to be used for cloudsql vpc peering."
  default     = "default"
}

variable private_ip_name {
  description = "VPC private network name to be created for cloudsql vpc peering."
  default     = "druid-private-network"
}
