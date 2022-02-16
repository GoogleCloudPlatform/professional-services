#!/bin/sh
echo "Validating Terraform"

terraform init -backend=false
terraform validate