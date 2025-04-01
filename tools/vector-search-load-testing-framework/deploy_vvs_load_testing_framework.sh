#!/bin/bash
#==============================================================================
# Vector Search Load Testing Deployment Script
#
# This script deploys Vector Search infrastructure with Locust for load testing.
# It sets up GCP resources, Docker images, and Kubernetes deployments.
#==============================================================================

set -e  # Exit on any error

#==============================================================================
# MAIN FUNCTION
#==============================================================================
function main() {
  # Phase 1: Setup and Configuration
  load_configuration
  verify_deployment_id
  setup_dynamic_variables
  configure_endpoint_access
  configure_network_settings
  check_blended_search
  print_configuration_summary
  confirm_deployment
  
  # Phase 2: Infrastructure Setup
  enable_gcp_services
  create_artifact_registry
  setup_directories
  
  # Phase 3: Vector Search Deployment
  deploy_vector_search
  create_locust_config
  
  # Phase 4: Docker Build and Remaining Deployment
  build_and_push_docker_image
  deploy_remaining_infrastructure_with_k8s_error_handling
  
  # Phase 5: Finalization
  # setup_locust_ui_access
  verify_deployment
  
  echo "✅ Deployment process completed successfully!"
}

#==============================================================================
# UTILITY FUNCTIONS
#==============================================================================

#------------------------------------------------------------------------------
# Check and load configuration
#------------------------------------------------------------------------------
function load_configuration() {
  local CONFIG_FILE
  CONFIG_FILE="config.sh"
  
  echo "📋 Checking for configuration file..."
  if [ ! -f "$CONFIG_FILE" ]; then
    echo "❌ Configuration file $CONFIG_FILE not found!"
    echo "   Please copy config.template.sh to config.sh and update with your settings."
    exit 1
  fi

  echo "✅ Found configuration file. Loading settings..."
  # shellcheck disable=1090
  source "$CONFIG_FILE"
}

#------------------------------------------------------------------------------
# Verify DEPLOYMENT_ID
#------------------------------------------------------------------------------
function verify_deployment_id() {
  if [[ ${#DEPLOYMENT_ID} -gt 15 ]]; then
    echo "❌ ERROR: Deployment_ID length must be shorter than or equal to 15 characters."
    exit 1
  fi
  CLEANED_ID=$(echo "$DEPLOYMENT_ID" | tr '[:upper:]' '[:lower:]' | sed -E 's/^[^a-z]+//i; s/[^a-z0-9-]//gi')
  if [[ "$CLEANED_ID" != "$DEPLOYMENT_ID" ]]; then
    echo "❌ ERROR: DEPLOYMENT_ID must follow the format instructions provided in the 'config.template.sh' file."
    exit 1
  fi
}

#------------------------------------------------------------------------------
# Generate and set dynamic variables
#------------------------------------------------------------------------------
function setup_dynamic_variables() {
  echo "🔄 Setting up dynamic variables..."
  
  # Generate timestamps and names
  TIMESTAMP=$(date +%Y%m%d%H%M%S)
  CLEAN_REPO_NAME="locust-docker-repo-$(echo "${DEPLOYMENT_ID}" | tr '[:upper:]' '[:lower:]' | sed 's/[^a-z0-9-]/-/g' | sed 's/^[^a-z]*/l/' | sed 's/-$/1/')"
  DOCKER_IMAGE="${REGION}-docker.pkg.dev/${PROJECT_ID}/${CLEAN_REPO_NAME}/locust-load-test:LTF-${TIMESTAMP}"
  PROJECT_NUMBER=$(gcloud projects describe "$PROJECT_ID" --format="value(projectNumber)")
  
  # Export for Terraform
  export TIMESTAMP
  export CLEAN_REPO_NAME
  export DOCKER_IMAGE
  export PROJECT_NUMBER
}

#------------------------------------------------------------------------------
# Configure endpoint access type
#------------------------------------------------------------------------------
function configure_endpoint_access() {
  echo "🔌 Setting up connection type: ${ENDPOINT_ACCESS_TYPE}"
  
  case "${ENDPOINT_ACCESS_TYPE}" in
    "public")
      export TF_VAR_endpoint_access='{"type":"public"}'
      export LOCUST_TEST_TYPE="http"
      echo "  ➡️ Configuring public internet access with HTTP tests"
      ;;
    "vpc_peering")
      export TF_VAR_endpoint_access='{"type":"vpc_peering"}'
      export LOCUST_TEST_TYPE="grpc"
      echo "  ➡️ Configuring VPC network peering with gRPC tests"
      
      # Validate required VPC peering parameters
      if [[ -z "${VPC_NETWORK_NAME}" ]]; then
        echo "❌ ERROR: You must set NETWORK_NAME in your config for VPC peering"
        exit 1
      fi
      
      if [[ -z "${PEERING_RANGE_NAME}" ]]; then
        echo "❌ ERROR: You must set PEERING_RANGE_NAME in your config for VPC peering"
        exit 1
      fi
      
      if [[ -z "${PEERING_PREFIX_LENGTH}" ]]; then
        echo "❌ ERROR: You must set PEERING_PREFIX_LENGTH in your config for VPC peering"
        exit 1
      fi
      
      # Enable Service Networking API (required for VPC peering)
      echo "  🔄 Enabling required networking services for VPC peering..."
      gcloud services enable servicenetworking.googleapis.com --project="${PROJECT_ID}"
      ;;
    "private_service_connect")
      export TF_VAR_endpoint_access='{"type":"private_service_connect"}'
      export LOCUST_TEST_TYPE="grpc"
      echo "  ➡️ Configuring Private Service Connect with gRPC tests"
      
      # Validate VPC network is defined (PSC requires a VPC, but with different parameters than VPC peering)
      if [[ -z "${VPC_NETWORK_NAME}" ]]; then
        echo "❌ ERROR: You must set NETWORK_NAME in your config for Private Service Connect"
        exit 1
      fi
      
      # Enable Service Networking API
      echo "  🔄 Enabling required networking services for Private Service Connect..."
      gcloud services enable servicenetworking.googleapis.com --project="${PROJECT_ID}"
      ;;
    *)
      echo "❌ ERROR: Invalid connection type '${ENDPOINT_ACCESS_TYPE}'. Must be one of: 'public', 'vpc_peering', 'private_service_connect'"
      exit 1
      ;;
  esac
}

#------------------------------------------------------------------------------
# Configure network settings
#------------------------------------------------------------------------------
function configure_network_settings() {
  echo "🌐 Configuring network settings..."
  
  # Configure simplified network settings
  NETWORK_CONFIG="{\"network_name\":\"${VPC_NETWORK_NAME:-default}\""
  [[ -n "${SUBNETWORK}" ]] && NETWORK_CONFIG="${NETWORK_CONFIG},\"subnetwork\":\"${SUBNETWORK}\""
  [[ -n "${MASTER_IPV4_CIDR_BLOCK}" ]] && NETWORK_CONFIG="${NETWORK_CONFIG},\"master_ipv4_cidr_block\":\"${MASTER_IPV4_CIDR_BLOCK}\""
  [[ -n "${GKE_POD_SUBNET_RANGE}" ]] && NETWORK_CONFIG="${NETWORK_CONFIG},\"pod_subnet_range\":\"${GKE_POD_SUBNET_RANGE}\""
  [[ -n "${GKE_SERVICE_SUBNET_RANGE}" ]] && NETWORK_CONFIG="${NETWORK_CONFIG},\"service_subnet_range\":\"${GKE_SERVICE_SUBNET_RANGE}\""
  NETWORK_CONFIG="${NETWORK_CONFIG}}"
  export TF_VAR_network_configuration="${NETWORK_CONFIG}"
  
  # Validate subnet if specified
  validate_subnet
  
  # Export VPC peering variables if needed
  if [[ "${ENDPOINT_ACCESS_TYPE}" == "vpc_peering" ]]; then
    export TF_VAR_peering_range_name="${PEERING_RANGE_NAME}"
    export TF_VAR_peering_prefix_length="${PEERING_PREFIX_LENGTH:-16}"
  fi
  
  echo "  ➡️ Network configuration: ${TF_VAR_network_configuration}"
}

#------------------------------------------------------------------------------
# Validate subnet belongs to the specified VPC
#------------------------------------------------------------------------------
function validate_subnet() {
  if [[ -n "${SUBNETWORK}" && -n "${VPC_NETWORK_NAME}" ]]; then
    echo "🔍 Validating subnet ${SUBNETWORK} belongs to network ${VPC_NETWORK_NAME}..."
    
    # Extract just the subnet name from the full path if provided
    SUBNET_NAME=$(basename "${SUBNETWORK}")
    
    # Get subnet details
    SUBNET_DETAILS=$(gcloud compute networks subnets describe "${SUBNET_NAME}" \
      --project="${PROJECT_ID}" \
      --region="${REGION}" \
      --format="yaml" 2>/dev/null)
      
    # Extract network from subnet details
    SUBNET_NETWORK=$(echo "${SUBNET_DETAILS}" | grep "network:" | awk '{print $2}')
    
    # Compare the networks
    if [[ "${SUBNET_NETWORK}" == *"${VPC_NETWORK_NAME}"* ]]; then
      echo "  ✅ Subnet validation successful: ${SUBNET_NAME} belongs to ${VPC_NETWORK_NAME}"
    else
      echo "  ❌ ERROR: Subnet '${SUBNET_NAME}' does not appear to belong to network '${VPC_NETWORK_NAME}'."
      echo "     The subnet belongs to network: ${SUBNET_NETWORK}"
      echo "     Please verify your network configuration."
      exit 1
    fi
  fi
}

#------------------------------------------------------------------------------
# Check if blended search is enabled
#------------------------------------------------------------------------------
function check_blended_search() {
  echo "🔍 Checking search configuration..."
  
  if [[ -v SPARSE_EMBEDDING_NUM_DIMENSIONS && -v SPARSE_EMBEDDING_NUM_DIMENSIONS_WITH_VALUES ]]; then
    export blended_search="y"
    echo "  ➡️ Sparse embedding configuration detected - using blended search mode"
  else
    export blended_search="n"
    echo "  ➡️ No sparse embedding configuration detected - using standard search mode"
  fi
}

#------------------------------------------------------------------------------
# Print configuration summary
#------------------------------------------------------------------------------
function print_configuration_summary() {
  echo "======================================================================"
  echo "📋 DEPLOYMENT CONFIGURATION SUMMARY:"
  echo "======================================================================"
  echo "Project ID:              $PROJECT_ID"
  echo "Region:                  $REGION"
  echo "Zone:                    $ZONE"
  echo "Deployment ID:           $DEPLOYMENT_ID"
  echo "Connection Type:         $ENDPOINT_ACCESS_TYPE"
  echo "Test Type:               $LOCUST_TEST_TYPE"
  echo "Network:                 ${VPC_NETWORK_NAME:-default}"
  [[ -n "${SUBNETWORK}" ]] && echo "Subnet:                  $SUBNETWORK"

  # Display VPC peering info if applicable
  if [[ "${ENDPOINT_ACCESS_TYPE}" == "vpc_peering" ]]; then
    echo "VPC Peering Range:       ${PEERING_RANGE_NAME}"
    echo "Peering Prefix Length:   ${PEERING_PREFIX_LENGTH:-16}"
  fi

  echo "Search Mode:             $([ "$blended_search" == "y" ] && echo "Blended Search" || echo "Standard Search")"
  echo "Index Dimensions:        $INDEX_DIMENSIONS"
  
  if [[ -n "$VECTOR_SEARCH_INDEX_ID" ]]; then
    echo "Vector Search Index:     Using existing index: $VECTOR_SEARCH_INDEX_ID"
  else
    echo "Vector Search Index:     Creating new index from data in gs://$BUCKET_NAME/$EMBEDDING_PATH"
  fi
  echo "======================================================================"
}

#------------------------------------------------------------------------------
# Confirm deployment with user
#------------------------------------------------------------------------------
function confirm_deployment() {
  echo 
  echo "⚠️  Ready to deploy with the settings above. Do you want to continue? (y/n)"
  read -r confirmation
  if [[ ! "$confirmation" =~ ^[Yy]$ ]]; then
    echo "🛑 Deployment cancelled by user."
    exit 0
  fi
  
  # Ask about external IP preference
  echo
  echo "External IP addresses make your service accessible from the internet."
  read -r -p "Do you need an external IP for the Locust UI? (y/n): " need_external_ip
  
  # Set Terraform variable based on user preference
  if [[ "${need_external_ip,,}" == "y" ]]; then
    export TF_VAR_create_external_ip="true"
    echo "External IP will be created"
  else
    export TF_VAR_create_external_ip="false"
    echo "External IP will not be created"
  fi
  echo
}

#------------------------------------------------------------------------------
# Enable required GCP services
#------------------------------------------------------------------------------
function enable_gcp_services() {
  echo "🔄 Enabling required Google Cloud services (this may take a minute)..."
  
  gcloud services enable aiplatform.googleapis.com \
    artifactregistry.googleapis.com \
    compute.googleapis.com \
    autoscaling.googleapis.com \
    container.googleapis.com \
    iamcredentials.googleapis.com \
    cloudbuild.googleapis.com \
    iam.googleapis.com \
    --project="${PROJECT_ID}"
    
  echo "  ✅ Cloud services enabled successfully"
}

#------------------------------------------------------------------------------
# Create Artifact Registry repository
#------------------------------------------------------------------------------
function create_artifact_registry() {
  echo "🔄 Setting up Artifact Registry repository..."
  
  if ! gcloud artifacts repositories describe "${CLEAN_REPO_NAME}" --location="${REGION}" --project="${PROJECT_ID}" &>/dev/null; then
    echo "  ➡️ Creating Artifact Registry repository: ${CLEAN_REPO_NAME}"
    gcloud artifacts repositories create "${CLEAN_REPO_NAME}" \
      --repository-format=docker \
      --location="${REGION}" \
      --project="${PROJECT_ID}"
    echo "  ✅ Repository created successfully"
  else
    echo "  ✅ Artifact Registry repository already exists"
  fi
}

#------------------------------------------------------------------------------
# Setup necessary directories and files
#------------------------------------------------------------------------------
function setup_directories() {
  echo "📁 Setting up configuration directories..."
  
  # Create config directory
  mkdir -p config
  touch config/locust_config.env
  
  # Set correct permissions
  chmod 666 ./locust_tests/locust.py    
  chmod 666 config/locust_config.env
  
  echo "  ✅ Directories and permissions set up"
}

#------------------------------------------------------------------------------
# Deploy Vector Search infrastructure using Terraform
#------------------------------------------------------------------------------
function deploy_vector_search() {
  echo "🚀 Deploying Vector Search infrastructure..."
  echo "   (This can take 5-180 minutes depending on the size of your dataset. Now might be a good time for coffee ☕)"
  pushd terraform

  # Setup Terraform workspace
  setup_terraform_workspace
  
  # Create terraform.tfvars file
  create_terraform_vars
  
  # Run Terraform
  echo "  🔄 Initializing Terraform..."
  terraform init

  echo "  🔄 Deploying Vector Search in workspace: $DEPLOYMENT_ID"
  echo "      (Progress will be shown below)"
  terraform apply -target=module.vector_search --auto-approve
  
  # Extract output values
  extract_terraform_outputs
  
  echo "  ✅ Vector Search deployment completed successfully!"
  popd
}

#------------------------------------------------------------------------------
# Setup Terraform workspace
#------------------------------------------------------------------------------
function setup_terraform_workspace() {
  # Check if the workspace exists
  if terraform workspace list | grep -q "$DEPLOYMENT_ID"; then
    # Workspace exists, switch to it
    echo "  ➡️ Workspace '$DEPLOYMENT_ID' already exists. Switching to it..."
    terraform workspace select "$DEPLOYMENT_ID"
  else
    # Workspace doesn't exist, create it
    echo "  ➡️ Workspace '$DEPLOYMENT_ID' does not exist. Creating it..."
    terraform workspace new "$DEPLOYMENT_ID"
  fi

  # Verify the current workspace
  current_workspace=$(terraform workspace show)
  echo "  ✅ Current Terraform workspace: $current_workspace"
}
#------------------------------------------------------------------------------
# Create terraform.tfvars file
#------------------------------------------------------------------------------
function create_terraform_vars() {
  echo "  📝 Creating terraform.tfvars file..."
  
  # Start with an empty file
  : > terraform.tfvars
  
  {
    # Add basic variables
    echo "project_id = \"${PROJECT_ID}\""
    echo "region = \"${REGION}\""
    echo "project_number = \"${PROJECT_NUMBER}\""
    echo "deployment_id = \"${DEPLOYMENT_ID}\""
    echo "locust_test_type = \"${LOCUST_TEST_TYPE}\""
    echo "create_external_ip = ${TF_VAR_create_external_ip:-false}"
  
    # Add network configuration
    echo ""
    echo "# Network configuration"
    echo "network_configuration = {"
    echo "  network_name = \"${VPC_NETWORK_NAME:-default}\""
    echo "  subnetwork = \"${SUBNETWORK}\""
    echo "  master_ipv4_cidr_block = \"${MASTER_IPV4_CIDR_BLOCK:-172.16.0.0/28}\""
    echo "  pod_subnet_range = \"${GKE_POD_SUBNET_RANGE:-10.4.0.0/14}\""
    echo "  service_subnet_range = \"${GKE_SERVICE_SUBNET_RANGE:-10.0.32.0/20}\""
    echo "}"

    # Setting minimum number of Replicas
    echo ""
    [[ -n "$MIN_REPLICAS_WORKER" ]] && echo "min_replicas_worker = $MIN_REPLICAS_WORKER"

    # Add VPC peering variables if needed
    if [[ "${ENDPOINT_ACCESS_TYPE}" == "vpc_peering" ]]; then
      echo ""
      echo "peering_range_name = \"${PEERING_RANGE_NAME}\""
      echo "peering_prefix_length = ${PEERING_PREFIX_LENGTH:-16}"
    fi

    # Add index configuration
    echo ""
    if [[ -n "${VECTOR_SEARCH_INDEX_ID}" ]]; then
      echo "vector_search_index_id = \"${VECTOR_SEARCH_INDEX_ID}\""
    else
      echo "existing_bucket_name = \"${BUCKET_NAME}\""
      echo "embedding_data_path = \"${EMBEDDING_PATH}\""
    fi

    # Add other required settings
    echo ""
    echo "index_dimensions = ${INDEX_DIMENSIONS}"
    echo "deployed_index_resource_type = \"${DEPLOYED_INDEX_RESOURCE_TYPE:-dedicated}\""
    echo "deployed_index_dedicated_machine_type = \"${DEPLOYED_INDEX_DEDICATED_MACHINE_TYPE:-e2-standard-16}\""
    echo "image = \"${DOCKER_IMAGE}\""

    # Add all optional variables
    echo ""
    echo "# Optional variables"
    
    # Index settings
    [[ -n "$INDEX_DISPLAY_NAME" ]] && echo "index_display_name = \"$INDEX_DISPLAY_NAME\""
    [[ -n "$INDEX_DESCRIPTION" ]] && echo "index_description = \"$INDEX_DESCRIPTION\""
    [[ -n "$INDEX_LABELS" ]] && echo "index_labels = $INDEX_LABELS"
    
    [[ -n "$INDEX_APPROXIMATE_NEIGHBORS_COUNT" ]] && echo "index_approximate_neighbors_count = $INDEX_APPROXIMATE_NEIGHBORS_COUNT"
    [[ -n "$INDEX_DISTANCE_MEASURE_TYPE" ]] && echo "index_distance_measure_type = \"$INDEX_DISTANCE_MEASURE_TYPE\""
    [[ -n "$INDEX_SHARD_SIZE" ]] && echo "index_shard_size = \"$INDEX_SHARD_SIZE\""
    
    [[ -n "$FEATURE_NORM_TYPE" ]] && echo "feature_norm_type = \"$FEATURE_NORM_TYPE\""
    [[ -n "$INDEX_ALGORITHM_CONFIG_TYPE" ]] && echo "index_algorithm_config_type = \"$INDEX_ALGORITHM_CONFIG_TYPE\""
    [[ -n "$INDEX_TREE_AH_LEAF_NODE_EMBEDDING_COUNT" ]] && echo "index_tree_ah_leaf_node_embedding_count = $INDEX_TREE_AH_LEAF_NODE_EMBEDDING_COUNT"
    [[ -n "$INDEX_TREE_AH_LEAF_NODES_TO_SEARCH_PERCENT" ]] && echo "index_tree_ah_leaf_nodes_to_search_percent = $INDEX_TREE_AH_LEAF_NODES_TO_SEARCH_PERCENT"
    [[ -n "$INDEX_UPDATE_METHOD" ]] && echo "index_update_method = \"$INDEX_UPDATE_METHOD\""

    # Endpoint settings
    [[ -n "$ENDPOINT_DISPLAY_NAME" ]] && echo "endpoint_display_name = \"$ENDPOINT_DISPLAY_NAME\""
    [[ -n "$ENDPOINT_DESCRIPTION" ]] && echo "endpoint_description = \"$ENDPOINT_DESCRIPTION\""
    [[ -n "$ENDPOINT_LABELS" ]] && echo "endpoint_labels = $ENDPOINT_LABELS"
    [[ -n "$ENDPOINT_CREATE_TIMEOUT" ]] && echo "endpoint_create_timeout = \"$ENDPOINT_CREATE_TIMEOUT\""
    [[ -n "$ENDPOINT_UPDATE_TIMEOUT" ]] && echo "endpoint_update_timeout = \"$ENDPOINT_UPDATE_TIMEOUT\""
    [[ -n "$ENDPOINT_DELETE_TIMEOUT" ]] && echo "endpoint_delete_timeout = \"$ENDPOINT_DELETE_TIMEOUT\""

    # Deployed index settings
    [[ -n "$DEPLOYED_INDEX_ID" ]] && echo "deployed_index_id = \"$DEPLOYED_INDEX_ID\""
    [[ -n "$DEPLOYED_INDEX_DEDICATED_MIN_REPLICAS" ]] && echo "deployed_index_dedicated_min_replicas = $DEPLOYED_INDEX_DEDICATED_MIN_REPLICAS"
    [[ -n "$DEPLOYED_INDEX_DEDICATED_MAX_REPLICAS" ]] && echo "deployed_index_dedicated_max_replicas = $DEPLOYED_INDEX_DEDICATED_MAX_REPLICAS"
    [[ -n "$DEPLOYED_INDEX_AUTOMATIC_MIN_REPLICAS" ]] && echo "deployed_index_automatic_min_replicas = $DEPLOYED_INDEX_AUTOMATIC_MIN_REPLICAS"
    [[ -n "$DEPLOYED_INDEX_AUTOMATIC_MAX_REPLICAS" ]] && echo "deployed_index_automatic_max_replicas = $DEPLOYED_INDEX_AUTOMATIC_MAX_REPLICAS"
    [[ -n "$DEPLOYED_INDEX_RESERVED_IP_RANGES" ]] && echo "deployed_index_reserved_ip_ranges = $DEPLOYED_INDEX_RESERVED_IP_RANGES"
    [[ -n "$DEPLOYED_INDEX_CREATE_TIMEOUT" ]] && echo "deployed_index_create_timeout = \"$DEPLOYED_INDEX_CREATE_TIMEOUT\""
    [[ -n "$DEPLOYED_INDEX_UPDATE_TIMEOUT" ]] && echo "deployed_index_update_timeout = \"$DEPLOYED_INDEX_UPDATE_TIMEOUT\""
    [[ -n "$DEPLOYED_INDEX_DELETE_TIMEOUT" ]] && echo "deployed_index_delete_timeout = \"$DEPLOYED_INDEX_DELETE_TIMEOUT\""
  } >> terraform.tfvars

  # Display terraform.tfvars for verification
  echo "  📄 Contents of terraform.tfvars:"
  if [ -f terraform.tfvars ]; then
    cat terraform.tfvars
  else
    echo "  ⚠️ Warning: terraform.tfvars file not found!"
  fi
}

#------------------------------------------------------------------------------
# Extract outputs from Terraform
#------------------------------------------------------------------------------
function extract_terraform_outputs() {
  echo "  🔍 Extracting Vector Search configuration..."
  
  # Set basic outputs
  VS_DEPLOYED_INDEX_ID=$(terraform output -raw vector_search_deployed_index_id)
  VS_INDEX_ENDPOINT_ID=$(terraform output -raw vector_search_endpoint_id)
  export VS_DIMENSIONS=${INDEX_DIMENSIONS}
  export VS_DEPLOYED_INDEX_ID
  export VS_INDEX_ENDPOINT_ID

  # Get public endpoint if available
  if terraform output -raw vector_search_public_endpoint &>/dev/null; then
    VS_PUBLIC_ENDPOINT=$(terraform output -raw vector_search_public_endpoint)
    export VS_ENDPOINT_HOST="${VS_PUBLIC_ENDPOINT}"
    echo "  📡 Public endpoint is available at: ${VS_PUBLIC_ENDPOINT}"
  else
    echo "  📝 Public endpoint is not available (expected with private endpoints)"
    export VS_ENDPOINT_HOST=""
  fi
}

#------------------------------------------------------------------------------
# Create Locust configuration file
#------------------------------------------------------------------------------
function create_locust_config() {
  echo "📝 Creating Locust configuration file..."
  
  # Create base locust_config.env with common settings
  cat <<EOF > config/locust_config.env
INDEX_DIMENSIONS=${VS_DIMENSIONS}
DEPLOYED_INDEX_ID=${VS_DEPLOYED_INDEX_ID}
INDEX_ENDPOINT_ID=${VS_INDEX_ENDPOINT_ID}
ENDPOINT_HOST=${VS_ENDPOINT_HOST}
PROJECT_ID=${PROJECT_ID}
PROJECT_NUMBER=${PROJECT_NUMBER}
ENDPOINT_ACCESS_TYPE=${ENDPOINT_ACCESS_TYPE}
EOF

  # Add blended search settings if enabled
  if [[ "$blended_search" == "y" ]]; then
    cat <<EOF >> config/locust_config.env
SPARSE_EMBEDDING_NUM_DIMENSIONS=${SPARSE_EMBEDDING_NUM_DIMENSIONS}
SPARSE_EMBEDDING_NUM_DIMENSIONS_WITH_VALUES=${SPARSE_EMBEDDING_NUM_DIMENSIONS_WITH_VALUES}
DENSE_EMBEDDING_NUM_DIMENSIONS=${VS_DIMENSIONS}
EOF
  fi

  # Add network-specific configuration
  add_network_specific_config
  
  # Display the contents of locust_config.env for verification
  echo "📄 Contents of locust_config.env:"
  cat config/locust_config.env
}

#------------------------------------------------------------------------------
# Add network-specific configuration to Locust config
#------------------------------------------------------------------------------
function add_network_specific_config() {
  # If using public endpoints, just set flags and exit early
  if [[ "${ENDPOINT_ACCESS_TYPE}" != "private_service_connect" && "${ENDPOINT_ACCESS_TYPE}" != "vpc_peering" ]]; then
    echo "  📝 Using public endpoint configuration"
    echo "PSC_ENABLED=false" >> config/locust_config.env
    echo "VPC_PEERING_ENABLED=false" >> config/locust_config.env
    return 0
  fi
  
  # For private endpoints (PSC or VPC peering)
  echo "  🔄 Extracting private networking configuration..."
  pushd terraform
  
  # Set PSC or VPC peering flags based on endpoint type
  if [[ "${ENDPOINT_ACCESS_TYPE}" == "private_service_connect" ]]; then
    setup_psc_config
  else
    setup_vpc_peering_config
  fi
  
  # Get common gRPC address for both PSC and VPC peering
  setup_grpc_address
  
  popd
}

#------------------------------------------------------------------------------
# Helper function for PSC configuration
#------------------------------------------------------------------------------
function setup_psc_config() {
  echo "PSC_ENABLED=true" >> ../config/locust_config.env
  echo "VPC_PEERING_ENABLED=false" >> ../config/locust_config.env
  
  # Get service attachment (required for PSC)
  if terraform output -raw vector_search_service_attachment &>/dev/null; then
    local service_attachment
    service_attachment=$(terraform output -raw vector_search_service_attachment)
    echo "  📝 Service Attachment: ${service_attachment}"
    echo "SERVICE_ATTACHMENT=${service_attachment}" >> ../config/locust_config.env
  else
    echo "  ⚠️ Warning: No service attachment found (required for PSC)"
  fi
  
  # Get PSC IP address
  if terraform output -raw psc_address_ip &>/dev/null; then
    local psc_ip
    local psc_ip_with_port
    psc_ip=$(terraform output -raw psc_address_ip)
    psc_ip_with_port="${psc_ip}:10000"
    echo "  📝 PSC IP Address: ${psc_ip}"
    echo "PSC_IP_ADDRESS=${psc_ip_with_port}" >> ../config/locust_config.env
  else
    echo "  ⚠️ Warning: No PSC IP address found"
  fi
}

#------------------------------------------------------------------------------
# Helper function for VPC peering configuration
#------------------------------------------------------------------------------
function setup_vpc_peering_config() {
  echo "PSC_ENABLED=false" >> ../config/locust_config.env
  echo "VPC_PEERING_ENABLED=true" >> ../config/locust_config.env
  
  # Get VPC peering connection info
  if terraform output -raw vector_search_private_endpoints_connection &>/dev/null; then
    local private_endpoint
    private_endpoint=$(terraform output -raw vector_search_private_endpoints_connection)
    echo "  📝 VPC Peering Connection: ${private_endpoint}"
    echo "PRIVATE_ENDPOINT=${private_endpoint}" >> ../config/locust_config.env
  else
    echo "  📝 Note: No specific VPC peering endpoint information found"
  fi
}

#------------------------------------------------------------------------------
# Helper function to set up GRPC address
#------------------------------------------------------------------------------
function setup_grpc_address() {
  if terraform output -raw vector_search_match_grpc_address &>/dev/null; then
    local match_raw
    local grpc_address
    match_raw=$(terraform output -raw vector_search_match_grpc_address)
    
    grpc_address=""
    # Add port if not already present
    if [[ "$match_raw" != *":"* && -n "$match_raw" ]]; then
      grpc_address="${match_raw}:10000"
    else
      grpc_address="$match_raw"
    fi
    
    echo "  📝 gRPC Address: ${grpc_address}"
    echo "MATCH_GRPC_ADDRESS=${grpc_address}" >> ../config/locust_config.env
  else
    echo "  ⚠️ Warning: No gRPC address found (required for private endpoints)"
  fi
}

#------------------------------------------------------------------------------
# Build and push Docker image
#------------------------------------------------------------------------------
function build_and_push_docker_image() {
  echo "🔄 Building and pushing Docker image to Google Cloud..."
  echo "   (This may take several minutes depending on your connection speed)"
  gcloud builds submit --project="${PROJECT_ID}" --tag "${DOCKER_IMAGE}"
  echo "  ✅ Docker image built and pushed successfully to: ${DOCKER_IMAGE}"
}

#------------------------------------------------------------------------------
# Deploy remaining infrastructure
#------------------------------------------------------------------------------
function deploy_remaining_infrastructure() {
  echo "🚀 Deploying Kubernetes cluster and Locust resources..."
  echo "   (This can take 10-15 minutes to complete)"
  pushd terraform

  # Select workspace and apply Terraform
  terraform workspace select "$DEPLOYMENT_ID"
  echo "  🔄 Deploying GKE cluster and Locust in workspace: $DEPLOYMENT_ID"
  echo "      (Progress will be shown below)"
  terraform apply --auto-approve

  # Extract deployment outputs
  extract_deployment_outputs
  
  echo "  ✅ Kubernetes cluster and Locust resources deployed successfully!"
  popd
}

#------------------------------------------------------------------------------
# Apply Terraform with automatic handling of Kubernetes connection errors
#------------------------------------------------------------------------------
function deploy_remaining_infrastructure_with_k8s_error_handling() {
  echo "🚀 Deploying Kubernetes cluster and Locust resources..."
  echo "   (This can take 10-15 minutes to complete)"
  pushd terraform

  # Check if this is a re-deployment by looking for existing state file
  local state_file
  state_file="../${DEPLOYMENT_ID}_state.sh"
  if [ -f "$state_file" ]; then
    echo "  🔍 Found existing deployment state file"
    # shellcheck disable=1090
    source "$state_file"
    
    # If we have a cluster name from previous deployment, configure kubectl
    if [[ -n "$DEPLOYED_CLUSTER_NAME" ]]; then
      echo "  🔄 Configuring kubectl for existing cluster: $DEPLOYED_CLUSTER_NAME"
      gcloud container clusters get-credentials "$DEPLOYED_CLUSTER_NAME" --project="${PROJECT_ID}" --location="${REGION}"
    fi
  fi

  # Select workspace and apply Terraform
  terraform workspace select "$DEPLOYMENT_ID"
  echo "  🔄 Deploying GKE cluster and Locust in workspace: $DEPLOYMENT_ID"
  echo "      (Progress will be shown below)"
  
  # Run terraform apply and capture output for error analysis
  terraform_output_file="terraform_apply_output.log"
  terraform apply --auto-approve 2>&1 | tee $terraform_output_file
  TF_APPLY_EXIT_CODE=${PIPESTATUS[0]}
  
  # If the apply failed, check if it's a K8s connection issue
  if [ "$TF_APPLY_EXIT_CODE" -ne 0 ]; then
    echo "  ⚠️ Detected errors in terraform apply (exit code $TF_APPLY_EXIT_CODE)"
    
    # Check if there is a kubernetes connection error
    if grep -q "dial tcp \\[::1\\]:80: connect: connection refused" $terraform_output_file || 
       grep -q "transport: Error while dialing" $terraform_output_file; then
      
      echo "  🔍 Identified Kubernetes connection error - attempting automatic fix"
      
      # Try to get the cluster name even if apply failed
      DEPLOYMENT_CLUSTER_NAME=$(terraform output -raw gke_cluster_name 2>/dev/null || true)
      
      if [[ -n "$DEPLOYMENT_CLUSTER_NAME" ]]; then
        echo "  🔄 Configuring kubectl for cluster: $DEPLOYMENT_CLUSTER_NAME"
        gcloud container clusters get-credentials "$DEPLOYMENT_CLUSTER_NAME" --project="${PROJECT_ID}" --location="${REGION}"
      fi
      
      # Remove problematic Kubernetes resources from state
      echo "  🔄 Removing problematic Kubernetes resources from state..."
      terraform state rm 'module.gke_autopilot.kubernetes_namespace.locust_namespace' || true
      terraform state rm 'module.gke_autopilot.kubernetes_service_account.locust_service_account' || true
      terraform state rm 'module.gke_autopilot.kubernetes_config_map.locust_config' || true
      terraform state rm 'module.gke_autopilot.kubernetes_deployment.locust_master' || true
      terraform state rm 'module.gke_autopilot.kubernetes_deployment.locust_worker' || true
      terraform state rm 'module.gke_autopilot.kubernetes_service.locust_master' || true
      terraform state rm 'module.gke_autopilot.kubernetes_service.locust_master_web' || true
      terraform state rm 'module.gke_autopilot.kubernetes_horizontal_pod_autoscaler.locust_worker_autoscaler' || true
      
      # Try applying again
      echo "  🔄 Retrying terraform apply..."
      terraform apply --auto-approve
      TF_RETRY_EXIT_CODE=$?
      
      if [ $TF_RETRY_EXIT_CODE -ne 0 ]; then
        echo "  ❌ Error: Terraform apply still failed after fixing Kubernetes connection"
        echo "     Exiting deployment process."
        exit $TF_RETRY_EXIT_CODE
      else
        echo "  ✅ Terraform retry succeeded!"
      fi
    else
      echo "  ❌ Error: Terraform apply failed with errors unrelated to Kubernetes connectivity"
      echo "     Please check the error messages above for details."
      exit "$TF_APPLY_EXIT_CODE"
    fi
  fi
  
  # Extract deployment outputs
  echo "  🔍 Extracting deployment information..."
  extract_deployment_outputs
  
  echo "  ✅ Infrastructure deployment process completed!"
  # Clean up temporary file
  rm -f $terraform_output_file
  popd
}

#------------------------------------------------------------------------------
# Extract deployment outputs
#------------------------------------------------------------------------------
function extract_deployment_outputs() {
  echo "  🔍 Extracting deployment outputs..."
  
  # Initialize variables
  DEPLOYED_CLUSTER_SVC=""
  DEPLOYED_CLUSTER_MAIN_NODE=""
  DEPLOYED_CLUSTER_NAME=""
  NGINX_PROXY_NAME=""
  LOCUST_NAMESPACE=""

  # Get cluster name
  if terraform output -raw gke_cluster_name &>/dev/null; then
    DEPLOYED_CLUSTER_NAME=$(terraform output -raw gke_cluster_name)
    # Currently in terraform directory.
    cat << EOF >> "../${DEPLOYMENT_ID}_state.sh"
DEPLOYED_CLUSTER_NAME="${DEPLOYED_CLUSTER_NAME}"
EOF
    echo "  📝 GKE Cluster name: $DEPLOYED_CLUSTER_NAME"
  fi

  # Configure kubectl if we have a cluster name
  if [[ -n "$DEPLOYED_CLUSTER_NAME" ]]; then
    echo "  🔄 Configuring kubectl..."
    gcloud container clusters get-credentials "$DEPLOYED_CLUSTER_NAME" --project="${PROJECT_ID}" --location="${REGION}"
  else
    echo "  ⚠️ Warning: Unable to get GKE cluster name, skipping kubectl configuration"
  fi

# Get service name
  if terraform output -raw locust_master_svc_name &>/dev/null; then
    DEPLOYED_CLUSTER_SVC=$(terraform output -raw locust_master_svc_name)
    echo "  📝 GKE Cluster service: $DEPLOYED_CLUSTER_SVC"
  fi

  # Get main node name
  if terraform output -raw locust_master_node_name &>/dev/null; then
    DEPLOYED_CLUSTER_MAIN_NODE=$(terraform output -raw locust_master_node_name)
    echo "  📝 GKE Cluster main node: $DEPLOYED_CLUSTER_MAIN_NODE"
  fi

  # Get NGINX proxy name
  if terraform output -raw nginx_proxy_name &>/dev/null; then
    NGINX_PROXY_NAME=$(terraform output -raw nginx_proxy_name)
    echo "  📝 NGINX proxy name: $NGINX_PROXY_NAME"
  fi

  # Get the namespace where resources are deployed
  if terraform output -raw locust_namespace &>/dev/null; then
    LOCUST_NAMESPACE=$(terraform output -raw locust_namespace)
    echo "  📝 Locust resources namespace: $LOCUST_NAMESPACE"
  else
    # Fallback - construct the namespace based on deployment ID
    LOCUST_NAMESPACE="${DEPLOYMENT_ID}-ns"
    LOCUST_NAMESPACE="${LOCUST_NAMESPACE//[^a-zA-Z0-9-]/-}"
    LOCUST_NAMESPACE="${LOCUST_NAMESPACE,,}"
    echo "  📝 Using constructed namespace: $LOCUST_NAMESPACE"
  fi
  
  # Export for later use
  export DEPLOYED_CLUSTER_SVC
  export DEPLOYED_CLUSTER_MAIN_NODE
  export DEPLOYED_CLUSTER_NAME
  export NGINX_PROXY_NAME
  export LOCUST_NAMESPACE
}

#------------------------------------------------------------------------------
# Verify deployment
#------------------------------------------------------------------------------
function verify_deployment() {
  echo "🔍 Verifying deployment status..."
  echo "   Checking Kubernetes deployments in namespace: $LOCUST_NAMESPACE"
  kubectl -n "$LOCUST_NAMESPACE" get deployments
  
  echo
  echo "======================================================================"
  echo "🎉 DEPLOYMENT COMPLETE! 🎉"
  echo "======================================================================"
  echo
  echo "Your Vector Search load testing environment has been successfully deployed."
  
  # Provide access instructions based on external IP preference
  if [[ "${TF_VAR_create_external_ip}" == "true" ]]; then
    # Get external IP from Terraform output
    pushd terraform
    EXTERNAL_IP=$(terraform output -raw locust_external_ip 2>/dev/null)
    popd
    
    if [ -n "$EXTERNAL_IP" ]; then
      echo
      echo "🌐 ACCESS INFORMATION:"
      echo "   Locust UI is available at: http://$EXTERNAL_IP:8089"
      echo "   Open the above URL in your browser to access the load testing interface."
    else
      # Fallback to kubectl if terraform output fails
      EXTERNAL_IP=$(kubectl -n "$LOCUST_NAMESPACE" get svc "${DEPLOYED_CLUSTER_SVC}" -o jsonpath='{.status.loadBalancer.ingress[0].ip}' 2>/dev/null)
      if [ -n "$EXTERNAL_IP" ]; then
        echo
        echo "🌐 ACCESS INFORMATION:"
        echo "   Locust UI is available at: http://$EXTERNAL_IP:8089"
        echo "   Open the above URL in your browser to access the load testing interface."
      else
        echo
        echo "⚠️ External IP was requested but could not be retrieved."
        echo "   Please check the service status manually with:"
        echo "   kubectl -n $LOCUST_NAMESPACE get svc ${DEPLOYED_CLUSTER_SVC}"
      fi
    fi
  else
    echo
    echo "🔒 ACCESS INFORMATION:"
    echo "   Locust UI is configured for secure tunneling."
    echo "   To access the Locust UI, open a new terminal and run this command:"
    echo "   ─────────────────────────────────────────────────────────────────"
    echo "   gcloud compute ssh ${NGINX_PROXY_NAME} --project ${PROJECT_ID} --zone ${ZONE} -- -NL 8089:localhost:8089"
    echo "   ─────────────────────────────────────────────────────────────────"
    echo
    echo "   Then open http://localhost:8089 in your browser"
    echo "   (Keep the terminal window open while using Locust)"
  fi
  
  echo
  echo "Use the Locust UI to configure and run your load tests."
  echo
  echo "To save this deployment information for later reference, the details"
  echo "have been saved to: ${DEPLOYMENT_ID}_state.sh"
  echo "======================================================================"
}

# Call the main function to execute the script
main
