# Containerized on-premises infrastructure

This module manages a `cloud-config` configuration that starts an emulated on-premises infrastructure running in Docker Compose on a single instance, and connects it via static or dynamic VPN to a Google Cloud VPN gateway.

The emulated on-premises infrastructure is composed of:

- a [Strongswan container](./docker-images/strongswan) managing the VPN tunnel to GCP
- an optional Bird container managing the BGP session
- a CoreDNS container servng local DNS and forwarding to GCP
- an Nginx container serving a simple static web page
- a [generic Linux container](./docker-images/toolbox) used as a jump host inside the on-premises network

A [complete scenario using this module](../../../blueprints/networking/onprem-google-access-dns) is available in the networking blueprints.

The module renders the generated cloud config in the `cloud_config` output, to be used in instances or instance templates via the `user-data` metadata.

For convenience during development or for simple use cases, the module can optionally manage a single instance via the `test_instance` variable. If the instance is not needed the `instance*tf` files can be safely removed. Refer to the [top-level README](../README.md) for more details on the included instance.

## Examples

### Static VPN

The test instance is optional, as described above.

```hcl
module "cloud-vpn" {
  source     = "./fabric/modules/net-vpn-static"
  project_id = "my-project"
  region     = "europe-west1"
  network    = "my-vpc"
  name       = "to-on-prem"
  remote_ranges = ["192.168.192.0/24"]
  tunnels = {
    remote-0 = {
      ike_version       = 2
      peer_ip           = module.on-prem.external_address
      shared_secret     = ""
      traffic_selectors = { local = ["0.0.0.0/0"], remote = null }
    }
  }
}

module "on-prem" {
  source = "./fabric/modules/cos-container/on-prem"
  name       = "onprem"
  vpn_config = {
    type          = "static"
    peer_ip       = module.cloud-vpn.address
    shared_secret = module.cloud-vpn.random_secret
  }
  test_instance = {
    project_id = "my-project"
    zone       = "europe-west1-b"
    name       = "cos-coredns"
    type       = "f1-micro"
    network    = "default"
    subnetwork = "https://www.googleapis.com/compute/v1/projects/my-project/regions/europe-west1/subnetworks/my-subnet"
  }
}
```
<!-- BEGIN TFDOC -->

## Variables

| name | description | type | required | default |
|---|---|:---:|:---:|:---:|
| [vpn_config](variables.tf#L35) | VPN configuration, type must be one of 'dynamic' or 'static'. | <code title="object&#40;&#123;&#10;  peer_ip        &#61; string&#10;  shared_secret  &#61; string&#10;  type           &#61; string&#10;  peer_ip2       &#61; string&#10;  shared_secret2 &#61; string&#10;&#125;&#41;">object&#40;&#123;&#8230;&#125;&#41;</code> | ✓ |  |
| [config_variables](variables.tf#L17) | Additional variables used to render the cloud-config and CoreDNS templates. | <code>map&#40;any&#41;</code> |  | <code>&#123;&#125;</code> |
| [coredns_config](variables.tf#L23) | CoreDNS configuration path, if null default will be used. | <code>string</code> |  | <code>null</code> |
| [local_ip_cidr_range](variables.tf#L29) | IP CIDR range used for the Docker onprem network. | <code>string</code> |  | <code>&#34;192.168.192.0&#47;24&#34;</code> |
| [test_instance](variables-instance.tf#L17) | Test/development instance attributes, leave null to skip creation. | <code title="object&#40;&#123;&#10;  project_id &#61; string&#10;  zone       &#61; string&#10;  name       &#61; string&#10;  type       &#61; string&#10;  network    &#61; string&#10;  subnetwork &#61; string&#10;&#125;&#41;">object&#40;&#123;&#8230;&#125;&#41;</code> |  | <code>null</code> |
| [test_instance_defaults](variables-instance.tf#L30) | Test/development instance defaults used for optional configuration. If image is null, COS stable will be used. | <code title="object&#40;&#123;&#10;  disks &#61; map&#40;object&#40;&#123;&#10;    read_only &#61; bool&#10;    size      &#61; number&#10;  &#125;&#41;&#41;&#10;  image                 &#61; string&#10;  metadata              &#61; map&#40;string&#41;&#10;  nat                   &#61; bool&#10;  service_account_roles &#61; list&#40;string&#41;&#10;  tags                  &#61; list&#40;string&#41;&#10;&#125;&#41;">object&#40;&#123;&#8230;&#125;&#41;</code> |  | <code title="&#123;&#10;  disks    &#61; &#123;&#125;&#10;  image    &#61; null&#10;  metadata &#61; &#123;&#125;&#10;  nat      &#61; false&#10;  service_account_roles &#61; &#91;&#10;    &#34;roles&#47;logging.logWriter&#34;,&#10;    &#34;roles&#47;monitoring.metricWriter&#34;&#10;  &#93;&#10;  tags &#61; &#91;&#34;ssh&#34;&#93;&#10;&#125;">&#123;&#8230;&#125;</code> |
| [vpn_dynamic_config](variables.tf#L46) | BGP configuration for dynamic VPN, ignored if VPN type is 'static'. | <code title="object&#40;&#123;&#10;  local_bgp_asn      &#61; number&#10;  local_bgp_address  &#61; string&#10;  peer_bgp_asn       &#61; number&#10;  peer_bgp_address   &#61; string&#10;  local_bgp_asn2     &#61; number&#10;  local_bgp_address2 &#61; string&#10;  peer_bgp_asn2      &#61; number&#10;  peer_bgp_address2  &#61; string&#10;&#125;&#41;">object&#40;&#123;&#8230;&#125;&#41;</code> |  | <code title="&#123;&#10;  local_bgp_asn      &#61; 64514&#10;  local_bgp_address  &#61; &#34;169.254.1.2&#34;&#10;  peer_bgp_asn       &#61; 64513&#10;  peer_bgp_address   &#61; &#34;169.254.1.1&#34;&#10;  local_bgp_asn2     &#61; 64514&#10;  local_bgp_address2 &#61; &#34;169.254.2.2&#34;&#10;  peer_bgp_asn2      &#61; 64520&#10;  peer_bgp_address2  &#61; &#34;169.254.2.1&#34;&#10;&#125;">&#123;&#8230;&#125;</code> |
| [vpn_static_ranges](variables.tf#L70) | Remote CIDR ranges for static VPN, ignored if VPN type is 'dynamic'. | <code>list&#40;string&#41;</code> |  | <code>&#91;&#34;10.0.0.0&#47;8&#34;&#93;</code> |

## Outputs

| name | description | sensitive |
|---|---|:---:|
| [cloud_config](outputs.tf#L17) | Rendered cloud-config file to be passed as user-data instance metadata. |  |
| [test_instance](outputs-instance.tf#L17) | Optional test instance name and address. |  |

<!-- END TFDOC -->

