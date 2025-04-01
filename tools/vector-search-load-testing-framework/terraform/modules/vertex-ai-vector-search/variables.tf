# modules/vertex-ai-vector-search/variables.tf

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

variable "index_shard_size" {
  type        = string
  description = "Shard size for the Vector Search index (SHARD_SIZE_SMALL, SHARD_SIZE_MEDIUM, SHARD_SIZE_LARGE)"
  default     = "SHARD_SIZE_MEDIUM"
  validation {
    condition     = contains(["SHARD_SIZE_SMALL", "SHARD_SIZE_MEDIUM", "SHARD_SIZE_LARGE"], var.index_shard_size)
    error_message = "Invalid value for shard_size. Must be one of: SHARD_SIZE_SMALL, SHARD_SIZE_MEDIUM, SHARD_SIZE_LARGE."
  }
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
  default     = "5h"
}

# -----------------------------------------------------------------------------
# Vertex AI Index Endpoint Variables
# -----------------------------------------------------------------------------
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

# -----------------------------------------------------------------------------
# Endpoint Access Variables (New consolidated approach)
# -----------------------------------------------------------------------------
# These variables will be passed from the root module's local variables
variable "endpoint_public_endpoint_enabled" {
  type        = bool
  description = "Enable/disable public endpoint for the Index Endpoint."
  default     = true
}

variable "endpoint_network" {
  type        = string
  description = "The full name of the Google Compute Engine network (for VPC Peering)."
  default     = null
}

variable "subnetwork" {
  type        = string
  description = "The subnetwork to host the psc_address"
  default     = ""
}

variable "endpoint_create_timeout" {
  type        = string
  description = "Timeout duration for endpoint creation."
  default     = "6h"
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
  default     = "6h"
}
variable "deployed_index_update_timeout" {
  type        = string
  description = "Timeout duration for deployed index updates."
  default     = "4h"
}
variable "deployed_index_delete_timeout" {
  type        = string
  description = "Timeout duration for deployed index deletion."
  default     = "4h"
}

# -----------------------------------------------------------------------------
# Additional VPC Peering Variables 
# -----------------------------------------------------------------------------


variable "enable_vpc_peering" {
  type        = bool
  description = "Enable/disable VPC peering for the Index Endpoint."
  default     = true
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

# -----------------------------------------------------------------------------
# Additional PSC Variables 
# -----------------------------------------------------------------------------

variable "enable_private_service_connect" {
  type        = bool
  description = "Enable Private Service Connect (PSC) for the Index Endpoint."
  default     = false
}

variable "enable_access_logging" {
  description = "Whether to enable access logging for the private endpoint"
  type        = bool
  default     = true
}

variable "deployment_group" {
  description = "Deployment group for the index (optional, useful for multiple peering ranges)"
  type        = string
  default     = "default"
}

# Authentication config (optional)
variable "deployed_index_auth_enabled" {
  description = "Whether to enable authentication for the deployed index"
  type        = bool
  default     = false
}

variable "deployed_index_auth_audiences" {
  description = "List of JWT audiences that are allowed to access"
  type        = list(string)
  default     = []
}

variable "deployed_index_auth_allowed_issuers" {
  description = "List of allowed JWT issuers (service accounts in format: service-account-name@project-id.iam.gserviceaccount.com)"
  type        = list(string)
  default     = []
}

# Passed from the root
variable "project_id" {
  type        = string
  description = "The ID of the Google Cloud project where resources will be created."
}

variable "region" {
  type        = string
  description = "The Google Cloud region where resources will be created."
}

variable "deployment_id" {
  type        = string
  description = "Unique identifier for this deployment"
}