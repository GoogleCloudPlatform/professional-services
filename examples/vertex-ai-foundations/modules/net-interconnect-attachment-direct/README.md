# Direct Interconnect VLAN Attachment and router

This module allows creation of a VLAN attachment for Direct Interconnect and router (router creation is optional).

## Examples

### Direct Interconnect  VLAN attachment using default parameters for bgp session and router

```hcl
module "vlan-attachment-1" {
  source         = "./fabric/modules/net-interconnect-attachment-direct"
  project_id     = "dedicated-ic-5-8492"
  region         = "us-west2"
  router_network = "myvpc"
  name           = "vlan-604-x"
  interconnect   = "https://www.googleapis.com/compute/v1/projects/mylab/global/interconnects/mylab-interconnect-1"
  peer = {
    ip_address = "169.254.63.2"
    asn        = 65418
  }
}
# tftest modules=1 resources=4
```
#### Direct Interconnect VLAN attachments to achieve 99.9% SLA setup

```hcl
module "vlan-attachment-1" {
  source      = "./fabric/modules/net-interconnect-attachment-direct"
  project_id  = "dedicated-ic-3-8386"
  region      = "us-west2"
  router_name = "router-1"
  router_config = {
    description = ""
    asn         = 65003
    advertise_config = {
      groups = ["ALL_SUBNETS"]
      ip_ranges = {
        "199.36.153.8/30" = "custom"
      }
      mode = "CUSTOM"
    }
  }
  router_network = "myvpc"
  name           = "vlan-603-1"
  interconnect   = "https://www.googleapis.com/compute/v1/projects/mylab/global/interconnects/mylab-interconnect-1"

  config = {
    description   = ""
    vlan_id       = 603
    bandwidth     = "BPS_10G"
    admin_enabled = true
    mtu           = 1440
  }
  peer = {
    ip_address = "169.254.63.2"
    asn        = 65418
  }
  bgp = {
    session_range             = "169.254.63.1/29"
    advertised_route_priority = 0
    candidate_ip_ranges       = ["169.254.63.0/29"]
  }
}

module "vlan-attachment-2" {
  source      = "./fabric/modules/net-interconnect-attachment-direct"
  project_id  = "dedicated-ic-3-8386"
  region      = "us-west2"
  router_name = "router-2"
  router_config = {
    description = ""
    asn         = 65003
    advertise_config = {
      groups = ["ALL_SUBNETS"]
      ip_ranges = {
        "199.36.153.8/30" = "custom"
      }
      mode = "CUSTOM"
    }

  }
  router_network = "myvpc"
  name           = "vlan-603-2"

  interconnect = "https://www.googleapis.com/compute/v1/projects/mylab/global/interconnects/mylab-interconnect-2"

  config = {
    description   = ""
    vlan_id       = 603
    bandwidth     = "BPS_10G"
    admin_enabled = true
    mtu           = 1440
  }
  peer = {
    ip_address = "169.254.63.10"
    asn        = 65418
  }
  bgp = {
    session_range             = "169.254.63.9/29"
    advertised_route_priority = 0
    candidate_ip_ranges       = ["169.254.63.8/29"]
  }
}
# tftest modules=2 resources=8
```
<!-- BEGIN TFDOC -->

## Variables

| name | description | type | required | default |
|---|---|:---:|:---:|:---:|
| [interconnect](variables.tf#L46) | URL of the underlying Interconnect object that this attachment's traffic will traverse through. | <code>string</code> | ✓ |  |
| [peer](variables.tf#L57) | Peer Ip address and asn. Only IPv4 supported. | <code title="object&#40;&#123;&#10;  ip_address &#61; string&#10;  asn        &#61; number&#10;&#125;&#41;">object&#40;&#123;&#8230;&#125;&#41;</code> | ✓ |  |
| [project_id](variables.tf#L65) | The project containing the resources. | <code>string</code> | ✓ |  |
| [router_config](variables.tf#L76) | Router asn and custom advertisement configuration, ip_ranges is a map of address ranges and descriptions.. . | <code title="object&#40;&#123;&#10;  description &#61; string&#10;  asn         &#61; number&#10;  advertise_config &#61; object&#40;&#123;&#10;    groups    &#61; list&#40;string&#41;&#10;    ip_ranges &#61; map&#40;string&#41;&#10;    mode      &#61; string&#10;  &#125;&#41;&#10;&#125;&#41;&#10;&#10;&#10;default &#61; &#123;&#10;  description      &#61; null&#10;  asn              &#61; 64514&#10;  advertise_config &#61; null&#10;&#125;">object&#40;&#123;&#8230;&#125;</code> | ✓ |  |
| [bgp](variables.tf#L17) | Bgp session parameters. | <code title="object&#40;&#123;&#10;  session_range             &#61; string&#10;  candidate_ip_ranges       &#61; list&#40;string&#41;&#10;  advertised_route_priority &#61; number&#10;&#10;&#10;&#125;&#41;">object&#40;&#123;&#8230;&#125;&#41;</code> |  | <code>null</code> |
| [config](variables.tf#L28) | VLAN attachment parameters: description, vlan_id, bandwidth, admin_enabled, interconnect. | <code title="object&#40;&#123;&#10;  description   &#61; string&#10;  vlan_id       &#61; number&#10;  bandwidth     &#61; string&#10;  admin_enabled &#61; bool&#10;  mtu           &#61; number&#10;&#125;&#41;">object&#40;&#123;&#8230;&#125;&#41;</code> |  | <code title="&#123;&#10;  description   &#61; null&#10;  vlan_id       &#61; null&#10;  bandwidth     &#61; &#34;BPS_10G&#34;&#10;  admin_enabled &#61; true&#10;  mtu           &#61; 1440&#10;&#125;">&#123;&#8230;&#125;</code> |
| [name](variables.tf#L51) | The name of the vlan attachment. | <code>string</code> |  | <code>&#34;vlan-attachment&#34;</code> |
| [region](variables.tf#L70) | Region where the router resides. | <code>string</code> |  | <code>&#34;europe-west1-b&#34;</code> |
| [router_create](variables.tf#L95) | Create router. | <code>bool</code> |  | <code>true</code> |
| [router_name](variables.tf#L101) | Router name used for auto created router, or to specify an existing router to use if `router_create` is set to `true`. Leave blank to use vlan attachment name for auto created router. | <code>string</code> |  | <code>&#34;router-vlan-attachment&#34;</code> |
| [router_network](variables.tf#L107) | A reference to the network to which this router belongs. | <code>string</code> |  | <code>null</code> |

## Outputs

| name | description | sensitive |
|---|---|:---:|
| [bgpsession](outputs.tf#L16) | bgp session. |  |
| [interconnect_attachment](outputs.tf#L21) | interconnect attachment. |  |
| [router](outputs.tf#L26) | Router resource (only if auto-created). |  |

<!-- END TFDOC -->
