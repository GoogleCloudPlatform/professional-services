#!/bin/bash
# Configuration template file - copy to config.sh and modify as needed

# Basic configuration (REQUIRED)
export PROJECT_ID="your-project-id"
export REGION="us-central1"
export ZONE="us-central1-a"
export INDEX_DIMENSIONS=768
# DEPLOYMENT_ID: Unique identifier for the resources deployed in this run
# Format: [a-z][-a-z0-9]* (must start with an alphabet, can contain lowercase alphabets, numbers and hyphen)
# Deployment ID length must be shorter than or equal to 15 characters.
export DEPLOYMENT_ID="identifier-for-deployed-resources"

# Endpoint access configuration (REQUIRED)
export ENDPOINT_ACCESS_TYPE="public"  # Options: "public", "private_service_connect", "vpc_peering"

# Index source configuration (REQUIRED - choose ONE option)
# Option 1: Use existing index (uncomment and set value)
# export VECTOR_SEARCH_INDEX_ID=""  # e.g. "projects/${PROJECT_ID}/locations/${REGION}/indexes/4705835000090591232"

# Option 2: Create new index (leave VECTOR_SEARCH_INDEX_ID commented out to use these)
export BUCKET_NAME="your-embedding-bucket"
export EMBEDDING_PATH="your-embedding-folder"

# Sparse embedding configuration (uncomment and set for hybrid/blended search)
# export SPARSE_EMBEDDING_NUM_DIMENSIONS=1000      # Set to a positive value for sparse embeddings
# export SPARSE_EMBEDDING_NUM_DIMENSIONS_WITH_VALUES=20  # Number of non-zero values

# Deployed Index configuration settings
export DEPLOYED_INDEX_RESOURCE_TYPE="dedicated"  # Options: "automatic", "dedicated"
export DEPLOYED_INDEX_DEDICATED_MACHINE_TYPE="e2-standard-16"  # Machine type for dedicated deployments

# OPTIONAL CONFIGURATIONS
# You can uncomment and set any of the following for more detailed configuration

# Vector Search Index configuration settings
# export INDEX_DISPLAY_NAME="my-vector-search-index"
# export INDEX_DESCRIPTION="Vector search index for embeddings"
# export INDEX_LABELS='{ "environment": "dev", "purpose": "benchmarking" }'
# export INDEX_APPROXIMATE_NEIGHBORS_COUNT=150
# export INDEX_DISTANCE_MEASURE_TYPE="DOT_PRODUCT_DISTANCE"  # Options: "COSINE_DISTANCE", "EUCLIDEAN_DISTANCE", "DOT_PRODUCT_DISTANCE"
# export FEATURE_NORM_TYPE="UNIT_L2_NORM"  # Options: "NONE", "UNIT_L2_NORM"
# export INDEX_ALGORITHM_CONFIG_TYPE="TREE_AH_ALGORITHM"  # Options: "TREE_AH_ALGORITHM", "BRUTE_FORCE_ALGORITHM"
# export INDEX_TREE_AH_LEAF_NODE_EMBEDDING_COUNT=1000
# export INDEX_TREE_AH_LEAF_NODES_TO_SEARCH_PERCENT=10
# export INDEX_UPDATE_METHOD="BATCH_UPDATE"  # Options: "BATCH_UPDATE", "STREAM_UPDATE"

# Endpoint configuration settings
# export ENDPOINT_DISPLAY_NAME="my-vector-search-endpoint"
# export ENDPOINT_DESCRIPTION="Vector search endpoint for querying"
# export ENDPOINT_LABELS='{ "environment": "dev", "purpose": "benchmarking" }'
# export ENDPOINT_NETWORK="projects/your-project/global/networks/your-vpc"
# export ENDPOINT_CREATE_TIMEOUT="60m"
# export ENDPOINT_UPDATE_TIMEOUT="60m"
# export ENDPOINT_DELETE_TIMEOUT="60m"

# Deployed Index configuration settings
# export DEPLOYED_INDEX_ID="my-deployed-index"
# export DEPLOYED_INDEX_DEDICATED_MIN_REPLICAS=2
# export DEPLOYED_INDEX_DEDICATED_MAX_REPLICAS=5
# export DEPLOYED_INDEX_AUTOMATIC_MIN_REPLICAS=2
# export DEPLOYED_INDEX_AUTOMATIC_MAX_REPLICAS=5
# export DEPLOYED_INDEX_RESERVED_IP_RANGES='["ip-range-name-1", "ip-range-name-2"]'
# export DEPLOYED_INDEX_CREATE_TIMEOUT="60m"
# export DEPLOYED_INDEX_UPDATE_TIMEOUT="60m"
# export DEPLOYED_INDEX_DELETE_TIMEOUT="60m"

# GKE and PSC Network Configuration (only needed when ENDPOINT_ACCESS_TYPE="private_service_connect")
# export VPC_NETWORK_NAME="vertex-psc-network"     # Network name to use for PSC
# export SUBNETWORK=""                             # Format: projects/{project}/regions/{region}/subnetworks/{subnetwork}
# export MASTER_IPV4_CIDR_BLOCK="172.16.0.0/28"    # IP range for GKE master -- Change from 172.16.0.0/28 to the next /28 block when deploying a second GKE Instance
# export GKE_POD_SUBNET_RANGE="10.4.0.0/14"        # IP range for GKE pods
# export GKE_SERVICE_SUBNET_RANGE="10.0.32.0/20"   # IP range for GKE services

# VPC Peering configuration (required for ENDPOINT_ACCESS_TYPE="vpc_peering")
# Name for the reserved peering range
# export PEERING_RANGE_NAME="vs-peering-range"

# Prefix length for the reserved peering range (16=/16 CIDR, 20=/20 CIDR, etc.)
# export PEERING_PREFIX_LENGTH="16"

# Locust worker scaling configuration
# export MIN_REPLICAS_WORKER=10  # Minimum number of Locust worker replicas (default: 10)