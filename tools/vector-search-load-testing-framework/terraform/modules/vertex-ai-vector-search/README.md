# Vertex AI Vector Search Terraform Module

This Terraform module deploys a complete Vertex AI Vector Search solution including Index, Index Endpoint, and Deployed Index on Google Cloud Platform (GCP). It supports various deployment scenarios including public endpoints, VPC peering, and Private Service Connect.

## Overview

This module creates and manages:

- **Vector Search Index**: Creates a new index from your embeddings or references an existing one
- **Index Endpoint**: Configures the access method (public, private VPC, or Private Service Connect)
- **Deployed Index**: Provisions compute resources (dedicated or automatic) to serve your vectors

## Module Structure

```
modules/vertex-ai-vector-search/
├── main.tf              # Resource definitions
├── variables.tf         # Input variables
└── outputs.tf           # Output values
```

## Usage

### Basic Usage

```hcl
module "vector_search" {
  source = "./modules/vertex-ai-vector-search"

  project_id           = "your-project-id"
  region               = "us-central1"
  # This refers to 'gs://your-embeddings-bucket/embeddings-folder'
  existing_bucket_name = "your-embeddings-bucket"
  embedding_data_path  = "embeddings-folder"
  index_dimensions     = 768
  
  # Use public endpoint by default
  endpoint_public_endpoint_enabled = true
  endpoint_enable_private_service_connect = false
  
  # Dedicated resources for predictable performance
  deployed_index_resource_type = "dedicated"
  deployed_index_dedicated_machine_type = "e2-standard-16"
  deployment_id = "my-deployment"
}
```

### Private Service Connect Usage

```hcl
module "vector_search" {
  source = "./modules/vertex-ai-vector-search"

  project_id           = "your-project-id"
  region               = "us-central1"
  existing_bucket_name = "your-embeddings-bucket"
  embedding_data_path  = "embeddings-folder"
  index_dimensions     = 1536
  
  # Configure for Private Service Connect
  endpoint_public_endpoint_enabled = false
  endpoint_enable_private_service_connect = true
  
  # Deployment details
  deployed_index_resource_type = "dedicated"
  deployed_index_dedicated_machine_type = "n1-standard-32"
  deployed_index_dedicated_min_replicas = 3
  deployed_index_dedicated_max_replicas = 10
  deployment_id = "psc-deployment"
}
```

## Input Variables

### Required Variables

| Variable | Description | Type | Default |
|----------|-------------|------|---------|
| `project_id` | GCP Project ID | string | - |
| `region` | GCP region for deployment | string | `"us-central1"` |
| `deployment_id` | Unique identifier for this deployment | string | - |

### Index Configuration

| Variable | Description | Type | Default |
|----------|-------------|------|---------|
| `vector_search_index_id` | Existing index ID (if using existing) | string | `null` |
| `existing_bucket_name` | GCS bucket containing embeddings | string | `""` |
| `embedding_data_path` | Path in bucket to embeddings | string | `""` |
| `index_dimensions` | Vector dimensions | number | `768` |
| `index_display_name` | Display name for the index | string | `"load-testing-search-index"` |
| `index_description` | Description for the index | string | `"A Vector Index for load testing"` |
| `index_shard_size` | Shard size for the index | string | `"SHARD_SIZE_MEDIUM"` |

### Index Algorithm Settings

| Variable | Description | Type | Default |
|----------|-------------|------|---------|
| `index_distance_measure_type` | Distance measure (COSINE, DOT_PRODUCT, etc.) | string | `"COSINE_DISTANCE"` |
| `index_approximate_neighbors_count` | Approximate neighbors count | number | `150` |
| `feature_norm_type` | Feature normalization type | string | `"UNIT_L2_NORM"` |
| `index_algorithm_config_type` | Algorithm config (tree_ah or brute_force) | string | `"tree_ah_config"` |
| `index_tree_ah_leaf_node_embedding_count` | Leaf node embedding count | number | `1000` |
| `index_tree_ah_leaf_nodes_to_search_percent` | Leaf nodes to search percent | number | `10` |

### Endpoint Configuration

| Variable | Description | Type | Default |
|----------|-------------|------|---------|
| `endpoint_display_name` | Display name for the endpoint | string | `"load-testing-endpoint"` |
| `endpoint_description` | Description for the endpoint | string | `"Endpoint for Vector Search load testing"` |
| `endpoint_public_endpoint_enabled` | Enable public endpoint | bool | `true` |
| `endpoint_enable_private_service_connect` | Enable Private Service Connect | bool | `false` |
| `endpoint_network` | Network name for VPC peering | string | `null` |

### Deployed Index Configuration

| Variable | Description | Type | Default |
|----------|-------------|------|---------|
| `deployed_index_id` | ID for the deployed index | string | `"load_testing_deployed_index"` |
| `deployed_index_resource_type` | Resource type (dedicated or automatic) | string | `"dedicated"` |
| `deployed_index_dedicated_machine_type` | Machine type for dedicated resources | string | `null` |
| `deployed_index_dedicated_min_replicas` | Minimum number of replicas | number | `1` |
| `deployed_index_dedicated_max_replicas` | Maximum number of replicas | number | `3` |
| `deployed_index_automatic_min_replicas` | Minimum replicas for automatic | number | `1` |
| `deployed_index_automatic_max_replicas` | Maximum replicas for automatic | number | `5` |
| `deployed_index_reserved_ip_ranges` | Reserved IP ranges for the deployed index | list(string) | `null` |

### Optional Authentication Configuration

| Variable | Description | Type | Default |
|----------|-------------|------|---------|
| `deployed_index_auth_enabled` | Enable authentication when access to the index is restricted to authorized users or services. By configuring the `deployed_index_auth_audiences` and `deployed_index_auth_allowed_issuers`, you can precisely control which JWT tokens are accepted by the index.
 | bool | `false` |
| `deployed_index_auth_audiences` | Authentication audiences | list(string) | `[]` |
| `deployed_index_auth_allowed_issuers` | Allowed JWT issuers | list(string) | `[]` |

### Timeout Configuration

| Variable | Description | Type | Default |
|----------|-------------|------|---------|
| `index_create_timeout` | Timeout for index creation | string | `"6h"` |
| `index_update_timeout` | Timeout for index updates | string | `"1h"` |
| `index_delete_timeout` | Timeout for index deletion | string | `"5h"` |
| `endpoint_create_timeout` | Timeout for endpoint creation | string | `"30m"` |
| `endpoint_update_timeout` | Timeout for endpoint updates | string | `"30m"` |
| `endpoint_delete_timeout` | Timeout for endpoint deletion | string | `"30m"` |
| `deployed_index_create_timeout` | Timeout for deployed index creation | string | `"4h"` |
| `deployed_index_update_timeout` | Timeout for deployed index updates | string | `"4h"` |
| `deployed_index_delete_timeout` | Timeout for deployed index deletion | string | `"4h"` |

## Outputs

| Output | Description |
|--------|-------------|
| `index_id` | The ID of the Vector Index |
| `endpoint_id` | The ID of the Index Endpoint |
| `deployed_index_id` | The ID of the deployed index |
| `public_endpoint_domain_name` | Public endpoint domain (if enabled) |
| `psc_enabled` | Whether PSC is enabled |
| `service_attachment` | Service attachment URI (for PSC) |
| `match_grpc_address` | gRPC address for match requests |
| `psc_automated_endpoints` | PSC automated endpoints information |

## Best Practices

### Resource Sizing Guidelines

#### Dedicated vs. Automatic Resources

- **Dedicated resources** provide consistent performance but at a fixed cost
- **Automatic resources** can scale to zero but may have cold start issues

For load testing or production workloads, dedicated resources are recommended:

```hcl
deployed_index_resource_type = "dedicated"
deployed_index_dedicated_machine_type = "e2-standard-16"
deployed_index_dedicated_min_replicas = 2
deployed_index_dedicated_max_replicas = 5
```

#### Machine Type Selection

| Workload Type | Recommended Machine Type |
|---------------|--------------------------|
| Small indexes (<100K vectors) | `e2-standard-8` |
| Medium indexes (100K-1M vectors) | `e2-standard-16` |
| Large indexes (1M-10M vectors) | `n1-standard-32` |
| Very large indexes (>10M vectors) | `n1-standard-64` |

### Performance Tuning

For search performance optimization:

```hcl
# For higher recall at the cost of performance
index_approximate_neighbors_count = 200
index_tree_ah_leaf_nodes_to_search_percent = 15

# For better performance with acceptable recall
index_approximate_neighbors_count = 100
index_tree_ah_leaf_nodes_to_search_percent = 5
```

### Metrics to Monitor

Once deployed, monitor these metrics for your Vector Search deployment:

- Query latency (P50, P90, P99)
- QPS (queries per second)
- CPU utilization
- Memory usage
- Error rates

## Common Issues and Troubleshooting

### Long Index Creation Times

Index creation can take several hours for large datasets. Use appropriate timeouts:

```hcl
index_create_timeout = "8h"
```

### PSC Connectivity Issues

For PSC connectivity problems, verify:
1. The service attachment is properly configured
2. Network firewall rules allow the connection
3. The client is in the same VPC as the PSC endpoint

### Index Deployment Failures

When deployment fails, check:
1. Available quota in your project
2. Index format compatibility
3. Resource availability in the selected region
