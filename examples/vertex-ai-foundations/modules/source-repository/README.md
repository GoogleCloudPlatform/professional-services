# Google Cloud Source Repository Module

This module allows managing a single Cloud Source Repository, including IAM bindings and basic Cloud Build triggers.

## Examples

### Repository with IAM

```hcl
module "repo" {
  source     = "./fabric/modules/source-repository"
  project_id = "my-project"
  name       = "my-repo"
  iam = {
    "roles/source.reader" = ["user:foo@example.com"]
  }
}
# tftest modules=1 resources=2
```

### Repository with Cloud Build trigger

```hcl
module "repo" {
  source     = "./fabric/modules/source-repository"
  project_id = "my-project"
  name       = "my-repo"
  triggers = {
    foo = {
      filename = "ci/workflow-foo.yaml"
      included_files = ["**/*tf"]
      service_account = null
      substitutions = {
        BAR = 1
      }
      template = {
        branch_name = "main"
        project_id = null
        tag_name = null
      }
    }
  }
}
# tftest modules=1 resources=2
```

<!-- TFDOC OPTS files:1 -->
<!-- BEGIN TFDOC -->

## Files

| name | description | resources |
|---|---|---|
| [iam.tf](./iam.tf) | IAM resources. | <code>google_sourcerepo_repository_iam_binding</code> · <code>google_sourcerepo_repository_iam_member</code> |
| [main.tf](./main.tf) | Module-level locals and resources. | <code>google_cloudbuild_trigger</code> · <code>google_sourcerepo_repository</code> |
| [outputs.tf](./outputs.tf) | Module outputs. |  |
| [variables.tf](./variables.tf) | Module variables. |  |
| [versions.tf](./versions.tf) | Version pins. |  |

## Variables

| name | description | type | required | default |
|---|---|:---:|:---:|:---:|
| [name](variables.tf#L44) | Repository name. | <code>string</code> | ✓ |  |
| [project_id](variables.tf#L49) | Project used for resources. | <code>string</code> | ✓ |  |
| [group_iam](variables.tf#L17) | Authoritative IAM binding for organization groups, in {GROUP_EMAIL => [ROLES]} format. Group emails need to be static. Can be used in combination with the `iam` variable. | <code>map&#40;list&#40;string&#41;&#41;</code> |  | <code>&#123;&#125;</code> |
| [iam](variables.tf#L24) | IAM bindings in {ROLE => [MEMBERS]} format. | <code>map&#40;list&#40;string&#41;&#41;</code> |  | <code>&#123;&#125;</code> |
| [iam_additive](variables.tf#L31) | IAM additive bindings in {ROLE => [MEMBERS]} format. | <code>map&#40;list&#40;string&#41;&#41;</code> |  | <code>&#123;&#125;</code> |
| [iam_additive_members](variables.tf#L38) | IAM additive bindings in {MEMBERS => [ROLE]} format. This might break if members are dynamic values. | <code>map&#40;list&#40;string&#41;&#41;</code> |  | <code>&#123;&#125;</code> |
| [triggers](variables.tf#L54) | Cloud Build triggers. | <code title="map&#40;object&#40;&#123;&#10;  filename        &#61; string&#10;  included_files  &#61; list&#40;string&#41;&#10;  service_account &#61; string&#10;  substitutions   &#61; map&#40;string&#41;&#10;  template &#61; object&#40;&#123;&#10;    branch_name &#61; string&#10;    project_id  &#61; string&#10;    tag_name    &#61; string&#10;  &#125;&#41;&#10;&#125;&#41;&#41;">map&#40;object&#40;&#123;&#8230;&#125;&#41;&#41;</code> |  | <code>&#123;&#125;</code> |

## Outputs

| name | description | sensitive |
|---|---|:---:|
| [id](outputs.tf#L17) | Repository id. |  |
| [name](outputs.tf#L22) | Repository name. |  |
| [url](outputs.tf#L27) | Repository URL. |  |

<!-- END TFDOC -->
