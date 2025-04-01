variable "project_id" {
  type        = string
  description = "GCP Project ID"
  # No default - must be provided - User must set this
}

variable "project_number" {
  type        = number
  description = "Your numerical Google Cloud project number. Can be found by running `gcloud projects describe <project_id>` command."
  # No default - user MUST provide their Google Cloud project number by running the command mentioned in the description.
}

variable "region" {
  type        = string
  description = "GCP Region for Vertex Search"
  default     = "us-central1" # Default region, can be overridden
}

# -----------------------------------------------------------------------------
# Cloud Storage Bucket Variables (Existing Bucket - User Provided)
# -----------------------------------------------------------------------------
variable "existing_bucket_name" {
  type        = string
  description = "Name of the EXISTING Cloud Storage bucket containing index data"
  default     = ""
}

variable "embedding_data_path" {
  type        = string
  description = "Path WITHIN the existing Cloud Storage bucket where index data is located"
  default     = ""
}

# -----------------------------------------------------------------------------
# Vertex AI Index Variables
# -----------------------------------------------------------------------------
variable "index_display_name" {
  type        = string
  description = "Display name for the Vector Index"
  default     = "load-testing-search-index" # Default display name, can be customized
}

variable "index_description" {
  type        = string
  description = "Description for the Vector Index"
  default     = "A Vector Index for load testing" # Default description
}

variable "vector_search_index_id" {
  type        = string
  description = "ID of an existing Vertex AI Index. If provided, a new index will not be created."
  default     = null
}

variable "index_labels" {
  type        = map(string)
  description = "Labels for the Vector Index"
  default     = { purpose = "load-testing" }
}

variable "index_dimensions" {
  type        = number
  description = "Number of dimensions for the vectors in the index"
  default     = 768 # Example default dimension
}

variable "index_approximate_neighbors_count" {
  type        = number
  description = "Approximate neighbors count for indexing.  A good default is often between 100 and 1000, depending on your data and accuracy/speed trade-offs."
  default     = 150
}

variable "index_distance_measure_type" {
  type        = string
  description = "Distance measure type (DOT_PRODUCT_DISTANCE, COSINE_DISTANCE, L2_SQUARED_DISTANCE)"
  default     = "COSINE_DISTANCE"
  validation {
    condition     = contains(["DOT_PRODUCT_DISTANCE", "COSINE_DISTANCE", "L2_SQUARED_DISTANCE"], var.index_distance_measure_type)
    error_message = "Invalid value for index_distance_measure_type. Must be one of: DOT_PRODUCT_DISTANCE, COSINE_DISTANCE, L2_SQUARED_DISTANCE."
  }
}

variable "index_shard_size" {
  type        = string
  description = "Shard size for the Vector Search index (SHARD_SIZE_SMALL, SHARD_SIZE_MEDIUM, SHARD_SIZE_LARGE)"
  default     = "SHARD_SIZE_MEDIUM"
  validation {
    condition     = contains(["SHARD_SIZE_SMALL", "SHARD_SIZE_MEDIUM", "SHARD_SIZE_LARGE"], var.index_shard_size)
    error_message = "Invalid value for shard_size. Must be one of: SHARD_SIZE_SMALL, SHARD_SIZE_MEDIUM, SHARD_SIZE_LARGE."
  }
}

variable "feature_norm_type" {
  type        = string
  description = "Type of normalization to be carried out on each vector. Can be UNIT_L2_NORM or NONE"
  default     = "UNIT_L2_NORM"
}

variable "index_algorithm_config_type" {
  type        = string
  description = "Algorithm config type for the index (tree_ah_config, brute_force_config)"
  default     = "tree_ah_config"
  validation {
    condition     = contains(["tree_ah_config", "brute_force_config"], var.index_algorithm_config_type)
    error_message = "Invalid value for index_algorithm_config_type. Must be one of: tree_ah_config, brute_force_config."
  }
}

variable "index_tree_ah_leaf_node_embedding_count" {
  type        = number
  description = "Leaf node embedding count for tree-AH algorithm"
  default     = 1000
  nullable    = false # This parameter is required when using tree_ah_config
}

variable "index_tree_ah_leaf_nodes_to_search_percent" {
  type        = number
  description = "Leaf nodes to search percent for tree-AH algorithm"
  default     = 10
  nullable    = false # This parameter is required when using tree_ah_config
}

variable "index_update_method" {
  type        = string
  description = "Index update method (BATCH_UPDATE, STREAM_UPDATE)"
  default     = "BATCH_UPDATE"
  validation {
    condition     = contains(["BATCH_UPDATE", "STREAM_UPDATE"], var.index_update_method)
    error_message = "Invalid value for index_update_method. Must be one of: BATCH_UPDATE, STREAM_UPDATE."
  }
}

variable "index_create_timeout" {
  type        = string
  description = "Timeout duration for index creation."
  default     = "6h"
}

variable "index_update_timeout" {
  type        = string
  description = "Timeout duration for index updates."
  default     = "1h"
}

variable "index_delete_timeout" {
  type        = string
  description = "Timeout duration for index deletion."
  default     = "2h"
}

# -----------------------------------------------------------------------------
# Network Configuration (CONSOLIDATED)
# -----------------------------------------------------------------------------
variable "network_configuration" {
  type = object({
    # Network settings
    network_name = optional(string, "default") # Just the name, not the full path

    # Subnetwork settings (only needed for PSC/private endpoints)
    subnetwork = optional(string, "") # Full path to subnetwork if needed

    # GKE cluster network configuration
    master_ipv4_cidr_block = optional(string, "172.16.0.0/28")
    pod_subnet_range       = optional(string, "10.4.0.0/14")
    service_subnet_range   = optional(string, "10.0.32.0/20")
  })
  description = "Network configuration for the deployment"
  default     = {}
}

# -----------------------------------------------------------------------------
# Endpoint Access Configuration (CONSOLIDATED)
# -----------------------------------------------------------------------------
variable "endpoint_access" {
  type = object({
    # Main access type setting (simplified from the previous two booleans)
    type = string # "public", "vpc_peering", or "private_service_connect"

    # Settings for private service connect (only used when type = "private_service_connect")
    use_private_endpoint = optional(bool, true) # Whether to use private IP for GKE master
  })
  description = "Access configuration for the Vector Search endpoint"
  default = {
    type = "public"
  }
  validation {
    condition     = contains(["public", "vpc_peering", "private_service_connect"], var.endpoint_access.type)
    error_message = "endpoint_access.type must be one of: 'public', 'vpc_peering', or 'private_service_connect'."
  }
}

# VPC Peering Variables
variable "peering_range_name" {
  description = "Name for the reserved IP range for VPC peering"
  type        = string
  default     = "vs-peering-range"
}

variable "peering_prefix_length" {
  description = "Prefix length for the reserved IP range (e.g., 16 for /16 CIDR block)"
  type        = number
  default     = 16
}

# For backwards compatibility - these will be derived from the above
locals {
  # Convert to the old variable formats for use in modules that haven't been updated
  endpoint_network = var.network_configuration.network_name != "" ? (
    "projects/${var.project_number}/global/networks/${var.network_configuration.network_name}"
  ) : "projects/${var.project_number}/global/networks/default"

  endpoint_public_endpoint_enabled        = var.endpoint_access.type == "public"
  endpoint_enable_private_service_connect = var.endpoint_access.type == "private_service_connect"
  enable_vpc_peering                      = var.endpoint_access.type == "vpc_peering"

  # Only use subnetwork when it's specifically set and compatible with the network
  subnetwork = var.network_configuration.subnetwork

  # GKE-specific settings derived from our new variables
  use_private_endpoint = var.endpoint_access.type == "private_service_connect" ? (
    var.endpoint_access.use_private_endpoint
  ) : false

  # These are just direct pass-throughs
  master_ipv4_cidr_block   = var.network_configuration.master_ipv4_cidr_block
  gke_pod_subnet_range     = var.network_configuration.pod_subnet_range
  gke_service_subnet_range = var.network_configuration.service_subnet_range
}

# -----------------------------------------------------------------------------
# LEGACY Endpoint Variables (FOR BACKWARD COMPATIBILITY)
# -----------------------------------------------------------------------------
# These are kept for backward compatibility but are no longer used directly
# See the consolidated endpoint_access variable above

variable "endpoint_display_name" {
  type        = string
  description = "Display name for the Index Endpoint."
  default     = "load-testing-endpoint"
}

variable "endpoint_description" {
  type        = string
  description = "Description for the Index Endpoint."
  default     = "Endpoint for Vector Search load testing"
}

variable "endpoint_labels" {
  type        = map(string)
  description = "Labels for the Index Endpoint."
  default     = { purpose = "load-testing" }
}

variable "endpoint_public_endpoint_enabled" {
  type        = bool
  description = "[DEPRECATED] Use endpoint_access.type instead. Enable/disable public endpoint for the Index Endpoint."
  default     = true # Default to public endpoint
}

variable "endpoint_network" {
  type        = string
  description = "[DEPRECATED] Use network_configuration.network_name instead. The full name of the Google Compute Engine network (for VPC Peering)."
  default     = null
}

variable "endpoint_enable_private_service_connect" {
  type        = bool
  description = "[DEPRECATED] Use endpoint_access.type instead. Enable Private Service Connect (PSC) for the Index Endpoint."
  default     = false # Default to no PSC
}

variable "vpc_network_name" {
  type        = string
  description = "[DEPRECATED] Use network_configuration.network_name instead. The name of the network to use for PSC."
  default     = "vertex-psc-network"
}

variable "endpoint_create_timeout" {
  type        = string
  description = "Timeout duration for endpoint creation."
  default     = "30m"
}

variable "endpoint_update_timeout" {
  type        = string
  description = "Timeout duration for endpoint updates."
  default     = "30m"
}

variable "endpoint_delete_timeout" {
  type        = string
  description = "Timeout duration for endpoint deletion."
  default     = "30m"
}

# -----------------------------------------------------------------------------
# LEGACY GKE Network Variables (FOR BACKWARD COMPATIBILITY)
# -----------------------------------------------------------------------------
# These are kept for backward compatibility but are no longer used directly
# See the consolidated network_configuration variable above

variable "subnetwork" {
  type        = string
  description = "[DEPRECATED] Use network_configuration.subnetwork instead. The subnetwork to host the GKE cluster in."
  default     = ""
}

variable "use_private_endpoint" {
  type        = bool
  description = "[DEPRECATED] Use endpoint_access.use_private_endpoint instead. Whether the master's internal IP address is used as the cluster endpoint."
  default     = false
}

variable "master_ipv4_cidr_block" {
  type        = string
  description = "[DEPRECATED] Use network_configuration.master_ipv4_cidr_block instead. The IP range in CIDR notation for the hosted master network."
  default     = "172.16.0.0/28"
}

variable "gke_pod_subnet_range" {
  type        = string
  description = "[DEPRECATED] Use network_configuration.pod_subnet_range instead. IP address range for GKE pods in CIDR notation."
  default     = "10.4.0.0/14"
}

variable "gke_service_subnet_range" {
  type        = string
  description = "[DEPRECATED] Use network_configuration.service_subnet_range instead. IP address range for GKE services in CIDR notation."
  default     = "10.0.32.0/20"
}

# -----------------------------------------------------------------------------
# Deployed Index Variables
# -----------------------------------------------------------------------------
variable "deployed_index_id" {
  type        = string
  description = "User-defined ID for the Deployed Index."
  default     = "load_testing_deployed_index"
}

variable "deployed_index_resource_type" {
  type        = string
  description = "Resource allocation type: 'dedicated' or 'automatic'."
  default     = "dedicated"
  validation {
    condition     = contains(["dedicated", "automatic"], var.deployed_index_resource_type)
    error_message = "Invalid value for deployed_index_resource_type. Must be 'dedicated' or 'automatic'."
  }
}

# Dedicated Resources
variable "deployed_index_dedicated_machine_type" {
  type        = string
  description = "Machine type for dedicated resources."
  default     = null
}

variable "deployed_index_dedicated_min_replicas" {
  type        = number
  description = "Minimum number of replicas for dedicated resources."
  default     = 1
}

variable "deployed_index_dedicated_max_replicas" {
  type        = number
  description = "Maximum number of replicas for dedicated resources (for autoscaling)."
  default     = 3
}

# Automatic Resources
variable "deployed_index_automatic_min_replicas" {
  type        = number
  description = "Minimum number of replicas for automatic resources."
  default     = 1
}

variable "deployed_index_automatic_max_replicas" {
  type        = number
  description = "Maximum number of replicas for automatic resources."
  default     = 5
}

variable "deployed_index_reserved_ip_ranges" {
  type        = list(string)
  description = "(Optional) Reserved IP ranges for the deployed index (if using a private network)."
  default     = null
}

variable "deployed_index_create_timeout" {
  type        = string
  description = "Timeout duration for deployed index creation."
  default     = "2h"
}
variable "deployed_index_update_timeout" {
  type        = string
  description = "Timeout duration for deployed index updates."
  default     = "1h"
}
variable "deployed_index_delete_timeout" {
  type        = string
  description = "Timeout duration for deployed index deletion."
  default     = "2h"
}

# -----------------------------------------------------------------------------
# GKE Autopilot Variables
# -----------------------------------------------------------------------------
variable "image" {
  type        = string
  description = "Load testing image name."
  # No Default - User must provide the image for the locust load testing code.  
}

variable "deployment_id" {
  type        = string
  description = "Unique identifier for this deployment"
}

variable "min_replicas_worker" {
  description = "Minimum number of worker replicas for the Locust worker autoscaler"
  type        = number
  default     = 10
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