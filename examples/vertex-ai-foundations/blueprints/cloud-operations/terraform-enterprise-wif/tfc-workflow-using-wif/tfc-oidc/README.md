# Terraform Enterprise OIDC Credential for GCP Workload Identity Federation

This is a helper module to prepare GCP Credentials from Terraform Enterprise workload identity token. For more information see [Terraform Enterprise Workload Identity Federation](../) blueprint.

## Example
```hcl
module "tfe_oidc" {
  source = "./tfe_oidc"

  workload_identity_pool_provider_id = "projects/683987109094/locations/global/workloadIdentityPools/tfe-pool/providers/tfe-provider"
  impersonate_service_account_email  = "tfe-test@tfe-test-wif.iam.gserviceaccount.com"
}

provider "google" {
  credentials = module.tfe_oidc.credentials
}

provider "google-beta" {
  credentials = module.tfe_oidc.credentials
}

# tftest skip
```
<!-- BEGIN TFDOC -->

## Variables

| name | description | type | required | default |
|---|---|:---:|:---:|:---:|
| [impersonate_service_account_email](variables.tf#L22) | Service account to be impersonated by workload identity federation. | <code>string</code> | ✓ |  |
| [workload_identity_pool_provider_id](variables.tf#L17) | GCP workload identity pool provider ID. | <code>string</code> | ✓ |  |
| [tmp_oidc_token_path](variables.tf#L27) | Name of the temporary file where TFC OIDC token will be stored to authentificate terraform provider google. | <code>string</code> |  | <code>&#34;.oidc_token&#34;</code> |

## Outputs

| name | description | sensitive |
|---|---|:---:|
| [credentials](outputs.tf#L17) |  |  |

<!-- END TFDOC -->
