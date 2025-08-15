#!/bin/sh
set -eu

echo "Authenticating with gcloud..."
gcloud auth application-default login

echo "Deploying infrastructure with Terraform..."
cd infra_deployment || exit 1

echo "Initializing Terraform..."
terraform init

echo "Applying Terraform configuration..."
terraform apply --auto-approve

echo "Infrastructure deployment complete."
