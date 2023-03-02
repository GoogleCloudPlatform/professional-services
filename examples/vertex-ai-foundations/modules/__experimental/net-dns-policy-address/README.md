# Google Cloud DNS Inbound Policy Addresses

This module allows discovering the addresses reserved in subnets when [DNS Inbound Policies](https://cloud.google.com/dns/docs/policies) are configured.

Since it's currently impossible to fetch those addresses using a GCP data source (see [this issue](https://github.com/hashicorp/terraform-provider-google/issues/3753) for more details), the workaround used here is to derive the authorization token from the Google provider, and do a direct HTTP call to the Compute API.

## Examples

```hcl
module "dns-policy-addresses" {
  source     = "./fabric/modules/__experimental/net-dns-policy-addresses"
  project_id = "myproject"
  regions    = ["europe-west1", "europe-west3"]
}
# tftest skip
```

The output is a map with lists of addresses of type `DNS_RESOLVER` for each region specified in variables.

<!-- BEGIN TFDOC -->

## Variables

| name | description | type | required | default |
|---|---|:---:|:---:|:---:|
| [project_id](variables.tf#L17) | Project id. | <code>string</code> | ✓ |  |
| [regions](variables.tf#L22) | Regions to fetch addresses from. | <code>list&#40;string&#41;</code> |  | <code>&#91;&#34;europe-west1&#34;&#93;</code> |

## Outputs

| name | description | sensitive |
|---|---|:---:|
| [addresses](outputs.tf#L24) | DNS inbound policy addresses per region. |  |

<!-- END TFDOC -->
