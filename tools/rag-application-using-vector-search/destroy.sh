#!/bin/bash
set -e

function main() {
  load_configuration
  delete_application
  delete_corpus
  delete_vector_search
}

function load_configuration() {
  local CONFIG_FILE
  CONFIG_FILE="config.sh"
  
  if [[ ! -f $CONFIG_FILE ]]; then
    echo "❌ Configuration file $CONFIG_FILE not found!"
    echo "   Please copy config.template.sh to config.sh and update with your settings."
    exit 1
  fi

  echo "✅ Found configuration file. Loading settings..."
  # shellcheck disable=1090
  source "$CONFIG_FILE"
}

function delete_corpus() {
  echo "Deleting RAG Corpus..."

  local CORPUS_NAME
  CORPUS_NAME=$(curl -sS -X GET \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $(gcloud auth print-access-token)" \
    "https://${REGION}-aiplatform.googleapis.com/v1beta1/projects/${PROJECT_ID}/locations/${REGION}/ragCorpora" | \
    jq --arg dn "$RAG_CORPUS_DISPLAY_NAME" -r '.ragCorpora[] | select(.displayName == $dn) | .name')

  if [[ -n "$CORPUS_NAME" ]]; then
    curl -X DELETE \
      -H "Authorization: Bearer $(gcloud auth print-access-token)" \
      "https://${REGION}-aiplatform.googleapis.com/v1beta1/${CORPUS_NAME}?force=true"

    while [[ -n "$CORPUS_NAME" ]]
    do
      sleep 60
      echo "Deleting RAG Corpus..."
      CORPUS_NAME=$(curl -sS -X GET \
        -H "Content-Type: application/json" \
        -H "Authorization: Bearer $(gcloud auth print-access-token)" \
        "https://${REGION}-aiplatform.googleapis.com/v1beta1/projects/${PROJECT_ID}/locations/${REGION}/ragCorpora" | \
        jq --arg dn "$RAG_CORPUS_DISPLAY_NAME" -r '.ragCorpora[] | select(.displayName == $dn) | .name')
    done
  fi
  echo "✅ Successfully deleted RAG Corpus."
}

function select_terraform_workspace() {
  # Check if the workspace exists
  if terraform workspace list | grep -q "$DEPLOYMENT_ID"; then
    # Workspace exists, switch to it
    echo "  ➡️ Workspace '$DEPLOYMENT_ID' exists. Switching to it..."
    terraform workspace select "$DEPLOYMENT_ID"
  else
    # Workspace doesn't exist.
    echo "  ➡️ Workspace '$DEPLOYMENT_ID' does not exist."
    exit 0
  fi

  # Verify the current workspace
  current_workspace=$(terraform workspace show)
  echo "  ✅ Current Terraform workspace: $current_workspace"
}

function delete_application() {
  echo "Deleting Application"
  pushd terraform/application

  # Select terraform workspace
  select_terraform_workspace

  # Standard destroy
  terraform destroy --auto-approve

  # Delete workspace
  terraform workspace select default
  terraform workspace delete "$DEPLOYMENT_ID"

  popd

  echo " ✅ Successfully deleted Application"
}

function delete_vector_search() {
  echo "Deleting Vector Search Index."
  pushd terraform/vertex_ai_vector_search

  # Select terraform workspace
  select_terraform_workspace

  # Standard destroy
  terraform destroy --auto-approve

  # Delete workspace 
  terraform workspace select default
  terraform workspace delete "$DEPLOYMENT_ID"

  popd
  echo " ✅ Successfully deleted Vector Search."
}


main