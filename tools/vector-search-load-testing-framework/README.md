# Vertex AI Vector Search Load Testing Framework

This framework provides a streamlined solution for distributed load testing of Vertex AI Vector Search endpoints on Google Kubernetes Engine (GKE) using [Locust](https://locust.io/). It enables you to simulate production-like workloads to effectively benchmark performance, analyze scalability, and validate deployment configurations.

## Overview

This framework enables you to quickly deploy both a Vertex AI Vector Search index and a distributed Locust-based load testing suite on Google Kubernetes Engine. This rapid setup facilitates immediate performance benchmarking, scalability analysis, and validation of your vector search deployments by simulating production workloads. The framework includes the following features:

- Infrastructure setup via Terraform
- Simplified configuration management
- Automatic Vector Search index and endpoint deployment
- Distributed load testing with Locust
- Support for both HTTP and gRPC protocols
- Blended search (dense + sparse vectors) support
- Network isolation with VPC options
- Multiple deployment topologies for comparing different configurations

## Use Cases

- **Performance Benchmarking**: Measure throughput (QPS) and latency across different Vector Search configurations
- **Capacity Planning**: Determine the right machine type and replica count for your production workload
- **Scaling Validation**: Test autoscaling capabilities under varying loads
- **Network Topology Testing**: Compare public vs. private endpoint performance
- **Protocol Comparison**: Compare HTTP vs. gRPC performance characteristics
- **Production Readiness**: Validate your configuration can handle expected traffic spikes

## Prerequisites

- Google Cloud project with billing enabled
- [`gcloud`](https://cloud.google.com/sdk/docs/install) CLI installed and configured
- [Terraform CLI](https://developer.hashicorp.com/terraform/tutorials/aws-get-started/install-cli) installed (v6.0.0+)
- [GKE Auth Plugin](https://cloud.google.com/kubernetes-engine/docs/how-to/cluster-access-for-kubectl): `gcloud components install gke-gcloud-auth-plugin`
- [Kubectl CLI](https://cloud.google.com/kubernetes-engine/docs/how-to/cluster-access-for-kubectl): `gcloud components install kubectl`
- Permission to create following resources:
   - GKE cluster
   - Vertex AI resources
   - Service account
   - IAM roles
   - Artifact Registry repository
- Pre-existing embeddings in a Cloud Storage bucket or in an existing Vector Search index.

## Quick Start

You can quickly deploy a Vector Search deployed index and Locust-based load test platform with default settings with the commands below. This framework allows you to stand up a brand new Vector Search index or bring your own existing index. In either scenario the framework will create a new deployed index.
- *Vector Search Index: Data structure holding vector embeddings*
- *Vector Search Deployed Index: The index made queryable and accessible as a live service endpoint.*

1. Copy the configuration template:
   ```bash
   cp config.template.sh config.sh
   ```

2. Edit the minimum required settings:
   ```bash
   
   # Required settings:
   PROJECT_ID="your-project-id"
   REGION="us-central1"
   ZONE="us-central1-a"
   DEPLOYMENT_ID="vs-load-test-1"
   INDEX_DIMENSIONS=1536
   

   ENDPOINT_ACCESS_TYPE="public"  # Options: "public", "private_service_connect", "vpc_peering"
   
   # Index source configuration (REQUIRED - choose ONE option)
   # Option 1: Use existing index (uncomment and set value)
   VECTOR_SEARCH_INDEX_ID="" 
   # OR
   # Option 2: Create new index (leave VECTOR_SEARCH_INDEX_ID commented out to use these)
   BUCKET_NAME="your-embedding-bucket"
   EMBEDDING_PATH="your-embedding-folder"
   ```
3. Authenticate your local machine to Google Cloud using your Google account for application default credentials:
   ```bash
   gcloud auth application-default login
   ```
4. Run the deployment:
   ```bash
   ./deploy_vvs_load_testing_framework.sh
   ```

5. Access the Locust UI using the URL provided at the end of deployment.

## Detailed Configuration Options

The framework is highly configurable to simulate various production scenarios. Here are the configuration options organized by category:

### Core Configuration

| Parameter | Description | Example Value | Personas |
|-----------|-------------|---------------|----------|
| `PROJECT_ID` | Google Cloud project ID | `"your-project-id"` | All |
| `REGION` | Region for resource deployment | `"us-central1"` | All |
| `ZONE` | Zone for compute resources | `"us-central1-a"` | All |
| `DEPLOYMENT_ID` | Unique identifier for this deployment | `"vs-load-test-1"` | All |
| `INDEX_DIMENSIONS` | Vector dimensions in the index | `768` (Default) | All |

### Deployment Topology

| Parameter | Description | Example Value | Recommended For |
|-----------|-------------|---------------|----------------|
| `ENDPOINT_ACCESS_TYPE` | Endpoint access method | `"public"` | Deployed index will be accessible through public endpoint |
| | | `"private_service_connect"` | Configuration for private service connect. |
| | | `"vpc_peering"` | Index endpoint should be peered with private network. |

### Index Source Configuration (Choose ONE option)

For using an existing index:
```bash
VECTOR_SEARCH_INDEX_ID="projects/YOUR_PROJECT/locations/REGION/indexes/INDEX_ID"
```

For creating a new index:
```bash
BUCKET_NAME="your-embedding-bucket"
EMBEDDING_PATH="path/to/embeddings"
```

### Network Configuration

Required for private endpoints (`"private_service_connect"` or `"vpc_peering"`):

```bash
VPC_NETWORK_NAME="your-network"                                         # Network name
SUBNETWORK="projects/YOUR_PROJECT/regions/REGION/subnetworks/your-subnet" # Subnet for resources
MASTER_IPV4_CIDR_BLOCK="172.16.0.0/28"                                  # GKE control plane IP range
GKE_POD_SUBNET_RANGE="10.4.0.0/14"                                      # Pod IP range
GKE_SERVICE_SUBNET_RANGE="10.0.32.0/20"                                 # Service IP range
```

### Performance Testing Features

#### Vector Search Configuration

```bash
# Index configuration
INDEX_SHARD_SIZE="SHARD_SIZE_LARGE"                   # Options: SMALL, MEDIUM, LARGE
INDEX_APPROXIMATE_NEIGHBORS_COUNT=150                 # The default number of neighbors to find via approximate search before exact reordering is performed. Required if tree-AH algorithm is used.
INDEX_DISTANCE_MEASURE_TYPE="DOT_PRODUCT_DISTANCE"    # The distance measure used in nearest neighbor search. The value must be one of the followings: SQUARED_L2_DISTANCE,  L1_DISTANCE, COSINE_DISTANCE, DOT_PRODUCT_DISTANCE

INDEX_ALGORITHM_CONFIG_TYPE="tree_ah_config"          # Algorithm: tree_ah_config or brute_force_config

# Deployed index resources
DEPLOYED_INDEX_RESOURCE_TYPE="dedicated"                    # Options: "automatic", "dedicated"
DEPLOYED_INDEX_DEDICATED_MACHINE_TYPE="e2-standard-16"      # Machine type
DEPLOYED_INDEX_DEDICATED_MIN_REPLICAS=2                     # Min replica count
DEPLOYED_INDEX_DEDICATED_MAX_REPLICAS=5                     # Max replica count (for dedicated)
```

#### Blended Search (Optional)

Enables testing for hybird search with both dense and sparse embeddings:

```bash
SPARSE_EMBEDDING_NUM_DIMENSIONS=10000       # Total sparse dimensions
SPARSE_EMBEDDING_NUM_DIMENSIONS_WITH_VALUES=200   # Non-zero dimensions per vector
```


## Production Simulation Recipes

Here are common configurations for simulating specific production scenarios:

### High-Throughput Public Endpoint

For testing high QPS with public endpoints:

```bash
ENDPOINT_ACCESS_TYPE="public"
INDEX_SHARD_SIZE="SHARD_SIZE_LARGE"
DEPLOYED_INDEX_RESOURCE_TYPE="dedicated"
DEPLOYED_INDEX_DEDICATED_MACHINE_TYPE="n2-standard-32"
DEPLOYED_INDEX_DEDICATED_MIN_REPLICAS=5
DEPLOYED_INDEX_DEDICATED_MAX_REPLICAS=10
```

__Locust UI Configuration__
```
Number of Users=1000
Ramp Up=0.5
Num Neighbors=20
QPS per User=5
```

Note: setting a low user ramp up (e.g., 0.5) will help to not overwhelm the workers, and keep CPU utilization low.

### Optimizing Locust Worker Scaling

The framework automatically scales Locust workers based on CPU utilization, but you can customize the minimum number of workers to optimize test execution:

#### Why Worker Count Matters

- Initial Distribution: Locust distributes users evenly across available workers when a test begins
- Scaling Limitations: Once workers are assigned users, Locust doesn't automatically redistribute load when new workers are added
- Best Practice: Start with enough workers to handle your expected peak load
- Alternatively, if you observe a new worker is spun up without any traffic, you can restart the load test to distribute the load to the new worker.

For example:

- Testing with 30 users? 3 workers (default) is sufficient
- Testing with 300 users? Start with at least 10 workers (MIN_REPLICAS_WORKER=10)
- Testing with 3000 users? Start with at least 30-50 workers (MIN_REPLICAS_WORKER=50)

Starting with an appropriate number of workers ensures even load distribution and more accurate test results, especially for high-volume tests.

Note: Setting too many workers for a small test can waste resources, while too few workers for a large test can cause uneven load distribution and misleading results.

### Secure Enterprise Deployment

For simulating enterprise production with private connectivity:

```bash
ENDPOINT_ACCESS_TYPE="private_service_connect"
INDEX_SHARD_SIZE="SHARD_SIZE_LARGE"
DEPLOYED_INDEX_RESOURCE_TYPE="dedicated"
DEPLOYED_INDEX_DEDICATED_MACHINE_TYPE="n1-standard-16"
DEPLOYED_INDEX_DEDICATED_MIN_REPLICAS=3
DEPLOYED_INDEX_DEDICATED_MAX_REPLICAS=8
```

__Locust UI Configuration__
```
Number of Users=100
Ramp Up=100
Num Neighbors=20
QPS per User=5
```


### Multi-Region Testing

For comparing performance across regions, deploy runs/terraform workspaces:

```bash
# First deployment
DEPLOYMENT_ID="us-central1-tst"
REGION="us-central1"
ZONE="us-central1-a"

# Second deployment (once the first deployment is done)
DEPLOYMENT_ID="us-east1-tst"
REGION="us-east1"
ZONE="us-east1-b"
```

## Deployment Steps

1. **Setup Configuration**

   Copy the template and customize your configuration:
   ```bash
   cp config.template.sh config.sh
   nano config.sh
   ```

2. **Run the Deployment Script**

   Execute the deployment script:
   ```bash
   ./deploy_vvs_load_testing_framework.sh
   ```

   The script will:
   - Enable required Google Cloud APIs
   - Create an Artifact Registry repository
   - Build and deploy the Locust Docker image
   - Deploy Vector Search infrastructure
   - Create a GKE cluster with proper namespace isolation
   - Deploy Locust to the GKE cluster

3. **Monitor Deployment**

   The deployment progress will be displayed in the console. Once completed, the script will provide instructions for accessing the Locust UI.

## Accessing the Locust UI

Based on your configuration, access to the Locust web interface is provided in one of two ways:

### With External IP

If you chose to create an external IP during deployment, access the UI directly at:
```
http://EXTERNAL_IP:8089
```

### Without External IP (Secure Tunnel)

If you chose not to use an external IP (more secure), use this command to create a tunnel:
```bash
gcloud compute ssh NGINX_PROXY_NAME --project PROJECT_ID --zone ZONE -- -NL 8089:localhost:8089
```

Then access the UI at:
```
http://localhost:8089
```

## Running Effective Load Tests

### 1. Planning Your Test

Before running a test, define your goals:
- **Baseline Performance**: What's the normal expected QPS?
- **Peak Load**: What's the maximum load you need to support?
- **Sustained Load**: What continuous load should you test?
- **Metrics to Capture**: Response time, error rates, client + server

### 2. Configuring Locust Tests

In the Locust UI:

- **Number of Users**: The number of concurrent clients making requests
  - Start small (10-20) and gradually increase
  - For production simulations, scale to 100+ users
  
- **Spawn Rate**: How quickly to add users
  - Start slow (1-2 users/sec) to avoid overloading
  - Increase for stress testing (5-10 users/sec)
  
- **Test Duration**: Run tests long enough to observe stable behavior
  - 5-10 minutes for initial tests
  - 30+ minutes for performance validation

- **Number of Neighbors**:Number of nearest neighbors to find in each query

- **QPS per User**:The QPS each user should target.  Locust will try to maintain this rate, but if latency is high, actual QPS may be lower.

### 3. Key Performance Metrics to Report

Collect these key metrics for each test:

* **Test Run Timestamp (UTC)** - Time when the test was started
* **Total Failures** - Found in the Statistics tab of Locust UI
* **Availability %** - Calculated as: 100 - "Availability % ((Total Requests - Total Failures) / Total Requests)*100"
* **p99 Client Latency (ms)** - 99th percentile response time measured by client
  1. In Locust UI, click "Download Data" → "Download requests CSV"
  2. Calculate the 50th, 95th, 99th, 99.9th percentile from the response time column
* **p99 Server Latency (ms)** - 99th percentile response time measured at server
  1. Go to Vector Search UI → Deployed Index → Monitoring tab
  2. Find the time window where requests were sent
  3. Adjust to display the 99th percentile
  4. Open "Latency" in Metrics Explorer
  9. Run query and record the scalar p99 values

### 4. Analyzing Results

After testing, analyze the results to make configuration decisions:

- **Latency vs. Throughput Curves**: Understand performance trade-offs
- **Scaling Efficiency**: Check if adding replicas improves throughput linearly
- **Cost-Performance Ratio**: Calculate cost per 1000 queries
- **Error Patterns**: Identify any bottlenecks

Download the CSV reports from Locust for detailed analysis.

## Advanced Customization

### Customizing Load Testing Patterns

To modify the testing behavior:

1. Edit the Locust test file:
   ```bash
   nano locust_tests/locust.py
   ```

2. Customize the query patterns, vector dimensions, embedding values, or test logic

3. Rebuild and redeploy:
   ```bash
   ./deploy_vvs_load_testing_framework.sh
   ```

### Testing Different Query Types

The framework supports testing different Vector Search query configurations:

- **Nearest Neighbor Count**: Adjust with `--num-neighbors` parameter in Locust
- **Sparse + Dense Vectors**: Configure with sparse embedding parameters
- **Tree-AH Parameters**: Test leaf node search percentages
- **Different Distance Metrics**: Test performance across metrics

## Troubleshooting

### Common Issues

1. **Missing Configuration Values**
   
   Error: "Configuration value X not found"
   
   Solution: Check your `config.sh` file and ensure all required values are set.

2. **Network/Subnet Mismatch**

   Error: "Subnetwork X is not valid for Network Y"
   
   Solution: Ensure the subnet specified in SUBNETWORK belongs to the VPC specified in VPC_NETWORK_NAME.

3. **Master CIDR Block Conflict**

   Error: "Conflicting IP cidr range: Invalid IPCidrRange"
   
   Solution: Use a different MASTER_IPV4_CIDR_BLOCK for each deployment in the same VPC.

4. **Deployment Fails at Vector Search Step**
   
   Error: "Failed to create Vector Search index"
   
   Possible Solutions:
   - Check Cloud Storage bucket and path
   - Verify project has Vertex AI API enabled
   - Check permissions

5. **GKE Cluster Creation Fails**
   
   Error: "Failed to create cluster"
   
   Possible Solutions:
   - Check quota limits in your project
   - Verify network/subnetwork configuration
   - Ensure service account has required permissions

6. **PSC Address Creation Fails**

   Error: "Invalid value for field 'resource.network'"
   
   Solution: For PSC addresses, only specify subnetwork, not network.

7. **Cannot Access Locust UI**
   
   Solution:
   - Check if external IP was configured
   - Verify port forwarding command
   - Check firewall rules

8. **Kubernetes Resources Not Found**

   Error: "Error: services 'X' not found"
   
   Solution: Ensure you're using the correct namespace with kubectl commands:
   ```bash
   kubectl -n DEPLOYMENT_ID-ns get pods
   ```

9. **Workers Not Scaling**

   Problem: Worker count remains at minimum despite high load
   
   Solutions:
   - Check worker CPU utilization (should approach threshold %)
   - Check HPA configuration
   - Increase test load or lower CPU threshold

### Logs and Debugging

- Terraform logs: `terraform/terraform.log`
- Locust pod logs: `kubectl -n DEPLOYMENT_ID-ns logs -f deployment/DEPLOYMENT_ID-master`
- GKE cluster logs: GCP Console > Kubernetes Engine > Clusters > Logs
- Vector Search metrics: Vertex AI > Vector Search > Endpoints > Monitoring

## Cleanup

To delete all resources created by this framework, run the `destroy.sh` script using the following command:

```bash
./destroy.sh
```

Note: This will delete all resources included in the Terraform state, including any Vector Search indexes and endpoints.

## Multiple Deployments

You can run multiple load test deployments in the same project to compare different configurations. To facilitate multiple deployments, each deployment requires its own unique configuration. Follow these steps:

1.  **Create Configuration Files:**
    * Duplicate the `config.template.sh` file to create a unique configuration file for each deployment.
    * Use the following command, replacing `<unique-name>` with a descriptive name for your deployment (e.g., `scenario1_config.sh`, `performance_config.sh`):

        ```bash
        cp config.template.sh <unique-name>.sh
        ```
    * Using different `DEPLOYMENT_ID` values for each deployment.
    * Using different `MASTER_IPV4_CIDR_BLOCK` ranges for GKE clusters for each deployment.
    * Optionally using different `VPC_NETWORK_NAME` values
    * Example:
      ```bash
      # Deployment 1 - OpenAI embeddings, in openai_config.sh
      DEPLOYMENT_ID="openai-test"
      INDEX_DIMENSIONS=1536
      MASTER_IPV4_CIDR_BLOCK="172.16.0.0/28"
      ```
  
      ```bash
      # Deployment 2 - Cohere embeddings, in cohere_config.sh
      DEPLOYMENT_ID="cohere-test"
      INDEX_DIMENSIONS=768
      MASTER_IPV4_CIDR_BLOCK="172.16.0.16/28"
      ```
  
      ```bash
      # Deployment 3 - Custom configuration, in customtest_config.sh
      DEPLOYMENT_ID="custom-test"
      INDEX_DIMENSIONS=384
      MASTER_IPV4_CIDR_BLOCK="172.16.0.32/28"
      ```

2.  **Modify Scripts:**
    * Before running the deployement or cleanup script for a configuration, update the `CONFIG_FILE` variable within both the `deploy_vvs_load_testing_framework.sh` and `destroy.sh` scripts to point to the corresponding unique configuration file created in step 1.
    * Example:

        ```bash
        # In deploy_vvs_load_testing_framework.sh and destroy.sh
        CONFIG_FILE="<unique-name>.sh"
        ```
    * Finally, run the following command for deploying or to cleanup a particular configuration:
      ```bash
        # For deployment of the configuration
        ./deploy_vvs_load_testing_framework.sh

        # For clean up of the configuration
        ./destroy.sh
        ```

## Additional Resources

- [Vertex AI Vector Search Documentation](https://cloud.google.com/vertex-ai/docs/vector-search/overview)
- [Locust Documentation](https://docs.locust.io/)
- [GKE Documentation](https://cloud.google.com/kubernetes-engine/docs)
- [Private Service Connect Documentation](https://cloud.google.com/vpc/docs/private-service-connect)
- [Vector Search Performance Best Practices](https://cloud.google.com/vertex-ai/docs/vector-search/optimize-vector-search-performance)
