#!/bin/bash

set -e  # Exit on any error

function main() {
  load_configuration
  enable_gcp_services
  deploy_vector_search
  create_rag_corpus
  configure_docker_for_artifact_registry
  deploy_application
}

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

function enable_gcp_services() {
  echo "🔄 Enabling required Google Cloud services (this may take a minute)..."
  
  gcloud services enable aiplatform.googleapis.com \
    artifactregistry.googleapis.com \
    cloudbuild.googleapis.com \
    firestore.googleapis.com \
    container.googleapis.com \
    iamcredentials.googleapis.com \
    cloudscheduler.googleapis.com \
    run.googleapis.com \
    documentai.googleapis.com \
    storage.googleapis.com \
    iam.googleapis.com \
    --project="${PROJECT_ID}"
    
  echo "  ✅ Cloud services enabled successfully"
}

function deploy_vector_search() {
  echo "🚀 Deploying Vector Search infrastructure..."
  echo "   (This can take 5-180 minutes depending on the size of your dataset. Now might be a good time for coffee ☕)"
  pushd terraform/vertex_ai_vector_search

  # Setup Terraform workspace
  setup_terraform_workspace
  
  # Create terraform.tfvars file
  create_vector_search_terraform_vars
  
  # Run Terraform
  echo "  🔄 Initializing Terraform..."
  terraform init

  echo "  🔄 Deploying Vector Search in workspace: $DEPLOYMENT_ID"
  echo "      (Progress will be shown below)"
  terraform apply --auto-approve
  
  # Extract output values
  extract_vector_search_terraform_outputs
  
  echo "  ✅ Vector Search deployment completed successfully!"
  popd
}

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

function create_vector_search_terraform_vars() {
  PROJECT_NUMBER=$(gcloud projects describe "$PROJECT_ID" --format="value(projectNumber)")
  export PROJECT_NUMBER

  echo "  📝 Creating terraform.tfvars file..."
  
  # Start with an empty file
  : > terraform.tfvars
  
  {
    # Add basic variables
    echo "project_id = \"${PROJECT_ID}\""
    echo "region = \"${REGION}\""
    echo "deployment_id = \"${DEPLOYMENT_ID}\""

    # Add other required settings
    echo ""
    echo "index_dimensions = ${INDEX_DIMENSIONS}"
    echo "deployed_index_resource_type = \"${DEPLOYED_INDEX_RESOURCE_TYPE:-dedicated}\""
    echo "deployed_index_dedicated_machine_type = \"${DEPLOYED_INDEX_DEDICATED_MACHINE_TYPE:-e2-standard-16}\""

    # Add all optional variables
    echo ""
    echo "# Optional variables"
    
    # Index settings
    [[ -n "$INDEX_DISPLAY_NAME" ]] && echo "index_display_name = \"$INDEX_DISPLAY_NAME\""
    [[ -n "$INDEX_DESCRIPTION" ]] && echo "index_description = \"$INDEX_DESCRIPTION\""
    
    [[ -n "$INDEX_APPROXIMATE_NEIGHBORS_COUNT" ]] && echo "index_approximate_neighbors_count = $INDEX_APPROXIMATE_NEIGHBORS_COUNT"
    [[ -n "$INDEX_DISTANCE_MEASURE_TYPE" ]] && echo "index_distance_measure_type = \"$INDEX_DISTANCE_MEASURE_TYPE\""
    [[ -n "$INDEX_SHARD_SIZE" ]] && echo "index_shard_size = \"$INDEX_SHARD_SIZE\""
    
    [[ -n "$FEATURE_NORM_TYPE" ]] && echo "feature_norm_type = \"$FEATURE_NORM_TYPE\""
    [[ -n "$INDEX_ALGORITHM_CONFIG_TYPE" ]] && echo "index_algorithm_config_type = \"$INDEX_ALGORITHM_CONFIG_TYPE\""
    [[ -n "$INDEX_TREE_AH_LEAF_NODE_EMBEDDING_COUNT" ]] && echo "index_tree_ah_leaf_node_embedding_count = $INDEX_TREE_AH_LEAF_NODE_EMBEDDING_COUNT"
    [[ -n "$INDEX_TREE_AH_LEAF_NODES_TO_SEARCH_PERCENT" ]] && echo "index_tree_ah_leaf_nodes_to_search_percent = $INDEX_TREE_AH_LEAF_NODES_TO_SEARCH_PERCENT"

    # Endpoint settings
    [[ -n "$ENDPOINT_DISPLAY_NAME" ]] && echo "endpoint_display_name = \"$ENDPOINT_DISPLAY_NAME\""
    [[ -n "$ENDPOINT_DESCRIPTION" ]] && echo "endpoint_description = \"$ENDPOINT_DESCRIPTION\""
    [[ -n "$ENDPOINT_CREATE_TIMEOUT" ]] && echo "endpoint_create_timeout = \"$ENDPOINT_CREATE_TIMEOUT\""
    [[ -n "$ENDPOINT_UPDATE_TIMEOUT" ]] && echo "endpoint_update_timeout = \"$ENDPOINT_UPDATE_TIMEOUT\""
    [[ -n "$ENDPOINT_DELETE_TIMEOUT" ]] && echo "endpoint_delete_timeout = \"$ENDPOINT_DELETE_TIMEOUT\""

    # Deployed index settings
    [[ -n "$DEPLOYED_INDEX_ID" ]] && echo "deployed_index_id = \"$DEPLOYED_INDEX_ID\""
    [[ -n "$DEPLOYED_INDEX_DEDICATED_MIN_REPLICAS" ]] && echo "deployed_index_dedicated_min_replicas = $DEPLOYED_INDEX_DEDICATED_MIN_REPLICAS"
    [[ -n "$DEPLOYED_INDEX_DEDICATED_MAX_REPLICAS" ]] && echo "deployed_index_dedicated_max_replicas = $DEPLOYED_INDEX_DEDICATED_MAX_REPLICAS"
    [[ -n "$DEPLOYED_INDEX_AUTOMATIC_MIN_REPLICAS" ]] && echo "deployed_index_automatic_min_replicas = $DEPLOYED_INDEX_AUTOMATIC_MIN_REPLICAS"
    [[ -n "$DEPLOYED_INDEX_AUTOMATIC_MAX_REPLICAS" ]] && echo "deployed_index_automatic_max_replicas = $DEPLOYED_INDEX_AUTOMATIC_MAX_REPLICAS"
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

function extract_vector_search_terraform_outputs() {
  echo "  🔍 Extracting Vector Search configuration..."
  
  # Set basic outputs
  local VS_INDEX_ID
  local VS_INDEX_ENDPOINT_ID
  VS_INDEX_ID=$(terraform output -raw index_id)
  VS_INDEX_ENDPOINT_ID=$(terraform output -raw endpoint_id)
  VS_INDEX_NAME="projects/${PROJECT_NUMBER}/locations/${REGION}/indexes/$(echo "$VS_INDEX_ID" | awk -F'/' '{print $NF}')"
  export VS_INDEX_NAME
  VS_INDEX_ENDPOINT_NAME="projects/${PROJECT_NUMBER}/locations/${REGION}/indexEndpoints/$(echo "$VS_INDEX_ENDPOINT_ID" | awk -F'/' '{print $NF}')"
  export VS_INDEX_ENDPOINT_NAME
}

function create_rag_corpus() {
  CORPUS_NAME=$(curl -sS -X GET \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $(gcloud auth print-access-token)" \
  "https://${REGION}-aiplatform.googleapis.com/v1beta1/projects/${PROJECT_ID}/locations/${REGION}/ragCorpora" | \
  jq --arg dn "$RAG_CORPUS_DISPLAY_NAME" -r '.ragCorpora[] | select(.displayName == $dn) | .name')
  
  export CORPUS_NAME

  if [[ -n "$CORPUS_NAME" ]]; then
    echo "  ✅ RAG corpus already exists: $CORPUS_NAME"
    return
  fi

  curl \
  -X POST \
  -H "Authorization: Bearer $(gcloud auth print-access-token)" \
  -H "Content-Type: application/json" \
  "https://${REGION}-aiplatform.googleapis.com/v1beta1/projects/${PROJECT_ID}/locations/${REGION}/ragCorpora" \
  -d @<(
  cat << EOF
{
  "displayName": "$RAG_CORPUS_DISPLAY_NAME",
  "vectorDbConfig": {
    "ragEmbeddingModelConfig": {
      "vertexPredictionEndpoint": {
        "endpoint": "$TEXT_EMBEDDING_MODEL"
      }
    },
    "vertexVectorSearch": {
      "indexEndpoint": "$VS_INDEX_ENDPOINT_NAME",
      "index": "$VS_INDEX_NAME"
    }
  }
}
EOF
  )

  CORPUS_NAME=$(curl -sS -X GET \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $(gcloud auth print-access-token)" \
  "https://${REGION}-aiplatform.googleapis.com/v1beta1/projects/${PROJECT_ID}/locations/${REGION}/ragCorpora" | \
  jq --arg dn "$RAG_CORPUS_DISPLAY_NAME" -r '.ragCorpora[] | select(.displayName == $dn) | .name')

  export CORPUS_NAME
}

function configure_docker_for_artifact_registry() {
  echo "Configure Docker for the artifact registory: ${REGION}-docker.pkg.dev"

  gcloud auth configure-docker "${REGION}"-docker.pkg.dev
}

function deploy_application() {
  echo "  📝 Adding RAG application related variables to terraform.tfvars file..."
  pushd terraform/application

  # Setup Terraform workspace
  setup_terraform_workspace

  create_application_terraform_vars

  # Run Terraform
  echo "  🔄 Initializing Terraform..."
  terraform init

  echo "  🔄 Deploying Application in workspace: $DEPLOYMENT_ID"
  echo "      (Progress will be shown below)"
  terraform apply --auto-approve
  
  extract_application_terraform_outputs
  
  echo "  ✅ Application deployment completed successfully!"
  popd
}

function create_application_terraform_vars() {
  PROJECT_NUMBER=$(gcloud projects describe "$PROJECT_ID" --format="value(projectNumber)")
  export PROJECT_NUMBER
  export RAG_ENGINE_SERVICE_ACCOUNT="service-${PROJECT_NUMBER}@gcp-sa-vertex-rag.iam.gserviceaccount.com"
  : > terraform.tfvars
  {
    # Add basic variables
    echo "project_id = \"${PROJECT_ID}\""
    echo "project_number = \"${PROJECT_NUMBER}\""
    echo "region = \"${REGION}\""
    echo "deployment_id = \"${DEPLOYMENT_ID}\""

    echo "corpus_name = \"${CORPUS_NAME}\""
    echo "rag_engine_service_account = \"${RAG_ENGINE_SERVICE_ACCOUNT}\""
  } >> terraform.tfvars

   # Display terraform.tfvars for verification
  echo "  📄 Contents of terraform.tfvars:"
  if [ -f terraform.tfvars ]; then
    cat terraform.tfvars
  else
    echo "  ⚠️ Warning: terraform.tfvars file not found!"
  fi
}

function extract_application_terraform_outputs() {
  echo "  🔍 Extracting Application related terraform outputs..."

  terraform output -raw frontend_service_uri
  terraform output -raw backend_service_uri
  terraform output -raw lro_database_id
  terraform output -raw import_result_sink
}

main