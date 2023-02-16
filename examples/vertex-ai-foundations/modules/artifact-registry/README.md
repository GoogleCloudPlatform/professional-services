# Google Cloud Artifact Registry Module

This module simplifies the creation of repositories using Google Cloud Artifact Registry.

Note: Artifact Registry is still in beta, hence this module currently uses the beta provider.

## Example

```hcl
module "docker_artifact_registry" {
  source     = "./fabric/modules/artifact-registry"
  project_id = "myproject"
  location   = "europe-west1"
  format     = "DOCKER"
  id         = "myregistry"
  iam = {
    "roles/artifactregistry.admin" = ["group:cicd@example.com"]
  }
}
# tftest modules=1 resources=2
```
<!-- BEGIN TFDOC -->

## Variables

| name | description | type | required | default |
|---|---|:---:|:---:|:---:|
| [id](variables.tf#L35) | Repository id. | <code>string</code> | ✓ |  |
| [project_id](variables.tf#L52) | Registry project id. | <code>string</code> | ✓ |  |
| [description](variables.tf#L17) | An optional description for the repository. | <code>string</code> |  | <code>&#34;Terraform-managed registry&#34;</code> |
| [format](variables.tf#L23) | Repository format. One of DOCKER or UNSPECIFIED. | <code>string</code> |  | <code>&#34;DOCKER&#34;</code> |
| [iam](variables.tf#L29) | IAM bindings in {ROLE => [MEMBERS]} format. | <code>map&#40;list&#40;string&#41;&#41;</code> |  | <code>&#123;&#125;</code> |
| [labels](variables.tf#L40) | Labels to be attached to the registry. | <code>map&#40;string&#41;</code> |  | <code>&#123;&#125;</code> |
| [location](variables.tf#L46) | Registry location. Use `gcloud beta artifacts locations list' to get valid values. | <code>string</code> |  | <code>null</code> |

## Outputs

| name | description | sensitive |
|---|---|:---:|
| [id](outputs.tf#L17) | Repository id. |  |
| [name](outputs.tf#L22) | Repository name. |  |

<!-- END TFDOC -->
