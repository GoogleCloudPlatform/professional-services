# Stateful redis cluster
## Requirements

| Name | Version |
|------|---------|
| <a name="requirement_google"></a> [google](#requirement\_google) | 5.13.0 |

## Providers

| Name | Version |
|------|---------|
| <a name="provider_google"></a> [google](#provider\_google) | 5.13.0 |

## Modules

No modules.

## Resources

| Name | Type |
|------|------|
| [google_compute_instance_template.redis_instance_template](https://registry.terraform.io/providers/hashicorp/google/5.13.0/docs/resources/compute_instance_template) | resource |
| [google_compute_region_instance_group_manager.this](https://registry.terraform.io/providers/hashicorp/google/5.13.0/docs/resources/compute_region_instance_group_manager) | resource |
| [google_project_iam_member.compute_admin_role](https://registry.terraform.io/providers/hashicorp/google/5.13.0/docs/resources/project_iam_member) | resource |
| [google_service_account.redis_service_account](https://registry.terraform.io/providers/hashicorp/google/5.13.0/docs/resources/service_account) | resource |
| [google_compute_image.my_image](https://registry.terraform.io/providers/hashicorp/google/5.13.0/docs/data-sources/compute_image) | data source |

## Inputs

| Name | Description | Type | Default | Required |
|------|-------------|------|---------|:--------:|
| <a name="input_autoscaling_enabled"></a> [autoscaling\_enabled](#input\_autoscaling\_enabled) | Whether autoscaling is enabled for the MIG. | `bool` | `false` | no |
| <a name="input_distribution_policy_zones"></a> [distribution\_policy\_zones](#input\_distribution\_policy\_zones) | List of zones where instances in the MIG will be distributed. | `list(string)` | n/a | yes |
| <a name="input_healthchecks"></a> [healthchecks](#input\_healthchecks) | Map of health check URLs and their associated initial delay seconds. | <pre>map(object({<br>    initial_delay_sec = number<br>  }))</pre> | `{}` | no |
| <a name="input_hostname"></a> [hostname](#input\_hostname) | The base name for instances in the MIG. | `string` | n/a | yes |
| <a name="input_image"></a> [image](#input\_image) | n/a | <pre>object({<br>    family  = string<br>    project = string<br>  })</pre> | <pre>{<br>  "family": "debian-11",<br>  "project": "debian-cloud"<br>}</pre> | no |
| <a name="input_machine_type"></a> [machine\_type](#input\_machine\_type) | n/a | `string` | n/a | yes |
| <a name="input_mig_name"></a> [mig\_name](#input\_mig\_name) | The name of the MIG. If not provided, a default name will be used. | `string` | `""` | no |
| <a name="input_mig_timeouts"></a> [mig\_timeouts](#input\_mig\_timeouts) | Map of timeouts for MIG resource operations. | `map(string)` | <pre>{<br>  "create": "30m",<br>  "delete": "30m",<br>  "update": "30m"<br>}</pre> | no |
| <a name="input_persistent_disk"></a> [persistent\_disk](#input\_persistent\_disk) | n/a | <pre>list(object({<br>    device_name  = optional(string)<br>    auto_delete  = optional(bool)<br>    boot         = optional(bool)<br>    disk_size_gb = optional(number)<br>    delete_rule  = optional(string)<br>  }))</pre> | <pre>[<br>  {<br>    "auto_delete": false,<br>    "boot": false,<br>    "delete_rule": "ON_PERMANENT_INSTANCE_DELETION",<br>    "device_name": "data-disk",<br>    "disk_size_gb": 40<br>  }<br>]</pre> | no |
| <a name="input_project_id"></a> [project\_id](#input\_project\_id) | The ID of the project where the MIG will be created. | `string` | n/a | yes |
| <a name="input_redis_service_account_name"></a> [redis\_service\_account\_name](#input\_redis\_service\_account\_name) | service account attached to redis compute engines | `string` | `"example-redis"` | no |
| <a name="input_region"></a> [region](#input\_region) | The region where the MIG will be created. | `string` | n/a | yes |
| <a name="input_stateful_disks"></a> [stateful\_disks](#input\_stateful\_disks) | List of stateful disks with device names and optional delete rules. | <pre>list(object({<br>    device_name = string<br>    delete_rule = optional(string)<br>  }))</pre> | <pre>[<br>  {<br>    "delete_rule": "ON_PERMANENT_INSTANCE_DELETION",<br>    "device_name": "data-disk"<br>  }<br>]</pre> | no |
| <a name="input_subnetwork"></a> [subnetwork](#input\_subnetwork) | n/a | `string` | n/a | yes |
| <a name="input_target_pools"></a> [target\_pools](#input\_target\_pools) | List of target pool URLs that instances in the MIG will belong to. | `list(string)` | n/a | yes |
| <a name="input_target_size"></a> [target\_size](#input\_target\_size) | The target number of running instances in the MIG. Set to null for autoscaling. | `number` | `null` | no |
| <a name="input_update_policy"></a> [update\_policy](#input\_update\_policy) | Map of update policies for the MIG. | `map(any)` | `{}` | no |
| <a name="input_wait_for_instances"></a> [wait\_for\_instances](#input\_wait\_for\_instances) | Whether to wait for all instances to be created/updated before continuing. | `bool` | `false` | no |

## Outputs

No outputs.
