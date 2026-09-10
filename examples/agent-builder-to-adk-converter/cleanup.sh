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
# Agent Builder to Google ADK Converter — Infrastructure Teardown
# ==============================================================================

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
TERRAFORM_DIR="${SCRIPT_DIR}/terraform"

FORCE=false
for arg in "$@"; do
  case $arg in
    -f|--force)
      FORCE=true
      shift
      ;;
  esac
done

echo "================================================================================"
echo "⚠️  Teardown: Agent Builder to Google ADK Converter Resources"
echo "================================================================================"

if [[ "${FORCE}" != "true" ]]; then
  read -r -p "Are you sure you want to destroy all provisioned infrastructure? [y/N] " response
  case "${response}" in
    [yY][eE][sS]|[yY])
      ;;
    *)
      echo "[*] Teardown aborted by operator."
      exit 0
      ;;
  esac
fi

if [[ -d "${TERRAFORM_DIR}/.terraform" || -f "${TERRAFORM_DIR}/terraform.tfstate" ]]; then
  echo "[+] Destroying Terraform resources..."
  terraform -chdir="${TERRAFORM_DIR}" destroy -auto-approve
  rm -f "${TERRAFORM_DIR}/terraform.tfvars"
  echo "[+] Terraform infrastructure destroyed."
else
  echo "[*] No active Terraform state detected in ${TERRAFORM_DIR}."
fi

echo "================================================================================"
echo "✅ Teardown Complete. All Cloud Run and IAM resources have been removed."
echo "================================================================================"
