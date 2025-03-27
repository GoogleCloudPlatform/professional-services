# Vector Search Load Testing Framework

This framework enables distributed load testing for Vertex AI Vector Search endpoints using Locust running on Google Kubernetes Engine (GKE). The setup supports both public HTTP and private PSC/gRPC endpoint access methods.

## Overview

The framework provides a complete solution for testing Vector Search performance and scalability, including:

- Infrastructure setup via Terraform
- Simplified configuration management
- Automatic Vector Search index and endpoint deployment
- Distributed load testing with Locust
- Support for both HTTP and gRPC protocols
- Blended search (dense + sparse vectors) support

## Architecture

![Vector Search Load Testing Architecture](docs/architecture.png)

The framework deploys:
- Vector AI Search index, endpoint, and deployed index
- GKE Autopilot cluster for running Locust
- Optional Private Service Connect infrastructure
- NGINX proxy for secure access to the Locust UI

## Prerequisites

- Google Cloud project with billing enabled
- `gcloud` CLI installed and configured
- Terraform installed (v1.0.0+)
- Access to create GKE clusters and Vertex AI resources
- Permissions to create service accounts and IAM roles

## Quick Start

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-repo/vector-search-load-testing.git
   cd vector-search-load-testing
   ```

2. **Create your configuration**
   ```bash
   cp config.template.sh config.sh
   nano config.sh
   ```

3. **Run the deployment**
   ```bash
   ./deploy.sh
   ```

4. **Access the Locust UI**
   
   Follow the instructions displayed at the end of the deployment to access the Locust UI.

## Configuration Options

### Required Configuration

| Parameter | Description | Example Value |
|-----------|-------------|---------------|
| `PROJECT_ID` | Google Cloud project ID | `"your-project-id"` |
| `REGION` | Region for resource deployment | `"us-central1"` |
| `ZONE` | Zone for compute resources | `"us-central1-a"` |
| `DEPLOYMENT_ID` | Unique identifier for this deployment | `"vs-load-test-1"` |
| `INDEX_DIMENSIONS` | Vector dimensions in the index | `768` |
| `ENDPOINT_ACCESS_TYPE` | Endpoint access method (options: "public", "private_vpc", "private_service_connect") | `"public"` |

### Index Source Configuration

Choose ONE of these options:

#### Option 1: Use existing index
```bash
VECTOR_SEARCH_INDEX_ID="projects/YOUR_PROJECT/locations/REGION/indexes/INDEX_ID"
```

#### Option 2: Create new index
```bash
BUCKET_NAME="your-embedding-bucket"
EMBEDDING_PATH="path/to/embeddings"
```

### Network Configuration (for private endpoints)

```bash
NETWORK_NAME="your-network"
SUBNETWORK="projects/YOUR_PROJECT/regions/REGION/subnetworks/your-subnet"
MASTER_IPV4_CIDR_BLOCK="172.16.0.0/28"
GKE_POD_SUBNET_RANGE="10.4.0.0/14"
GKE_SERVICE_SUBNET_RANGE="10.0.32.0/20"
```

### Sparse Embedding Configuration (for hybrid/blended search)

```bash
# Uncomment and set for hybrid/blended search
# SPARSE_EMBEDDING_NUM_DIMENSIONS=10000      # Total sparse dimensions
# SPARSE_EMBEDDING_NUM_DIMENSIONS_WITH_VALUES=200  # Non-zero dimensions
```

### Deployed Index Configuration

```bash
DEPLOYED_INDEX_RESOURCE_TYPE="dedicated"  # Options: "automatic", "dedicated"
DEPLOYED_INDEX_DEDICATED_MACHINE_TYPE="e2-standard-16"
DEPLOYED_INDEX_DEDICATED_MIN_REPLICAS=2
DEPLOYED_INDEX_DEDICATED_MAX_REPLICAS=5
```

### Additional Optional Settings

```bash
# Vector Search Index settings
INDEX_DISPLAY_NAME="my-vector-search-index"
INDEX_DESCRIPTION="Vector search index for testing"
INDEX_APPROXIMATE_NEIGHBORS_COUNT=150
INDEX_DISTANCE_MEASURE_TYPE="DOT_PRODUCT_DISTANCE"  # Options: "COSINE_DISTANCE", "EUCLIDEAN_DISTANCE", "DOT_PRODUCT_DISTANCE"
INDEX_ALGORITHM_CONFIG_TYPE="TREE_AH_ALGORITHM"  # Options: "TREE_AH_ALGORITHM", "BRUTE_FORCE_ALGORITHM"

# Endpoint settings
ENDPOINT_DISPLAY_NAME="my-vector-search-endpoint"
ENDPOINT_DESCRIPTION="Vector search endpoint for testing"
```

## Deployment Process

The deployment script (`deploy.sh`) handles the entire process:

1. **Environment Setup**
   - Validates configuration
   - Enables required Google Cloud APIs
   - Creates Artifact Registry repository

2. **Infrastructure Deployment**
   - Creates or references Vector Search index
   - Configures endpoint access (public, VPC, or PSC)
   - Deploys Vertex AI resources using Terraform

3. **Locust Deployment**
   - Builds and pushes Locust container image
   - Deploys GKE Autopilot cluster
   - Configures Locust master and worker pods

4. **Access Configuration**
   - Sets up either external IP or secure tunnel for accessing Locust UI
   - Provides access instructions

## Test Types

The framework supports two primary test types based on your endpoint access configuration:

### HTTP Tests (Public Endpoints)

For `ENDPOINT_ACCESS_TYPE="public"`, the framework uses HTTP-based Locust tests:
- REST API access to Vector Search
- OAuth2 authentication
- Suitable for testing public endpoints

Example load test execution:
```bash
# In the Locust UI:
# Set number of users: 50
# Spawn rate: 10
# Click "Start swarming"
```

### gRPC Tests (Private Service Connect)

For `ENDPOINT_ACCESS_TYPE="private_service_connect"`, the framework uses gRPC-based tests:
- High-performance gRPC protocol
- Direct private connectivity
- Higher throughput and lower latency
- Suitable for production-like testing

The test type is automatically selected based on your endpoint configuration.

## Monitoring Test Results

Once your load test is running, you can:

1. **View real-time metrics in the Locust UI**
   - RPS (Requests Per Second)
   - Response time statistics
   - Failure counts and rates

2. **Download detailed statistics**
   - CSV reports of response times
   - Failure logs
   - Percentile metrics

3. **Monitor GCP resources**
   - GKE cluster metrics in Cloud Monitoring
   - Vector Search endpoint performance
   - CPU and memory utilization


## Test Scaling Guidelines

| Vector Count | Recommended Users | Recommended Machine Type |
|--------------|-------------------|--------------------------|
| <100K | 10-50 | e2-standard-8 |
| 100K-1M | 50-200 | e2-standard-16 |
| 1M-10M | 200-500 | n1-standard-32 |
| >10M | 500+ | n1-standard-64 |

## Troubleshooting

### Common Issues

1. **Missing Configuration Values**
   
   Error: "Configuration value X not found"
   
   Solution: Check your `config.sh` file and ensure all required values are set.

2. **Deployment Fails at Vector Search Step**
   
   Error: "Failed to create Vector Search index"
   
   Possible Solutions:
   - Check Cloud Storage bucket and path
   - Verify project has Vertex AI API enabled
   - Check permissions

3. **GKE Cluster Creation Fails**
   
   Error: "Failed to create cluster"
   
   Possible Solutions:
   - Check quota limits in your project
   - Verify network/subnetwork configuration
   - Ensure service account has required permissions

4. **Cannot Access Locust UI**
   
   Solution:
   - Check if external IP was configured
   - Verify port forwarding command
   - Check firewall rules

### Logs and Debugging

- Terraform logs: `terraform/terraform.log`
- Locust pod logs: `kubectl logs -f deployment/locust-master`
- GKE cluster logs: GCP Console > Kubernetes Engine > Clusters > Logs

## Cleanup

To delete all resources created by this framework:

```bash
cd terraform
terraform destroy
```

Note: This will delete all resources included in the Terraform state, including any Vector Search indexes and endpoints.

## Project Structure

```
vector-search-load-testing/
├── config.template.sh          # Configuration template
├── deploy.sh                   # Main deployment script
├── locust_tests/               # Locust test files
│   └── locust.py               # Main test script
├── terraform/                  # Terraform configuration
│   ├── main.tf                 # Main Terraform config
│   ├── variables.tf            # Variables definition
│   ├── outputs.tf              # Output values
│   └── modules/                # Terraform modules
│       ├── vertex-ai-vector-search/  # Vector Search module
│       └── gke-autopilot/      # GKE cluster module
└── docs/                       # Documentation
    └── architecture.png        # Architecture diagram
```

## Additional Resources

- [Vertex AI Vector Search Documentation](https://cloud.google.com/vertex-ai/docs/vector-search/overview)
- [Locust Documentation](https://docs.locust.io/)
- [Terraform Documentation](https://developer.hashicorp.com/terraform/docs)
- [GKE Documentation](https://cloud.google.com/kubernetes-engine/docs)