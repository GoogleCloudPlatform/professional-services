# Cloud NAT Module

Simple Cloud NAT management, with optional router creation.

## Example

```hcl
module "nat" {
  source         = "./fabric/modules/net-cloudnat"
  project_id     = "my-project"
  region         = "europe-west1"
  name           = "default"
  router_network = "my-vpc"
}
# tftest modules=1 resources=2
```
<!-- BEGIN TFDOC -->

## Variables

| name | description | type | required | default |
|---|---|:---:|:---:|:---:|
| [name](variables.tf#L57) | Name of the Cloud NAT resource. | <code>string</code> | ✓ |  |
| [project_id](variables.tf#L62) | Project where resources will be created. | <code>string</code> | ✓ |  |
| [region](variables.tf#L67) | Region where resources will be created. | <code>string</code> | ✓ |  |
| [addresses](variables.tf#L17) | Optional list of external address self links. | <code>list&#40;string&#41;</code> |  | <code>&#91;&#93;</code> |
| [config_min_ports_per_vm](variables.tf#L23) | Minimum number of ports allocated to a VM from this NAT config. | <code>number</code> |  | <code>64</code> |
| [config_source_subnets](variables.tf#L29) | Subnetwork configuration (ALL_SUBNETWORKS_ALL_IP_RANGES, ALL_SUBNETWORKS_ALL_PRIMARY_IP_RANGES, LIST_OF_SUBNETWORKS). | <code>string</code> |  | <code>&#34;ALL_SUBNETWORKS_ALL_IP_RANGES&#34;</code> |
| [config_timeouts](variables.tf#L35) | Timeout configurations. | <code title="object&#40;&#123;&#10;  icmp            &#61; number&#10;  tcp_established &#61; number&#10;  tcp_transitory  &#61; number&#10;  udp             &#61; number&#10;&#125;&#41;">object&#40;&#123;&#8230;&#125;&#41;</code> |  | <code title="&#123;&#10;  icmp            &#61; 30&#10;  tcp_established &#61; 1200&#10;  tcp_transitory  &#61; 30&#10;  udp             &#61; 30&#10;&#125;">&#123;&#8230;&#125;</code> |
| [logging_filter](variables.tf#L51) | Enables logging if not null, value is one of 'ERRORS_ONLY', 'TRANSLATIONS_ONLY', 'ALL'. | <code>string</code> |  | <code>null</code> |
| [router_asn](variables.tf#L72) | Router ASN used for auto-created router. | <code>number</code> |  | <code>64514</code> |
| [router_create](variables.tf#L78) | Create router. | <code>bool</code> |  | <code>true</code> |
| [router_name](variables.tf#L84) | Router name, leave blank if router will be created to use auto generated name. | <code>string</code> |  | <code>null</code> |
| [router_network](variables.tf#L90) | Name of the VPC used for auto-created router. | <code>string</code> |  | <code>null</code> |
| [subnetworks](variables.tf#L96) | Subnetworks to NAT, only used when config_source_subnets equals LIST_OF_SUBNETWORKS. | <code title="list&#40;object&#40;&#123;&#10;  self_link            &#61; string,&#10;  config_source_ranges &#61; list&#40;string&#41;&#10;  secondary_ranges     &#61; list&#40;string&#41;&#10;&#125;&#41;&#41;">list&#40;object&#40;&#123;&#8230;&#125;&#41;&#41;</code> |  | <code>&#91;&#93;</code> |

## Outputs

| name | description | sensitive |
|---|---|:---:|
| [name](outputs.tf#L17) | Name of the Cloud NAT. |  |
| [nat_ip_allocate_option](outputs.tf#L22) | NAT IP allocation mode. |  |
| [region](outputs.tf#L27) | Cloud NAT region. |  |
| [router](outputs.tf#L32) | Cloud NAT router resources (if auto created). |  |
| [router_name](outputs.tf#L41) | Cloud NAT router name. |  |

<!-- END TFDOC -->
