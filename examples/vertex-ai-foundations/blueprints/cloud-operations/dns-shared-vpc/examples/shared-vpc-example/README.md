# Usage

/!\ Requires Terraform version 12.20 at least. Visit https://releases.hashicorp.com/terraform/ to get it.

You need to add your own `terraform.tfvars` with the following values:
``` terraform
organization_id = "<YOUR ORG ID>"
billing_account = "<YOUR BILLING ACCOUNT ID>"
```

You should create a `backend.tf` file with the following configuration:
``` terraform
terraform {
  required_providers {
    google = ">= 3.51.0"
    google-beta = ">= 3.51.0"
  }

  backend "gcs" {
    bucket = "<YOUR BUCKET FOR THE TERRAFORM STATE>"
    prefix = "<NAME FOR THE TERRAFORM STATE FOLDER>"
  }
}
```

# Testing

Optionally, you can rename `test.example` into `test.tf`.
This file will create 2 VM instances and corresponding DNS records so you can easily test this solution.

# Clean Up

Run `terraform destroy` to clean up all resources created by this terraform code.
