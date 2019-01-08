# Automatic labelling

This directory comprises an example of a [Terraform module](terraform-module) which provisions infrastructure to
automatically label resources as they are created.

## Preparation

- Cloud Resource Manager API - cloudresourcemanager.googleapis.com
- Identity and Access Management API - iam.googleapis.com
- Service Usage API - serviceusage.googleapis.com
- roles/iam.admin
- roles/logging.configWriter
- roles/pubsub.admin
- roles/serviceusage.admin
- https://www.terraform.io/docs/providers/google/getting_started.html
- https://www.terraform.io/docs/providers/google/provider_reference.html#configuration-reference
- jq

## Usage

### IAM Roles

[terraform-module]: https://www.terraform.io/docs/modules/index.html

## Bugs

- https://github.com/terraform-providers/terraform-provider-google/issues/2762
