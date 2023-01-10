# GCP Workload Identity Provider for Terraform Enterprise

This terraform code is a part of [GCP Workload Identity Federation for Terraform Enterprise](../) blueprint. For instructions please refer to the blueprint [readme](../README.md).

The codebase provisions the following list of resources:

- GCS Bucket
<!-- BEGIN TFDOC -->

## Variables

| name | description | type | required | default |
|---|---|:---:|:---:|:---:|
| [impersonate_service_account_email](variables.tf#L21) | Service account to be impersonated by workload identity. | <code>string</code> | ✓ |  |
| [project_id](variables.tf#L16) | GCP project ID. | <code>string</code> | ✓ |  |
| [workload_identity_pool_provider_id](variables.tf#L26) | GCP workload identity pool provider ID. | <code>string</code> | ✓ |  |

<!-- END TFDOC -->
