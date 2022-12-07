# Data Catalog Module

This module simplifies the creation of [Data Catalog](https://cloud.google.com/data-catalog) Policy Tags. Policy Tags can be used to configure [Bigquery column-level access](https://cloud.google.com/bigquery/docs/best-practices-policy-tags).

Note: Data Catalog is still in beta, hence this module currently uses the beta provider.
## Examples

### Simple Taxonomy with policy tags

```hcl
module "cmn-dc" {
  source     = "./fabric/modules/data-catalog-policy-tag"
  name       = "my-datacatalog-policy-tags"
  project_id = "my-project"
  tags       = {
    low = null, medium = null, high = null
  }
}
# tftest modules=1 resources=4
```

### Taxonomy with IAM binding

```hcl
module "cmn-dc" {
  source     = "./fabric/modules/data-catalog-policy-tag"
  name       = "my-datacatalog-policy-tags"
  project_id = "my-project"
  tags       = { 
    low = null
    medium = null
    high = {"roles/datacatalog.categoryFineGrainedReader" = ["group:GROUP_NAME@example.com"]}
  }
  iam = {
    "roles/datacatalog.categoryAdmin" = ["group:GROUP_NAME@example.com"]
  }
}
# tftest modules=1 resources=6
```
<!-- BEGIN TFDOC -->

## Variables

| name | description | type | required | default |
|---|---|:---:|:---:|:---:|
| [name](variables.tf#L59) | Name of this taxonomy. | <code>string</code> | ✓ |  |
| [project_id](variables.tf#L70) | GCP project id. | <code></code> | ✓ |  |
| [activated_policy_types](variables.tf#L17) | A list of policy types that are activated for this taxonomy. | <code>list&#40;string&#41;</code> |  | <code>&#91;&#34;FINE_GRAINED_ACCESS_CONTROL&#34;&#93;</code> |
| [description](variables.tf#L23) | Description of this taxonomy. | <code>string</code> |  | <code>&#34;Taxonomy - Terraform managed&#34;</code> |
| [group_iam](variables.tf#L29) | Authoritative IAM binding for organization groups, in {GROUP_EMAIL => [ROLES]} format. Group emails need to be static. Can be used in combination with the `iam` variable. | <code>map&#40;list&#40;string&#41;&#41;</code> |  | <code>&#123;&#125;</code> |
| [iam](variables.tf#L35) | IAM bindings in {ROLE => [MEMBERS]} format. | <code>map&#40;list&#40;string&#41;&#41;</code> |  | <code>&#123;&#125;</code> |
| [iam_additive](variables.tf#L41) | IAM additive bindings in {ROLE => [MEMBERS]} format. | <code>map&#40;list&#40;string&#41;&#41;</code> |  | <code>&#123;&#125;</code> |
| [iam_additive_members](variables.tf#L47) | IAM additive bindings in {MEMBERS => [ROLE]} format. This might break if members are dynamic values. | <code>map&#40;list&#40;string&#41;&#41;</code> |  | <code>&#123;&#125;</code> |
| [location](variables.tf#L53) | Data Catalog Taxonomy location. | <code>string</code> |  | <code>&#34;eu&#34;</code> |
| [prefix](variables.tf#L64) | Prefix used to generate project id and name. | <code>string</code> |  | <code>null</code> |
| [tags](variables.tf#L74) | List of Data Catalog Policy tags to be created with optional IAM binging configuration in {tag => {ROLE => [MEMBERS]}} format. | <code>map&#40;map&#40;list&#40;string&#41;&#41;&#41;</code> |  | <code>&#123;&#125;</code> |

## Outputs

| name | description | sensitive |
|---|---|:---:|
| [tags](outputs.tf#L17) | Policy Tags. |  |
| [taxonomy_id](outputs.tf#L22) | Taxonomy id. |  |

<!-- END TFDOC -->
## TODO
- Support IAM at tag level.
- Support Child policy tags
