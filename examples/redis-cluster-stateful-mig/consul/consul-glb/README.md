## Requirements

No requirements.

## Providers

| Name | Version |
|------|---------|
| <a name="provider_google"></a> [google](#provider\_google) | 5.23.0 |

## Modules

No modules.

## Resources

| Name | Type |
|------|------|
| [google_compute_address.ilb](https://registry.terraform.io/providers/hashicorp/google/latest/docs/resources/compute_address) | resource |
| [google_compute_firewall.fw_dns](https://registry.terraform.io/providers/hashicorp/google/latest/docs/resources/compute_firewall) | resource |
| [google_compute_firewall.fw_hc](https://registry.terraform.io/providers/hashicorp/google/latest/docs/resources/compute_firewall) | resource |
| [google_compute_forwarding_rule.tcp](https://registry.terraform.io/providers/hashicorp/google/latest/docs/resources/compute_forwarding_rule) | resource |
| [google_compute_forwarding_rule.udp](https://registry.terraform.io/providers/hashicorp/google/latest/docs/resources/compute_forwarding_rule) | resource |
| [google_compute_region_backend_service.tcp](https://registry.terraform.io/providers/hashicorp/google/latest/docs/resources/compute_region_backend_service) | resource |
| [google_compute_region_backend_service.udp](https://registry.terraform.io/providers/hashicorp/google/latest/docs/resources/compute_region_backend_service) | resource |
| [google_compute_region_health_check.consul_hc](https://registry.terraform.io/providers/hashicorp/google/latest/docs/resources/compute_region_health_check) | resource |
| [google_dns_managed_zone.private-fr-zone](https://registry.terraform.io/providers/hashicorp/google/latest/docs/resources/dns_managed_zone) | resource |

## Inputs

| Name | Description | Type | Default | Required |
|------|-------------|------|---------|:--------:|
| <a name="input_dns_fr_zone_name"></a> [dns\_fr\_zone\_name](#input\_dns\_fr\_zone\_name) | dns forwarding zone name | `string` | `"consul-fr-zone"` | no |
| <a name="input_instance_group_id"></a> [instance\_group\_id](#input\_instance\_group\_id) | instance group id with full path. | `string` | n/a | yes |
| <a name="input_network"></a> [network](#input\_network) | Network id with full path. | `string` | n/a | yes |
| <a name="input_override_dns_name"></a> [override\_dns\_name](#input\_override\_dns\_name) | Override the default (region.consul) dns name only if override\_dns\_name is passed | `string` | `""` | no |
| <a name="input_project_id"></a> [project\_id](#input\_project\_id) | GCP project id to create all resources. | `string` | n/a | yes |
| <a name="input_region"></a> [region](#input\_region) | GCP region name, example (asia-south1) | `string` | `"asia-south1"` | no |
| <a name="input_static_ip"></a> [static\_ip](#input\_static\_ip) | Static ip from var.subnet range | `string` | n/a | yes |
| <a name="input_subnet"></a> [subnet](#input\_subnet) | subnet id with full path. | `string` | n/a | yes |

## Outputs

No outputs.
