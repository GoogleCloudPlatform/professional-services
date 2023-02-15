# Cloud VPN Dynamic Module

## Example

This example shows how to configure a single VPN tunnel using a couple of extra features

-  custom advertisement on the tunnel's BGP session; if custom advertisement is not needed, simply set the `bgp_peer_options` attribute to `null`
- internally generated shared secret, which can be fetched from the module's `random_secret` output for reuse; a predefined secret can be used instead by assigning it to the `shared_secret` attribute

```hcl
module "vpn-dynamic" {
  source          = "./fabric/modules/net-vpn-dynamic"
  project_id      = "my-project"
  region          = "europe-west1"
  network         = "my-vpc"
  name            = "gateway-1"
  tunnels = {
    remote-1 = {
      bgp_peer = {
        address = "169.254.139.134"
        asn     = 64513
      }
      bgp_session_range = "169.254.139.133/30"
      ike_version       = 2
      peer_ip           = "1.1.1.1"
      router            = null
      shared_secret     = null
      bgp_peer_options = {
        advertise_groups = ["ALL_SUBNETS"]
        advertise_ip_ranges = {
          "192.168.0.0/24" = "Advertised range description"
        }
        advertise_mode = "CUSTOM"
        route_priority = 1000
      }
    }
  }
}
# tftest modules=1 resources=10
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
| [route_priority](variables.tf#L49) | Route priority, defaults to 1000. | <code>number</code> |  | <code>1000</code> |
| [router_advertise_config](variables.tf#L55) | Router custom advertisement configuration, ip_ranges is a map of address ranges and descriptions. | <code title="object&#40;&#123;&#10;  groups    &#61; list&#40;string&#41;&#10;  ip_ranges &#61; map&#40;string&#41;&#10;  mode      &#61; string&#10;&#125;&#41;">object&#40;&#123;&#8230;&#125;&#41;</code> |  | <code>null</code> |
| [router_asn](variables.tf#L65) | Router ASN used for auto-created router. | <code>number</code> |  | <code>64514</code> |
| [router_create](variables.tf#L71) | Create router. | <code>bool</code> |  | <code>true</code> |
| [router_name](variables.tf#L77) | Router name used for auto created router, or to specify existing router to use. Leave blank to use VPN name for auto created router. | <code>string</code> |  | <code>&#34;&#34;</code> |
| [tunnels](variables.tf#L83) | VPN tunnel configurations, bgp_peer_options is usually null. | <code title="map&#40;object&#40;&#123;&#10;  bgp_peer &#61; object&#40;&#123;&#10;    address &#61; string&#10;    asn     &#61; number&#10;  &#125;&#41;&#10;  bgp_peer_options &#61; object&#40;&#123;&#10;    advertise_groups    &#61; list&#40;string&#41;&#10;    advertise_ip_ranges &#61; map&#40;string&#41;&#10;    advertise_mode      &#61; string&#10;    route_priority      &#61; number&#10;  &#125;&#41;&#10;  bgp_session_range &#61; string&#10;  ike_version       &#61; number&#10;  peer_ip           &#61; string&#10;  router            &#61; string&#10;  shared_secret     &#61; string&#10;&#125;&#41;&#41;">map&#40;object&#40;&#123;&#8230;&#125;&#41;&#41;</code> |  | <code>&#123;&#125;</code> |

## Outputs

| name | description | sensitive |
|---|---|:---:|
| [address](outputs.tf#L17) | VPN gateway address. |  |
| [gateway](outputs.tf#L22) | VPN gateway resource. |  |
| [name](outputs.tf#L27) | VPN gateway name. |  |
| [random_secret](outputs.tf#L32) | Generated secret. |  |
| [router](outputs.tf#L38) | Router resource (only if auto-created). |  |
| [router_name](outputs.tf#L43) | Router name. |  |
| [self_link](outputs.tf#L48) | VPN gateway self link. |  |
| [tunnel_names](outputs.tf#L53) | VPN tunnel names. |  |
| [tunnel_self_links](outputs.tf#L61) | VPN tunnel self links. |  |
| [tunnels](outputs.tf#L69) | VPN tunnel resources. |  |

<!-- END TFDOC -->
