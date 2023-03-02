# Projects Data Source Module 

This module extends functionality of [google_projects](https://registry.terraform.io/providers/hashicorp/google/latest/docs/data-sources/projects) data source by retrieving all the projects and folders under a specific `parent` recursively. 

A good usage pattern would be when we want all the projects under a specific folder (including nested subfolders) to be included into [VPC Service Controls](../vpc-sc/). Instead of manually maintaining the list of project numbers as an input to the `vpc-sc` module we can use that module to retrieve all the project numbers dynamically.

## Examples

### All projects in my org

```hcl
module "my-org" {
  source     = "./fabric/modules/projects-data-source"
  parent     = "organizations/123456789"
}

output "projects" {
  value = module.my-org.projects
}

output "folders" {
  value = module.my-org.folders
}

# tftest skip
```

### My dev projects based on parent and label

```hcl
module "my-dev" {
  source = "./fabric/modules/projects-data-source"
  parent = "folders/123456789"
  filter = "labels.env:DEV lifecycleState:ACTIVE"   
}

output "dev-projects" {
  value = module.my-dev.projects
}

output "dev-folders" {
  value = module.my-dev.folders
}

# tftest skip
```
<!-- BEGIN TFDOC -->

## Variables

| name | description | type | required | default |
|---|---|:---:|:---:|:---:|
| [parent](variables.tf#L17) | Parent folder or organization in 'folders/folder_id' or 'organizations/org_id' format. | <code>string</code> | ✓ |  |
| [filter](variables.tf#L26) | A string filter as defined in the [REST API](https://cloud.google.com/resource-manager/reference/rest/v1/projects/list#query-parameters). | <code>string</code> |  | <code>&#34;lifecycleState:ACTIVE&#34;</code> |

## Outputs

| name | description | sensitive |
|---|---|:---:|
| [folders](outputs.tf#L17) | Map of folders attributes keyed by folder id. |  |
| [project_numbers](outputs.tf#L27) | List of project numbers. |  |
| [projects](outputs.tf#L22) | Map of projects attributes keyed by projects id. |  |

<!-- END TFDOC -->
