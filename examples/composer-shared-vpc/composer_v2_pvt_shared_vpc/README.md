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
| <a name="module_composer-v2-private"></a> [composer-v2-private](#module\_composer-v2-private) | terraform-google-modules/composer/google//modules/create_environment_v2 | >=3.2.0 |
| <a name="module_egress-firewall-rules"></a> [egress-firewall-rules](#module\_egress-firewall-rules) | terraform-google-modules/network/google//modules/firewall-rules | n/a |

## Resources

| Name | Type |
|------|------|
| [google_project_iam_member.iam_member_composer_agent_roles](https://registry.terraform.io/providers/hashicorp/google/latest/docs/resources/project_iam_member) | resource |
| [google_project_iam_member.iam_member_composer_worker_roles](https://registry.terraform.io/providers/hashicorp/google/latest/docs/resources/project_iam_member) | resource |
| [google_project_iam_member.iam_member_gke_agent_roles](https://registry.terraform.io/providers/hashicorp/google/latest/docs/resources/project_iam_member) | resource |
| [google_project_iam_member.iam_member_gke_cloud_services_roles](https://registry.terraform.io/providers/hashicorp/google/latest/docs/resources/project_iam_member) | resource |
| [google_service_account.composer_worker_sa](https://registry.terraform.io/providers/hashicorp/google/latest/docs/resources/service_account) | resource |
| [google_compute_subnetwork.subnetwork](https://registry.terraform.io/providers/hashicorp/google/latest/docs/data-sources/compute_subnetwork) | data source |
| [google_netblock_ip_ranges.health_checkers](https://registry.terraform.io/providers/hashicorp/google/latest/docs/data-sources/netblock_ip_ranges) | data source |
| [google_netblock_ip_ranges.legacy_health_checkers](https://registry.terraform.io/providers/hashicorp/google/latest/docs/data-sources/netblock_ip_ranges) | data source |
| [google_project.project](https://registry.terraform.io/providers/hashicorp/google/latest/docs/data-sources/project) | data source |

## Inputs

| Name | Description | Type | Default | Required |
|------|-------------|------|---------|:--------:|
| <a name="input_airflow_config_overrides"></a> [airflow\_config\_overrides](#input\_airflow\_config\_overrides) | Airflow configuration properties to override. Property keys contain the section and property names, separated by a hyphen, for example "core-dags\_are\_paused\_at\_creation". | `map(string)` | `{}` | no |
| <a name="input_cloud_sql_ipv4_cidr"></a> [cloud\_sql\_ipv4\_cidr](#input\_cloud\_sql\_ipv4\_cidr) | The CIDR block from which IP range in tenant project will be reserved for Cloud SQL. | `string` | `null` | no |
| <a name="input_composer_env_name"></a> [composer\_env\_name](#input\_composer\_env\_name) | Name of Cloud Composer Environment | `string` | n/a | yes |
| <a name="input_composer_sa_permissions"></a> [composer\_sa\_permissions](#input\_composer\_sa\_permissions) | IAM Roles assigned to composer SA | `list(string)` | <pre>[<br>  "roles/composer.worker",<br>  "roles/iam.serviceAccountUser",<br>  "roles/logging.logWriter"<br>]</pre> | no |
| <a name="input_composer_service_account"></a> [composer\_service\_account](#input\_composer\_service\_account) | Service Account for running Cloud Composer. | `string` | `null` | no |
| <a name="input_composer_service_account_create"></a> [composer\_service\_account\_create](#input\_composer\_service\_account\_create) | Create composer service account | `bool` | `true` | no |
| <a name="input_disk_size"></a> [disk\_size](#input\_disk\_size) | The disk size for nodes. | `string` | `"100"` | no |
| <a name="input_env_variables"></a> [env\_variables](#input\_env\_variables) | Variables of the airflow environment. | `map(string)` | `{}` | no |
| <a name="input_firewall_rules_create"></a> [firewall\_rules\_create](#input\_firewall\_rules\_create) | Create Egress firewall rules for composer env, needed where egress is denied | `bool` | `true` | no |
| <a name="input_image_version"></a> [image\_version](#input\_image\_version) | The version of the aiflow running in the cloud composer environment. | `string` | `null` | no |
| <a name="input_machine_type"></a> [machine\_type](#input\_machine\_type) | Machine type of Cloud Composer nodes. | `string` | `"n1-standard-8"` | no |
| <a name="input_master_ipv4_cidr"></a> [master\_ipv4\_cidr](#input\_master\_ipv4\_cidr) | The CIDR block from which IP range in tenant project will be reserved for the master. | `string` | `null` | no |
| <a name="input_network"></a> [network](#input\_network) | The VPC network to host the composer cluster. | `string` | n/a | yes |
| <a name="input_network_project_id"></a> [network\_project\_id](#input\_network\_project\_id) | The project ID of the shared VPC's host (for shared vpc support) | `string` | n/a | yes |
| <a name="input_node_count"></a> [node\_count](#input\_node\_count) | Number of worker nodes in Cloud Composer Environment. | `number` | `3` | no |
| <a name="input_pod_ip_allocation_range_name"></a> [pod\_ip\_allocation\_range\_name](#input\_pod\_ip\_allocation\_range\_name) | The name of the cluster's secondary range used to allocate IP addresses to pods. | `string` | `null` | no |
| <a name="input_project_id"></a> [project\_id](#input\_project\_id) | Project ID where Cloud Composer Environment is created. | `string` | n/a | yes |
| <a name="input_pypi_packages"></a> [pypi\_packages](#input\_pypi\_packages) | Custom Python Package Index (PyPI) packages to be installed in the environment. Keys refer to the lowercase package name (e.g. "numpy"). | `map(string)` | `{}` | no |
| <a name="input_python_version"></a> [python\_version](#input\_python\_version) | The default version of Python used to run the Airflow scheduler, worker, and webserver processes. | `string` | `"3"` | no |
| <a name="input_region"></a> [region](#input\_region) | Region where the Cloud Composer Environment is created. | `string` | `"us-central1"` | no |
| <a name="input_service_ip_allocation_range_name"></a> [service\_ip\_allocation\_range\_name](#input\_service\_ip\_allocation\_range\_name) | The name of the services' secondary range used to allocate IP addresses to the cluster. | `string` | `null` | no |
| <a name="input_subnetwork"></a> [subnetwork](#input\_subnetwork) | The subnetwork to host the composer cluster. | `string` | n/a | yes |
| <a name="input_subnetwork_region"></a> [subnetwork\_region](#input\_subnetwork\_region) | The subnetwork region of the shared VPC's host (for shared vpc support) | `string` | `""` | no |
| <a name="input_tags"></a> [tags](#input\_tags) | Tags applied to all nodes. Tags are used to identify valid sources or targets for network firewalls. | `set(string)` | `[]` | no |
| <a name="input_web_server_allowed_ip_ranges"></a> [web\_server\_allowed\_ip\_ranges](#input\_web\_server\_allowed\_ip\_ranges) | The network-level access control policy for the Airflow web server. If unspecified, no network-level access restrictions will be applied. | <pre>list(object({<br>    value       = string,<br>    description = string<br>  }))</pre> | `null` | no |
| <a name="composer_network_ipv4_cidr"></a> [composer\_network\_ipv4\_cidr](#input\_composer\_network\_ipv4\_cidr) | The CIDR block from which IP range in tenant project will be reserved for the Composer environment. | `string` | `null` | no |
| <a name="input_zone"></a> [zone](#input\_zone) | Zone where the Cloud Composer nodes are created. | `string` | `"us-central1-f"` | no |

## Outputs

No outputs.
<!-- END_TF_DOCS -->