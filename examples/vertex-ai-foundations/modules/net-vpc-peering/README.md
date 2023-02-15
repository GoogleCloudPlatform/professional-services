# Google Network Peering

This module allows creation of a [VPC Network Peering](https://cloud.google.com/vpc/docs/vpc-peering) between two networks.

The resources created/managed by this module are:

- one network peering from `local network` to `peer network`
- one network peering from `peer network` to `local network`

## Usage

Basic usage of this module is as follows:

```hcl
module "peering" {
  source        = "./fabric/modules/net-vpc-peering"
  prefix        = "name-prefix"
  local_network = "projects/project-1/global/networks/vpc-1"
  peer_network  = "projects/project-1/global/networks/vpc-2"
}
# tftest modules=1 resources=2
```

If you need to create more than one peering for the same VPC Network `(A -> B, A -> C)` you use a `depends_on` for second one to keep order of peering creation (It is not currently possible to create more than one peering connection for a VPC Network at the same time).

```hcl
module "peering-a-b" {
  source        = "./fabric/modules/net-vpc-peering"
  prefix        = "name-prefix"
  local_network = "projects/project-a/global/networks/vpc-a"
  peer_network  = "projects/project-b/global/networks/vpc-b"
}

module "peering-a-c" {
  source        = "./fabric/modules/net-vpc-peering"
  prefix        = "name-prefix"
  local_network = "projects/project-a/global/networks/vpc-a"
  peer_network  = "projects/project-c/global/networks/vpc-c"
  depends_on    = [module.peering-a-b]
}
# tftest modules=2 resources=4
```
<!-- BEGIN TFDOC -->

## Variables

| name | description | type | required | default |
|---|---|:---:|:---:|:---:|
| [local_network](variables.tf#L30) | Resource link of the network to add a peering to. | <code>string</code> | ✓ |  |
| [peer_network](variables.tf#L41) | Resource link of the peer network. | <code>string</code> | ✓ |  |
| [export_local_custom_routes](variables.tf#L18) | Export custom routes to peer network from local network. | <code>bool</code> |  | <code>false</code> |
| [export_peer_custom_routes](variables.tf#L24) | Export custom routes to local network from peer network. | <code>bool</code> |  | <code>false</code> |
| [peer_create_peering](variables.tf#L35) | Create the peering on the remote side. If false, only the peering from this network to the remote network is created. | <code>bool</code> |  | <code>true</code> |
| [prefix](variables.tf#L46) | Name prefix for the network peerings. | <code>string</code> |  | <code>&#34;network-peering&#34;</code> |

## Outputs

| name | description | sensitive |
|---|---|:---:|
| [local_network_peering](outputs.tf#L17) | Network peering resource. |  |
| [peer_network_peering](outputs.tf#L22) | Peer network peering resource. |  |

<!-- END TFDOC -->
