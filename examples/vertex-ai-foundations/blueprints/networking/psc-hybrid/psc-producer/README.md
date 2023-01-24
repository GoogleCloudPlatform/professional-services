# PSC Producer

The module creates:

- a producer VPC
- an internal regional TCP proxy load balancer with a hybrid Network Endpoint Group (NEG) backend, pointing to an on-prem service (IP + port)
- a Private Service Connect Service Attachment (PSC SA) exposing the service to [PSC consumers](../psc-consumer/README.md)

<!-- BEGIN TFDOC -->

## Variables

| name | description | type | required | default |
|---|---|:---:|:---:|:---:|
| [accepted_limits](variables.tf#L68) | Incoming accepted projects with endpoints limit. | <code>map&#40;number&#41;</code> | ✓ |  |
| [dest_ip_address](variables.tf#L57) | On-prem service destination IP address. | <code>string</code> | ✓ |  |
| [name](variables.tf#L22) | Name of the resources created. | <code>string</code> | ✓ |  |
| [network](variables.tf#L37) | Producer network id. | <code>string</code> | ✓ |  |
| [project_id](variables.tf#L17) | The ID of the project where this VPC will be created. | <code>string</code> | ✓ |  |
| [region](variables.tf#L27) | Region where resources will be created. | <code>string</code> | ✓ |  |
| [subnet](variables.tf#L42) | Subnetwork id where resources will be associated. | <code>string</code> | ✓ |  |
| [subnet_proxy](variables.tf#L47) | L7 Regional load balancing subnet id. | <code>string</code> | ✓ |  |
| [subnets_psc](variables.tf#L52) | PSC NAT subnets. | <code>list&#40;string&#41;</code> | ✓ |  |
| [zone](variables.tf#L32) | Zone where resources will be created. | <code>string</code> | ✓ |  |
| [dest_port](variables.tf#L62) | On-prem service destination port. | <code>string</code> |  | <code>&#34;80&#34;</code> |

## Outputs

| name | description | sensitive |
|---|---|:---:|
| [service_attachment](outputs.tf#L17) | The service attachment resource. |  |

<!-- END TFDOC -->
