# Google Cloud DNS Module

This module allows simple management of Google Cloud DNS zones and records. It supports creating public, private, forwarding, peering and service directory based zones.

For DNSSEC configuration, refer to the [`dns_managed_zone` documentation](https://registry.terraform.io/providers/hashicorp/google/latest/docs/resources/dns_managed_zone#dnssec_config).

## Examples

### Private Zone

```hcl
module "private-dns" {
  source          = "./fabric/modules/dns"
  project_id      = "myproject"
  type            = "private"
  name            = "test-example"
  domain          = "test.example."
  client_networks = [var.vpc.self_link]
  recordsets = {
    "A localhost" = { records = ["127.0.0.1"] }
    "A myhost"    = { ttl = 600, records = ["10.0.0.120"] }
  }
}
# tftest modules=1 resources=3
```

### Forwarding Zone

```hcl
module "private-dns" {
  source          = "./fabric/modules/dns"
  project_id      = "myproject"
  type            = "forwarding"
  name            = "test-example"
  domain          = "test.example."
  client_networks = [var.vpc.self_link]
  forwarders      = { "10.0.1.1" = null, "1.2.3.4" = "private" }
}
# tftest modules=1 resources=1
```

### Peering Zone

```hcl
module "private-dns" {
  source          = "./fabric/modules/dns"
  project_id      = "myproject"
  type            = "peering"
  name            = "test-example"
  domain          = "test.example."
  client_networks = [var.vpc.self_link]
  peer_network    = var.vpc2.self_link
}
# tftest modules=1 resources=1
```

### Routing Policies

```hcl
module "private-dns" {
  source          = "./fabric/modules/dns"
  project_id      = "myproject"
  type            = "private"
  name            = "test-example"
  domain          = "test.example."
  client_networks = [var.vpc.self_link]
  recordsets = {
    "A regular" = { records = ["10.20.0.1"] }
    "A geo" = {
      geo_routing = [
        { location = "europe-west1", records = ["10.0.0.1"] },
        { location = "europe-west2", records = ["10.0.0.2"] },
        { location = "europe-west3", records = ["10.0.0.3"] }
      ]
    }

    "A wrr" = {
      ttl = 600
      wrr_routing = [
        { weight = 0.6, records = ["10.10.0.1"] },
        { weight = 0.2, records = ["10.10.0.2"] },
        { weight = 0.2, records = ["10.10.0.3"] }
      ]
    }
  }
}
# tftest modules=1 resources=4
```
<!-- BEGIN TFDOC -->

## Variables

| name | description | type | required | default |
|---|---|:---:|:---:|:---:|
| [domain](variables.tf#L54) | Zone domain, must end with a period. | <code>string</code> | ✓ |  |
| [name](variables.tf#L72) | Zone name, must be unique within the project. | <code>string</code> | ✓ |  |
| [project_id](variables.tf#L83) | Project id for the zone. | <code>string</code> | ✓ |  |
| [client_networks](variables.tf#L21) | List of VPC self links that can see this zone. | <code>list&#40;string&#41;</code> |  | <code>&#91;&#93;</code> |
| [description](variables.tf#L28) | Domain description. | <code>string</code> |  | <code>&#34;Terraform managed.&#34;</code> |
| [dnssec_config](variables.tf#L34) | DNSSEC configuration for this zone. | <code title="object&#40;&#123;&#10;  non_existence &#61; optional&#40;string, &#34;nsec3&#34;&#41;&#10;  state         &#61; string&#10;  key_signing_key &#61; optional&#40;object&#40;&#10;    &#123; algorithm &#61; string, key_length &#61; number &#125;&#41;,&#10;    &#123; algorithm &#61; &#34;rsasha256&#34;, key_length &#61; 2048 &#125;&#10;  &#41;&#10;  zone_signing_key &#61; optional&#40;object&#40;&#10;    &#123; algorithm &#61; string, key_length &#61; number &#125;&#41;,&#10;    &#123; algorithm &#61; &#34;rsasha256&#34;, key_length &#61; 1024 &#125;&#10;  &#41;&#10;&#125;&#41;">object&#40;&#123;&#8230;&#125;&#41;</code> |  | <code title="&#123;&#10;  state &#61; &#34;off&#34;&#10;&#125;">&#123;&#8230;&#125;</code> |
| [enable_logging](variables.tf#L65) | Enable query logging for this zone. Only valid for public zones. | <code>bool</code> |  | <code>false</code> |
| [forwarders](variables.tf#L59) | Map of {IPV4_ADDRESS => FORWARDING_PATH} for 'forwarding' zone types. Path can be 'default', 'private', or null for provider default. | <code>map&#40;string&#41;</code> |  | <code>&#123;&#125;</code> |
| [peer_network](variables.tf#L77) | Peering network self link, only valid for 'peering' zone types. | <code>string</code> |  | <code>null</code> |
| [recordsets](variables.tf#L88) | Map of DNS recordsets in \"type name\" => {ttl, [records]} format. | <code title="map&#40;object&#40;&#123;&#10;  ttl     &#61; optional&#40;number, 300&#41;&#10;  records &#61; optional&#40;list&#40;string&#41;&#41;&#10;  geo_routing &#61; optional&#40;list&#40;object&#40;&#123;&#10;    location &#61; string&#10;    records  &#61; list&#40;string&#41;&#10;  &#125;&#41;&#41;&#41;&#10;  wrr_routing &#61; optional&#40;list&#40;object&#40;&#123;&#10;    weight  &#61; number&#10;    records &#61; list&#40;string&#41;&#10;  &#125;&#41;&#41;&#41;&#10;&#125;&#41;&#41;">map&#40;object&#40;&#123;&#8230;&#125;&#41;&#41;</code> |  | <code>&#123;&#125;</code> |
| [service_directory_namespace](variables.tf#L123) | Service directory namespace id (URL), only valid for 'service-directory' zone types. | <code>string</code> |  | <code>null</code> |
| [type](variables.tf#L129) | Type of zone to create, valid values are 'public', 'private', 'forwarding', 'peering', 'service-directory'. | <code>string</code> |  | <code>&#34;private&#34;</code> |
| [zone_create](variables.tf#L139) | Create zone. When set to false, uses a data source to reference existing zone. | <code>bool</code> |  | <code>true</code> |

## Outputs

| name | description | sensitive |
|---|---|:---:|
| [dns_keys](outputs.tf#L17) | DNSKEY and DS records of DNSSEC-signed managed zones. |  |
| [domain](outputs.tf#L22) | The DNS zone domain. |  |
| [name](outputs.tf#L27) | The DNS zone name. |  |
| [name_servers](outputs.tf#L32) | The DNS zone name servers. |  |
| [type](outputs.tf#L37) | The DNS zone type. |  |
| [zone](outputs.tf#L42) | DNS zone resource. |  |

<!-- END TFDOC -->
