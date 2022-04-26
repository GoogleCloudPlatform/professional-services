<!-- BEGIN_TF_DOCS -->
## Requirements
* A folder in org where projects will be created
* A service account which will be used by terraform having below permissions 
   * at above folder level
       * "roles/resourcemanager.projectCreator"
       * "roles/compute.xpnAdmin"
   * at org level
       * "roles/browser"
   * At billing account level
       * "roles/billing.admin"
   * At bucket(used to store state) level
       * "roles/storage.objectAdmin"

* User/Service account executing terraform code need to have below permissions on above service account
  * "roles/iam.serviceAccountTokenCreator"

## Providers

| Name | Version |
|------|---------|
| <a name="provider_google.impersonate"></a> [google.impersonate](#provider\_google.impersonate) | n/a |

## Modules

| Name | Source | Version |
|------|--------|---------|
| <a name="module_composer-env"></a> [composer-env](#module\_composer-env) | ./composer_v1_pvt_shared_vpc | n/a |
| <a name="module_shared"></a> [shared](#module\_shared) | ./shared/ | n/a |

## Resources

| Name | Type |
|------|------|
| [google_service_account_access_token.default](https://registry.terraform.io/providers/hashicorp/google/latest/docs/data-sources/service_account_access_token) | data source |

## Inputs

| Name | Description | Type | Default | Required |
|------|-------------|------|---------|:--------:|
| <a name="input_billing_account"></a> [billing\_account](#input\_billing\_account) | The ID of the billing account to associate this project with | `string` | n/a | yes |
| <a name="input_composer_subnets"></a> [composer\_subnets](#input\_composer\_subnets) | subnets for composer workers | <pre>map(object({<br>    description    = string<br>    cidr_range     = string<br>    region         = string<br>    private_access = bool<br>    flow_logs      = bool<br>    secondary_ranges = list(object({<br>      range_name    = string<br>      ip_cidr_range = string<br>    }))<br>  }))</pre> | `{}` | no |
| <a name="input_composer_v1_private_envs"></a> [composer\_v1\_private\_envs](#input\_composer\_v1\_private\_envs) | composer v1 private envs | <pre>map(object({<br>    region                = string<br>    zone                  = string<br>    pod_ip_range_name     = string<br>    service_ip_range_name = string<br>    subnet                = string<br>    control_plane_cidr    = string<br>    web_server_cidr       = string<br>    cloud_sql_cidr        = string<br>    tags                  = list(string)<br>  }))</pre> | `{}` | no |
| <a name="input_composer_v2_private_envs"></a> [composer\_v2\_private\_envs](#input\_composer\_v2\_private\_envs) | composer v2 private envs | `map(string)` | `{}` | no |
| <a name="input_deny_all_egrees_rule_create"></a> [deny\_all\_egrees\_rule\_create](#input\_deny\_all\_egrees\_rule\_create) | Create deny all egress | `bool` | `true` | no |
| <a name="input_folder_name"></a> [folder\_name](#input\_folder\_name) | Parent folder for projects, folder should be child of organization | `string` | n/a | yes |
| <a name="input_org_id"></a> [org\_id](#input\_org\_id) | The organization id for the associated services | `string` | n/a | yes |
| <a name="input_prefix"></a> [prefix](#input\_prefix) | prefix for resource names | `string` | n/a | yes |
| <a name="input_terraform_service_account"></a> [terraform\_service\_account](#input\_terraform\_service\_account) | Service account email of the account to impersonate to run Terraform. | `string` | n/a | yes |
| <a name="input_vm_ext_ip_access_policy_create"></a> [vm\_ext\_ip\_access\_policy\_create](#input\_vm\_ext\_ip\_access\_policy\_create) | Create VM external policy constraint at project level to allow public IPs for public composer envs | `bool` | `true` | no |

## Outputs

No outputs.
<!-- END_TF_DOCS -->