# Cloud VPN Route-based Module

## Example

```hcl
module "addresses" {
  source     = "./fabric/modules/net-address"
  project_id = var.project_id
  external_addresses = {
    vpn = "europe-west1"
  }
}

module "vpn" {
  source          = "./fabric/modules/net-vpn-static"
  project_id      = var.project_id
  region          = var.region
  network         = var.vpc.self_link
  name            = "remote"
  gateway_address_create = false
  gateway_address        = module.addresses.external_addresses["vpn"].address
  remote_ranges   = ["10.10.0.0/24"]
  tunnels = {
    remote-0 = {
      ike_version       = 2
      peer_ip           = "1.1.1.1"
      shared_secret     = "mysecret"
      traffic_selectors = { local = ["0.0.0.0/0"], remote = ["0.0.0.0/0"] }
    }
  }
}
# tftest modules=2 resources=8
```
<!-- BEGIN TFDOC -->

## Variables

| name | description | type | required | default |
|---|---|:---:|:---:|:---:|
| [name](variables.tf#L29) | VPN gateway name, and prefix used for dependent resources. | <code>string</code> | ✓ |  |
| [network](variables.tf#L34) | VPC used for the gateway and routes. | <code>string</code> | ✓ |  |
| [project_id](variables.tf#L39) | Project where resources will be created. | <code>string</code> | ✓ |  |
| [region](variables.tf#L44) | Region used for resources. | <code>string</code> | ✓ |  |
| [gateway_address](variables.tf#L17) | Optional address assigned to the VPN gateway. Ignored unless gateway_address_create is set to false. | <code>string</code> |  | <code>&#34;&#34;</code> |
| [gateway_address_create](variables.tf#L23) | Create external address assigned to the VPN gateway. Needs to be explicitly set to false to use address in gateway_address variable. | <code>bool</code> |  | <code>true</code> |
| [remote_ranges](variables.tf#L49) | Remote IP CIDR ranges. | <code>list&#40;string&#41;</code> |  | <code>&#91;&#93;</code> |
| [route_priority](variables.tf#L55) | Route priority, defaults to 1000. | <code>number</code> |  | <code>1000</code> |
| [tunnels](variables.tf#L61) | VPN tunnel configurations. | <code title="map&#40;object&#40;&#123;&#10;  ike_version   &#61; number&#10;  peer_ip       &#61; string&#10;  shared_secret &#61; string&#10;  traffic_selectors &#61; object&#40;&#123;&#10;    local  &#61; list&#40;string&#41;&#10;    remote &#61; list&#40;string&#41;&#10;  &#125;&#41;&#10;&#125;&#41;&#41;">map&#40;object&#40;&#123;&#8230;&#125;&#41;&#41;</code> |  | <code>&#123;&#125;</code> |

## Outputs

| name | description | sensitive |
|---|---|:---:|
| [address](outputs.tf#L17) | VPN gateway address. |  |
| [gateway](outputs.tf#L22) | VPN gateway resource. |  |
| [name](outputs.tf#L27) | VPN gateway name. |  |
| [random_secret](outputs.tf#L32) | Generated secret. |  |
| [self_link](outputs.tf#L37) | VPN gateway self link. |  |
| [tunnel_names](outputs.tf#L42) | VPN tunnel names. |  |
| [tunnel_self_links](outputs.tf#L50) | VPN tunnel self links. |  |
| [tunnels](outputs.tf#L58) | VPN tunnel resources. |  |

<!-- END TFDOC -->
