# Automatic labelling

This directory comprises a [Terraform module](terraform-module) which
provisions infrastructure on Google Cloud Platform (GCP) to automatically
label resources as they are created.

## Requirements

### Provider Configuration

Refer to the
[Terraform Google Provider reference][terraform-google-provider-reference] for
instructions on configuring the GCP credentials, project, region, and zone.

### APIs

The following APIs must be enabled for the project:

- Cloud Resource Manager API
- Identity and Access Management API
- Service Usage API
- Cloud Pub/Sub API
- Cloud Functions API

### Roles

The following roles must be assigned to the account which will be provisioning
the infrastructure:

- Cloud Functions Developer
- Compute Viewer
- Service Account User
- Logs Configuration Writer
- Pub/Sub Admin
- Storage Admin

## Example

An [example module][example-module] is provided to demonstrate usage of this
module.

## Testing

The module is tested using [Kitchen-Terraform][kitchen-terraform]. The
[example module][example-module] is used as a test fixture so its requirements
must be met in order to successfully run the tests.

[kitchen-terraform]: https://github.com/newcontext-oss/kitchen-terraform
[terraform-module]: https://www.terraform.io/docs/modules/index.html
[terraform-google-provider-reference]: https://www.terraform.io/docs/providers/google/provider_reference.html
