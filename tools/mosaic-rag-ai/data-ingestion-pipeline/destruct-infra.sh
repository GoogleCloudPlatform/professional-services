#!/bin/sh
set -eu

echo "Authenticating with gcloud..."
gcloud auth application-default login

echo "Destroying infrastructure with Terraform..."
cd infra_deployment || exit 1

echo "Initializing Terraform..."
terraform init

echo "Destroying Terraform-managed resources..."
terraform destroy --auto-approve

echo "Infrastructure destruction complete."
