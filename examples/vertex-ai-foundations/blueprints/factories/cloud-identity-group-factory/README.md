# Google Cloud Identity Group Factory

This module allows creation and management of Cloud Identity Groups by defining them in well formatted `yaml` files.

Yaml abstraction for Groups can simplify groups creation and members management. Yaml can be simpler and clearer comparing to HCL.

## Example

### Terraform code

```hcl
module "prod-firewall" {
  source = "./fabric/blueprints/factories/cloud-identity-group-factory"
  
  customer_id         = "customers/C0xxxxxxx"
  data_dir            = "data"
}
# tftest skip
```

### Configuration Structure

Groups configuration should be placed in a set of yaml files. The name of the file identify the name of the group.

```bash
├── data
    ├── group1@domain.com.yaml
    ├── group2@domain.com.yaml

```

### Group definition format and structure

Within each file, the group entry structure is following:

```yaml
display_name: Group 1 # Group display name.
description: Group 1 description # Group description.
members:  # List of group members.
  - user_1@example.com
  - user_2@example.com  
managers: # List of group managers.
  - manager_1@example.com
```
<!-- BEGIN TFDOC -->

## Variables

| name | description | type | required | default |
|---|---|:---:|:---:|:---:|
| [customer_id](variables.tf#L17) | Directory customer ID in the form customers/C0xxxxxxx. | <code>string</code> | ✓ |  |
| [data_dir](variables.tf#L22) | Relative path for the folder storing configuration data. | <code>string</code> | ✓ |  |

## Outputs

| name | description | sensitive |
|---|---|:---:|
| [group_id](outputs.tf#L17) | Group name => Group ID mapping. |  |

<!-- END TFDOC -->
