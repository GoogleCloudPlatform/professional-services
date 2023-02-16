# Google Cloud Organization Policy

This module allows creation and management of [GCP Organization Policies](https://cloud.google.com/resource-manager/docs/organization-policy/org-policy-constraints) by defining them in a well formatted `yaml` files or with HCL.

Yaml based factory can simplify centralized management of Org Policies for a DevSecOps team by providing a simple way to define/structure policies and exclusions.

> **_NOTE:_**  This module uses experimental feature `module_variable_optional_attrs` which will be included into [terraform release 1.3](https://github.com/hashicorp/terraform/releases/tag/v1.3.0-alpha20220706).

## Example

### Terraform code

```hcl
# using configuration provided in a set of yaml files
module "org-policy-factory" {
  source = "./fabric/modules/organization-policy"

  config_directory = "./policies"
}

# using configuration provided in the module variable
module "org-policy" {
  source = "./fabric/modules/organization-policy"
  
  policies = {
    "folders/1234567890" = {
      # enforce boolean policy with no conditions
      "iam.disableServiceAccountKeyUpload" = {
        rules = [
          {
            enforce = true
          }
        ]
      },
      # Deny All for compute.vmCanIpForward policy
      "compute.vmCanIpForward" = {
        inherit_from_parent = false
        rules = [
          deny = [] # stands for deny_all
        ]
      }
    },
    "organizations/1234567890" = {
      # allow only internal ingress when match condition env=prod
      "run.allowedIngress" = {
        rules = [
          {
            allow = ["internal"]
            condition = {
              description= "allow ingress"
              expression = "resource.matchTag('123456789/environment', 'prod')"
              title = "allow-for-prod-org"
            }
          }
        ]
      }
    }
  } 
}
# tftest skip
```

## Org Policy definition format and structure

### Structure of `policies` variable

```hcl
policies = {
  "parent_id" = { # parent id in format projects/project-id, folders/1234567890 or organizations/1234567890.
    "policy_name" = { # policy constraint id, for example compute.vmExternalIpAccess.
      inherit_from_parent = true|false # (Optional) Only for list constraints. Determines the inheritance behavior for this policy.
      reset               = true|false # (Optional) Ignores policies set above this resource and restores the constraint_default enforcement behavior.
      rules               = [ # Up to 10 PolicyRules are allowed.
        {
          allow = ["value1", "value2"] # (Optional) Only for list constraints. Stands for `allow_all` if set to empty list `[]` or to `values.allowed_values` if set to a list of values
          denyl = ["value3", "value4"] # (Optional) Only for list constraints. Stands for `deny_all` if set to empty list `[]` or to `values.denied_values` if set to a list of values
          enforce   = true|false       # (Optional) Only for boolean constraints. If true, then the Policy is enforced.
          condition = {                # (Optional) A condition which determines whether this rule is used in the evaluation of the policy.
            description = "Condition description" # (Optional)
            expression  = "Condition expression"  # (Optional) For example "resource.matchTag('123456789/environment', 'prod')".
            location    = "policy-error.log"      # (Optional) String indicating the location of the expression for error reporting.
            title       = "condition-title"       # (Optional)
          }
        }
      ]
    }
  }
}
# tftest skip
```

### Structure of configuration provided in a yaml file/s

Configuration should be placed in a set of yaml files in the config directory. Policy entry structure as follows:

```yaml
parent_id: # parent id in format projects/project-id, folders/1234567890 or organizations/1234567890.
  policy_name1: # policy constraint id, for example compute.vmExternalIpAccess.
    inherit_from_parent: true|false # (Optional) Only for list constraints. Determines the inheritance behavior for this policy.
    reset: true|false               # (Optional) Ignores policies set above this resource and restores the constraint_default enforcement behavior.
    rules:
      - allow: ["value1", "value2"] # (Optional) Only for list constraints. Stands for `allow_all` if set to empty list `[]` or to `values.allowed_values` if set to a list of values
        deny: ["value3", "value4"] # (Optional) Only for list constraints. Stands for `deny_all` if set to empty list `[]` or to `values.denied_values` if set to a list of values
        enforce: true|false   # (Optional) Only for boolean constraints. If true, then the Policy is enforced.
        condition:            # (Optional) A condition which determines whether this rule is used in the evaluation of the policy.
          description: Condition description   # (Optional)
          expression: Condition expression     # (Optional) For example resource.matchTag("123456789/environment", "prod")
          location: policy-error.log           # (Optional) String indicating the location of the expression for error reporting.
          title: condition-title               # (Optional)
```

Module allows policies to be distributed into multiple yaml files for a better management and navigation.

```bash
├── org-policies
│   ├── baseline.yaml
│   ├── image-import-projects.yaml
│   └── exclusions.yaml
```

Organization policies example yaml configuration

```bash
cat ./policies/baseline.yaml
organizations/1234567890:
  constraints/compute.vmExternalIpAccess:
    rules:
      - deny: [] # Stands for deny_all = true
folders/1234567890:
  compute.vmCanIpForward:
    inherit_from_parent: false
    reset: false
    rules:
      - allow: [] # Stands for allow_all = true
projects/my-project-id:
  run.allowedIngress:
    inherit_from_parent: true
    rules:
      - allow: ['internal'] # Stands for values.allowed_values
        condition:
          description: allow internal ingress
          expression: resource.matchTag("123456789/environment", "prod")
          location: test.log
          title: allow-for-prod
  iam.allowServiceAccountCredentialLifetimeExtension:
    rules:
      - deny: [] # Stands for deny_all = true
  compute.disableGlobalLoadBalancing:
    reset: true
```
<!-- BEGIN TFDOC -->

## Variables

| name | description | type | required | default |
|---|---|:---:|:---:|:---:|
| [config_directory](variables.tf#L17) | Paths to a folder where organization policy configs are stored in yaml format. Files suffix must be `.yaml`. | <code>string</code> |  | <code>null</code> |
| [policies](variables.tf#L23) | Organization policies keyed by parent in format `projects/project-id`, `folders/1234567890` or `organizations/1234567890`. | <code title="map&#40;map&#40;object&#40;&#123;&#10;  inherit_from_parent &#61; optional&#40;bool&#41; &#35; List policy only.&#10;  reset               &#61; optional&#40;bool&#41;&#10;  rules &#61; optional&#40;&#10;    list&#40;object&#40;&#123;&#10;      allow   &#61; optional&#40;list&#40;string&#41;&#41; &#35; List policy only. Stands for &#96;allow_all&#96; if set to empty list &#96;&#91;&#93;&#96; or to &#96;values.allowed_values&#96; if set to a list of values &#10;      deny    &#61; optional&#40;list&#40;string&#41;&#41; &#35; List policy only. Stands for &#96;deny_all&#96; if set to empty list &#96;&#91;&#93;&#96; or to &#96;values.denied_values&#96; if set to a list of values&#10;      enforce &#61; optional&#40;bool&#41;         &#35; Boolean policy only.    &#10;      condition &#61; optional&#40;&#10;        object&#40;&#123;&#10;          description &#61; optional&#40;string&#41;&#10;          expression  &#61; optional&#40;string&#41;&#10;          location    &#61; optional&#40;string&#41;&#10;          title       &#61; optional&#40;string&#41;&#10;        &#125;&#41;&#10;      &#41;&#10;    &#125;&#41;&#41;&#10;  &#41;&#10;&#125;&#41;&#41;&#41;">map&#40;map&#40;object&#40;&#123;&#8230;&#125;&#41;&#41;&#41;</code> |  | <code>&#123;&#125;</code> |

## Outputs

| name | description | sensitive |
|---|---|:---:|
| [policies](outputs.tf#L17) | Organization policies. |  |

<!-- END TFDOC -->
