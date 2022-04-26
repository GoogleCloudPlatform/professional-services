<!-- BEGIN_TF_DOCS -->
## Requirements

No requirements.

## Providers

| Name | Version |
|------|---------|
| <a name="provider_google"></a> [google](#provider\_google) | n/a |

## Modules

| Name | Source | Version |
|------|--------|---------|
| <a name="module_network"></a> [network](#module\_network) | terraform-google-modules/network/google | ~> 3.4.0 |
| <a name="module_private-dns-zones-shared"></a> [private-dns-zones-shared](#module\_private-dns-zones-shared) | terraform-google-modules/cloud-dns/google | ~> 4.0 |
| <a name="module_project-composer"></a> [project-composer](#module\_project-composer) | terraform-google-modules/project-factory/google | ~> 11.1.1 |
| <a name="module_project-networking"></a> [project-networking](#module\_project-networking) | terraform-google-modules/project-factory/google | ~> 11.1.1 |

## Resources

| Name | Type |
|------|------|
| [google_compute_firewall.allow_private_api_egress](https://registry.terraform.io/providers/hashicorp/google/latest/docs/resources/compute_firewall) | resource |
| [google_compute_firewall.deny_all_egress](https://registry.terraform.io/providers/hashicorp/google/latest/docs/resources/compute_firewall) | resource |
| [google_dns_policy.default_policy](https://registry.terraform.io/providers/hashicorp/google/latest/docs/resources/dns_policy) | resource |
| [google_project_iam_member.iam_member_host_service_agent_gke_agent](https://registry.terraform.io/providers/hashicorp/google/latest/docs/resources/project_iam_member) | resource |
| [google_project_iam_member.iam_member_network_user_composer_agent](https://registry.terraform.io/providers/hashicorp/google/latest/docs/resources/project_iam_member) | resource |
| [google_project_iam_member.iam_member_network_user_gke_agent](https://registry.terraform.io/providers/hashicorp/google/latest/docs/resources/project_iam_member) | resource |
| [google_project_iam_member.iam_member_network_user_gke_cloud_services](https://registry.terraform.io/providers/hashicorp/google/latest/docs/resources/project_iam_member) | resource |
| [google_project_iam_member.iam_member_security_admin_gke_agent](https://registry.terraform.io/providers/hashicorp/google/latest/docs/resources/project_iam_member) | resource |
| [google_project_iam_member.iam_member_shared_vpc_composer_agent](https://registry.terraform.io/providers/hashicorp/google/latest/docs/resources/project_iam_member) | resource |
| [google_project_iam_member.iam_member_v2ext_composer_agent](https://registry.terraform.io/providers/hashicorp/google/latest/docs/resources/project_iam_member) | resource |
| [google_active_folder.composer_e2e](https://registry.terraform.io/providers/hashicorp/google/latest/docs/data-sources/active_folder) | data source |
| [google_netblock_ip_ranges.private_googleapis](https://registry.terraform.io/providers/hashicorp/google/latest/docs/data-sources/netblock_ip_ranges) | data source |

## Inputs

| Name | Description | Type | Default | Required |
|------|-------------|------|---------|:--------:|
| <a name="input_billing_account"></a> [billing\_account](#input\_billing\_account) | The ID of the billing account to associate this project with | `string` | n/a | yes |
| <a name="input_composer_subnets"></a> [composer\_subnets](#input\_composer\_subnets) | subnets for composer workers | <pre>map(object({<br>    description    = string<br>    cidr_range     = string<br>    region         = string<br>    private_access = bool<br>    flow_logs      = bool<br>    secondary_ranges = list(object({<br>      range_name    = string<br>      ip_cidr_range = string<br>    }))<br>  }))</pre> | `{}` | no |
| <a name="input_composer_worker_tags"></a> [composer\_worker\_tags](#input\_composer\_worker\_tags) | network tags which will be applied to composer workers | `list(string)` | <pre>[<br>  "composer-worker"<br>]</pre> | no |
| <a name="input_deny_all_egrees_rule_create"></a> [deny\_all\_egrees\_rule\_create](#input\_deny\_all\_egrees\_rule\_create) | Create deny all egress | `bool` | `true` | no |
| <a name="input_folder_name"></a> [folder\_name](#input\_folder\_name) | Parent folder for projects, folder should be child of organization | `string` | n/a | yes |
| <a name="input_org_id"></a> [org\_id](#input\_org\_id) | The organization id for the associated services | `string` | n/a | yes |
| <a name="input_prefix"></a> [prefix](#input\_prefix) | prefix for resource names | `string` | n/a | yes |

## Outputs

| Name | Description |
|------|-------------|
| <a name="output_host_project_id"></a> [host\_project\_id](#output\_host\_project\_id) | host project id |
| <a name="output_network_name"></a> [network\_name](#output\_network\_name) | Network name |
| <a name="output_service_project_id"></a> [service\_project\_id](#output\_service\_project\_id) | service project id |
<!-- END_TF_DOCS -->