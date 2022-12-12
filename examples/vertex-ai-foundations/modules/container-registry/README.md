# Google Cloud Container Registry Module

This module simplifies the creation of GCS buckets used by Google Container Registry.

## Example

```hcl
module "container_registry" {
  source     = "./fabric/modules/container-registry"
  project_id = "myproject"
  location   = "EU"
  iam = {
    "roles/storage.admin" = ["group:cicd@example.com"]
  }
}
# tftest modules=1 resources=2
```
<!-- BEGIN TFDOC -->

## Variables

| name | description | type | required | default |
|---|---|:---:|:---:|:---:|
| [project_id](variables.tf#L29) | Registry project id. | <code>string</code> | ✓ |  |
| [iam](variables.tf#L17) | IAM bindings for topic in {ROLE => [MEMBERS]} format. | <code>map&#40;list&#40;string&#41;&#41;</code> |  | <code>&#123;&#125;</code> |
| [location](variables.tf#L23) | Registry location. Can be US, EU, ASIA or empty. | <code>string</code> |  | <code>&#34;&#34;</code> |

## Outputs

| name | description | sensitive |
|---|---|:---:|
| [bucket_id](outputs.tf#L17) | ID of the GCS bucket created. |  |

<!-- END TFDOC -->
