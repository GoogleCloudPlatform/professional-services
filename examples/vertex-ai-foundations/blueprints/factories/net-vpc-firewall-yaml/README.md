# Google Cloud VPC Firewall Factory

This module allows creation and management of different types of firewall rules by defining them in well formatted `yaml` files. 

Yaml abstraction for FW rules can simplify users onboarding and also makes rules definition simpler and clearer comparing to HCL.

Nested folder structure for yaml configurations is optionally supported, which allows better and structured code management for multiple teams and environments.

## Example

### Terraform code

```hcl
module "prod-firewall" {
  source = "./fabric/blueprints/factories/net-vpc-firewall-yaml"

  project_id         = "my-prod-project"
  network            = "my-prod-network"
  config_directories = [
    "./prod",
    "./common"
  ]

  log_config  = {
    metadata = "INCLUDE_ALL_METADATA"
  }
}

module "dev-firewall" {
  source = "./fabric/blueprints/factories/net-vpc-firewall-yaml"

  project_id         = "my-dev-project"
  network            = "my-dev-network"
  config_directories = [
    "./dev",
    "./common"
  ]
}
# tftest skip
```

### Configuration Structure

```bash
├── common
│   ├── default-egress.yaml
│   ├── lb-rules.yaml
│   └── iap-ingress.yaml
├── dev
│   ├── team-a
│   │   ├── databases.yaml
│   │   └── webb-app-a.yaml
│   └── team-b
│       ├── backend.yaml
│       └── frontend.yaml
└── prod
    ├── team-a
    │   ├── databases.yaml
    │   └── webb-app-a.yaml
    └── team-b
        ├── backend.yaml
        └── frontend.yaml
```

### Rule definition format and structure

Firewall rules configuration should be placed in a set of yaml files in a folder/s. Firewall rule entry structure is following:

```yaml
rule-name: # descriptive name, naming convention is adjusted by the module
  allow:  # `allow` or `deny`
  - ports: ['443', '80'] # ports for a specific protocol, keep empty list `[]` for all ports
    protocol: tcp # protocol, put `all` for any protocol
  direction: EGRESS # EGRESS or INGRESS
  disabled: false # `false` or `true`, FW rule is disabled when `true`, default value is `false`
  priority: 1000 # rule priority value, default value is 1000
  source_ranges: # list of source ranges, should be specified only for `INGRESS` rule
  - 0.0.0.0/0
  destination_ranges: # list of destination ranges, should be specified only for `EGRESS` rule
  - 0.0.0.0/0
  source_tags: ['some-tag'] # list of source tags,  should be specified only for `INGRESS` rule
  source_service_accounts: # list of source service accounts, should be specified only for `INGRESS` rule, can not be specified together with `source_tags` or `target_tags`
  - myapp@myproject-id.iam.gserviceaccount.com
  target_tags: ['some-tag'] # list of target tags
  target_service_accounts: # list of target service accounts, , can not be specified together with `source_tags` or `target_tags`
  - myapp@myproject-id.iam.gserviceaccount.com
```


Firewall rules example yaml configuration

```bash
cat ./prod/core-network/common-rules.yaml
# allow ingress from GCLB to all instances in the network
lb-health-checks:
  allow:
  - ports: []
    protocol: tcp
  direction: INGRESS
  priority: 1001
  source_ranges:
  - 35.191.0.0/16
  - 130.211.0.0/22

# deny all egress
deny-all:
  deny:
  - ports: []
    protocol: all
  direction: EGRESS
  priority: 65535
  destination_ranges:
  - 0.0.0.0/0

cat ./dev/team-a/web-app-a.yaml
# Myapp egress
web-app-a-egress:
  allow:
    - ports: [443]
      protocol: tcp
  direction: EGRESS
  destination_ranges:
    - 192.168.0.0/24
  target_service_accounts:
    - myapp@myproject-id.iam.gserviceaccount.com
# Myapp ingress
web-app-a-ingress:
  allow:
    - ports: [1234]
      protocol: tcp
  direction: INGRESS
  source_service_accounts:
    - frontend-sa@myproject-id.iam.gserviceaccount.com
  target_service_accounts:
    - web-app-a@myproject-id.iam.gserviceaccount.com
```
<!-- BEGIN TFDOC -->

## Variables

| name | description | type | required | default |
|---|---|:---:|:---:|:---:|
| [config_directories](variables.tf#L17) | List of paths to folders where firewall configs are stored in yaml format. Folder may include subfolders with configuration files. Files suffix must be `.yaml`. | <code>list&#40;string&#41;</code> | ✓ |  |
| [network](variables.tf#L30) | Name of the network this set of firewall rules applies to. | <code>string</code> | ✓ |  |
| [project_id](variables.tf#L35) | Project Id. | <code>string</code> | ✓ |  |
| [log_config](variables.tf#L22) | Log configuration. Possible values for `metadata` are `EXCLUDE_ALL_METADATA` and `INCLUDE_ALL_METADATA`. Set to `null` for disabling firewall logging. | <code title="object&#40;&#123;&#10;  metadata &#61; string&#10;&#125;&#41;">object&#40;&#123;&#8230;&#125;&#41;</code> |  | <code>null</code> |

## Outputs

| name | description | sensitive |
|---|---|:---:|
| [egress_allow_rules](outputs.tf#L17) | Egress rules with allow blocks. |  |
| [egress_deny_rules](outputs.tf#L25) | Egress rules with allow blocks. |  |
| [ingress_allow_rules](outputs.tf#L33) | Ingress rules with allow blocks. |  |
| [ingress_deny_rules](outputs.tf#L41) | Ingress rules with deny blocks. |  |

<!-- END TFDOC -->
