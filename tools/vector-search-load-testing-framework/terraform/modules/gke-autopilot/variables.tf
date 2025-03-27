variable "project_id" {
  type        = string
  description = "The ID of the Google Cloud project where resources will be created."
}

variable "project_number" {
  type        = number
  description = "Your numerical Google Cloud project number. Can be found by running `gcloud projects describe <project_id>` command."
}

variable "region" {
  type        = string
  description = "The Google Cloud region where resources will be created."
  default     = "us-central1"
}

variable "image" {
  type        = string
  description = "Load testing image name."
}

variable "deployment_id" {
  type        = string
  description = "Unique identifier for this deployment"
}

variable "locust_test_type" {
  description = "The type of load test to run (http or grpc)"
  type        = string
  default     = "http"

  validation {
    condition     = contains(["http", "grpc"], var.locust_test_type)
    error_message = "The locust_test_type must be either 'http' or 'grpc'."
  }
}

variable "create_external_ip" {
  type        = bool
  description = "Whether to create an external IP address for the Locust UI"
  default     = false
}

# Network configuration variables
variable "network" {
  type        = string
  description = "The VPC network to host the GKE cluster in (format: projects/{project_number}/global/networks/{network})"
  default     = ""
}

variable "subnetwork" {
  type        = string
  description = "The full path to the subnetwork to host the GKE cluster in. Required when enable_private_networking is true."
  default     = ""
}

variable "use_private_endpoint" {
  type        = bool
  description = "Whether the master's internal IP address is used as the cluster endpoint"
  default     = false
}

variable "master_ipv4_cidr_block" {
  type        = string
  description = "The IP range in CIDR notation to use for the hosted master network"
  default     = "172.16.0.0/28"
}

variable "enable_private_networking" {
  type        = bool
  description = "Whether to configure the cluster for PSC access to Vector Search"
  default     = false
}

variable "gke_pod_subnet_range" {
  type        = string
  description = "IP address range for GKE pods in CIDR notation"
  default     = "10.4.0.0/14"
}

variable "gke_service_subnet_range" {
  type        = string
  description = "IP address range for GKE services in CIDR notation"
  default     = "10.0.32.0/20"
}

variable "min_replicas_worker" {
  description = "Minimum number of worker replicas for the Locust worker autoscaler"
  type        = number
  default     = 10
}