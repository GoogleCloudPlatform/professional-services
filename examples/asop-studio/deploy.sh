#!/usr/bin/env bash
# Copyright 2026 Google LLC
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#      http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

set -euo pipefail

# Colors for terminal output
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}=== ASOP Studio Automated Deployer ===${NC}"

TFVARS_FILE="terraform/terraform.tfvars"
PROJECT_ID="${PROJECT_ID:-}"
REGION="${REGION:-}"
SERVICE_NAME="${SERVICE_NAME:-}"

# Parse variables from terraform/terraform.tfvars if present and not overridden by env vars
if [ -f "$TFVARS_FILE" ]; then
  if [ -z "$PROJECT_ID" ]; then
    PROJECT_ID=$(grep -E '^[[:space:]]*project_id[[:space:]]*=' "$TFVARS_FILE" | sed -E 's/.*=[[:space:]]*"([^"]*)".*/\1/' || true)
  fi
  if [ -z "$REGION" ]; then
    REGION=$(grep -E '^[[:space:]]*region[[:space:]]*=' "$TFVARS_FILE" | sed -E 's/.*=[[:space:]]*"([^"]*)".*/\1/' || true)
  fi
  if [ -z "$SERVICE_NAME" ]; then
    SERVICE_NAME=$(grep -E '^[[:space:]]*service_name[[:space:]]*=' "$TFVARS_FILE" | sed -E 's/.*=[[:space:]]*"([^"]*)".*/\1/' || true)
  fi
fi

# Fall back to active gcloud project if PROJECT_ID is still empty
if [ -z "$PROJECT_ID" ]; then
  PROJECT_ID=$(gcloud config get-value project 2>/dev/null || true)
fi

if [ -z "$PROJECT_ID" ] || [ "$PROJECT_ID" = "(unset)" ]; then
  echo -e "${RED}Error: GCP Project ID not found.${NC}"
  echo -e "Set PROJECT_ID=<your-project-id>, configure 'gcloud config set project <your-project-id>', or create terraform/terraform.tfvars."
  exit 1
fi

REGION="${REGION:-us-central1}"
SERVICE_NAME="${SERVICE_NAME:-asop-studio}"
REPO_NAME="${SERVICE_NAME}-repo"

echo -e "Project ID:   ${GREEN}${PROJECT_ID}${NC}"
echo -e "Region:       ${GREEN}${REGION}${NC}"
echo -e "Service Name: ${GREEN}${SERVICE_NAME}${NC}"

TF_ARGS=(
  "-var=project_id=${PROJECT_ID}"
  "-var=region=${REGION}"
  "-var=service_name=${SERVICE_NAME}"
)

# Step 1: Initialize Terraform and ensure Artifact Registry repository exists
echo -e "\n${BLUE}[Step 1/4] Ensuring Artifact Registry repository exists...${NC}"
(
  cd terraform
  terraform init -input=false
  terraform apply -target=google_artifact_registry_repository.asop_repo "${TF_ARGS[@]}" -auto-approve
)

# Step 2: Build local Docker image
echo -e "\n${BLUE}[Step 2/4] Building production Docker image...${NC}"
IMAGE_URL="${REGION}-docker.pkg.dev/${PROJECT_ID}/${REPO_NAME}/${SERVICE_NAME}:latest"
DOCKER_BUILDKIT=1 docker build --platform linux/amd64 -t "$IMAGE_URL" .

# Step 3: Authenticate and push Docker image to Artifact Registry
echo -e "\n${BLUE}[Step 3/4] Authenticating and pushing Docker image to Artifact Registry...${NC}"
gcloud auth configure-docker "${REGION}-docker.pkg.dev" --quiet
docker push "$IMAGE_URL"

# Step 4: Deploy remaining infrastructure and update Cloud Run service
echo -e "\n${BLUE}[Step 4/4] Applying full Terraform configuration and updating Cloud Run...${NC}"
(
  cd terraform
  terraform apply "${TF_ARGS[@]}" -auto-approve
)

gcloud run services update "$SERVICE_NAME" \
  --image="$IMAGE_URL" \
  --region="$REGION" \
  --project="$PROJECT_ID" \
  --quiet

# Show App URL
echo -e "\n${GREEN}=== Deployment Complete! ===${NC}"
APP_URL=$(
  cd terraform || exit 1
  terraform output -raw app_url 2>/dev/null || true
)
echo -e "Access ASOP Studio at: ${BLUE}${APP_URL}${NC}"
