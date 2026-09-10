#!/usr/bin/env bash
# Copyright 2026 Google LLC
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#     https://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

set -euo pipefail

# ==============================================================================
# Agent Builder to Google ADK Converter — Enterprise Deployment Automation
# ==============================================================================

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
TERRAFORM_DIR="${SCRIPT_DIR}/terraform"

# Tactical default parameters
PROJECT_ID="${PROJECT_ID:-$(gcloud config get-value project 2>/dev/null || true)}"
REGION="${REGION:-us-central1}"
SERVICE_NAME="${SERVICE_NAME:-agent-builder-to-adk-converter}"
REPO_NAME="${REPO_NAME:-agent-builder-to-adk-repo}"
ALLOW_UNAUTHENTICATED="${ALLOW_UNAUTHENTICATED:-false}"
USE_CLOUD_BUILD="${USE_CLOUD_BUILD:-true}"

echo "================================================================================"
echo "🚀 Deploying Agent Builder to Google ADK Converter (Enterprise PSO Solution)"
echo "================================================================================"

# Step 1: Parameter Validation
if [[ -z "${PROJECT_ID}" ]]; then
  echo "[-] ERROR: Google Cloud Project ID is not set."
  echo "    Set via environment variable: export PROJECT_ID=\"your-project-id\""
  echo "    Or configure gcloud: gcloud config set project \"your-project-id\""
  exit 1
fi

echo "[+] Target Project: ${PROJECT_ID}"
echo "[+] Target Region:  ${REGION}"
echo "[+] Service Name:   ${SERVICE_NAME}"
echo "[+] Repository:     ${REPO_NAME}"

# Step 2: Tooling Verification
echo "[+] Verifying local toolchain..."
command -v gcloud >/dev/null 2>&1 || { echo "[-] ERROR: gcloud CLI is required but not installed."; exit 1; }
command -v terraform >/dev/null 2>&1 || { echo "[-] ERROR: terraform CLI is required but not installed."; exit 1; }

# Step 3: Enable Required Google Cloud APIs
echo "[+] Enabling required Google Cloud APIs..."
gcloud services enable \
  run.googleapis.com \
  artifactregistry.googleapis.com \
  cloudbuild.googleapis.com \
  iam.googleapis.com \
  --project="${PROJECT_ID}"

# Step 4: Provision Artifact Registry Repository (if not already present)
echo "[+] Checking Artifact Registry repository '${REPO_NAME}'..."
if ! gcloud artifacts repositories describe "${REPO_NAME}" --location="${REGION}" --project="${PROJECT_ID}" >/dev/null 2>&1; then
  echo "[+] Creating Artifact Registry repository '${REPO_NAME}'..."
  gcloud artifacts repositories create "${REPO_NAME}" \
    --repository-format=docker \
    --location="${REGION}" \
    --description="Docker repository for Agent Builder to ADK Converter" \
    --project="${PROJECT_ID}"
else
  echo "[+] Repository '${REPO_NAME}' exists."
fi

IMAGE_URI="${REGION}-docker.pkg.dev/${PROJECT_ID}/${REPO_NAME}/${SERVICE_NAME}:latest"

# Step 5: Container Build and Publish
echo "[+] Building and publishing container image: ${IMAGE_URI}"
if [[ "${USE_CLOUD_BUILD}" == "true" ]]; then
  echo "[+] Submitting build to Cloud Build..."
  gcloud builds submit "${SCRIPT_DIR}" \
    --tag="${IMAGE_URI}" \
    --project="${PROJECT_ID}"
else
  echo "[+] Building container locally with Docker..."
  docker build -t "${IMAGE_URI}" "${SCRIPT_DIR}"
  gcloud auth configure-docker "${REGION}-docker.pkg.dev" --quiet
  docker push "${IMAGE_URI}"
fi

# Step 6: Provision Infrastructure via Terraform
echo "[+] Initializing and applying Terraform infrastructure..."
cat <<EOF > "${TERRAFORM_DIR}/terraform.tfvars"
project_id             = "${PROJECT_ID}"
region                 = "${REGION}"
service_name           = "${SERVICE_NAME}"
container_image        = "${IMAGE_URI}"
allow_unauthenticated  = ${ALLOW_UNAUTHENTICATED}
environment            = "production"
EOF

terraform -chdir="${TERRAFORM_DIR}" init -upgrade
terraform -chdir="${TERRAFORM_DIR}" apply -auto-approve

# Step 7: Service Verification
echo "[+] Extracting Cloud Run service URL..."
SERVICE_URL="$(terraform -chdir="${TERRAFORM_DIR}" output -raw cloud_run_url 2>/dev/null || true)"

echo "================================================================================"
echo "✅ Deployment Successful!"
echo "   Service URL: ${SERVICE_URL}"
echo "================================================================================"

if [[ -n "${SERVICE_URL}" && "${ALLOW_UNAUTHENTICATED}" == "true" ]]; then
  echo "[+] Probing health endpoint..."
  curl -sSf "${SERVICE_URL}/api/health" || echo "[!] Health probe returned non-200. Container may still be initializing."
  echo ""
fi
