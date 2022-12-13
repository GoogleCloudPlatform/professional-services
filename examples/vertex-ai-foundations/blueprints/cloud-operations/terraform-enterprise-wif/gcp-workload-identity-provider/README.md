# GCP Workload Identity Provider for Terraform Enterprise

This terraform code is a part of [GCP Workload Identity Federation for Terraform Enterprise](../) blueprint.

The codebase provisions the following list of resources:

- GCS Bucket
<!-- BEGIN TFDOC -->

## Variables

| name | description | type | required | default |
|---|---|:---:|:---:|:---:|
| [billing_account](variables.tf#L16) | Billing account id used as default for new projects. | <code>string</code> | ✓ |  |
| [project_id](variables.tf#L43) | Existing project id. | <code>string</code> | ✓ |  |
| [tfe_organization_id](variables.tf#L48) | TFE organization id. | <code>string</code> | ✓ |  |
| [tfe_workspace_id](variables.tf#L53) | TFE workspace id. | <code>string</code> | ✓ |  |
| [issuer_uri](variables.tf#L21) | Terraform Enterprise uri. Replace the uri if a self hosted instance is used. | <code>string</code> |  | <code>&#34;https:&#47;&#47;app.terraform.io&#47;&#34;</code> |
| [parent](variables.tf#L27) | Parent folder or organization in 'folders/folder_id' or 'organizations/org_id' format. | <code>string</code> |  | <code>null</code> |
| [project_create](variables.tf#L37) | Create project instead of using an existing one. | <code>bool</code> |  | <code>true</code> |
| [workload_identity_pool_id](variables.tf#L58) | Workload identity pool id. | <code>string</code> |  | <code>&#34;tfe-pool&#34;</code> |
| [workload_identity_pool_provider_id](variables.tf#L64) | Workload identity pool provider id. | <code>string</code> |  | <code>&#34;tfe-provider&#34;</code> |

## Outputs

| name | description | sensitive |
|---|---|:---:|
| [impersonate_service_account_email](outputs.tf#L16) | Service account to be impersonated by workload identity. |  |
| [project_id](outputs.tf#L21) | GCP Project ID. |  |
| [workload_identity_audience](outputs.tf#L26) | TFC Workload Identity Audience. |  |
| [workload_identity_pool_provider_id](outputs.tf#L31) | GCP workload identity pool provider ID. |  |

<!-- END TFDOC -->
