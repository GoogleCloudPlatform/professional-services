# Personal Managed Workbench notebooks

## Example

```hcl
module "sample-managed-module" {
  source                  = "./modules/personal-managed-notebook"
  notebook_users_list     = ["<USER>@<DOMAIN>"]
  managed_instance_prefix = "<PREFIX_STRING>"
  project_id              = "<PROJECT_ID>"
}
```

## Variables

| name                                        | description                                                                                |           type           | required |            default            |
|---------------------------------------------|--------------------------------------------------------------------------------------------|:------------------------:|:--------:|:-----------------------------:|
| [project_id](variables.tf#L15)              | Project ID where all the resources will be created. We assume this project already exists. |   <code>string</code>    |    ✓     |                               |
| [notebook_users_list](variables.tf#L20)     | Set of notebook users, for each user a notebook instance will be created.                  | <code>set(string)</code> |    ✓     |                               |
| [managed_instance_prefix](variables.tf#L25) | Prefix to be used to create the name of the managed notebook instances.                    |   <code>string</code>    |          | <code>managed-instance</code> |
| [machine_type](variables.tf#L31)            | A reference to a machine type which defines notebooks VM kind.                             |   <code>string</code>    |          |  <code>n1-standard-4</code>   |
| [region](variables.tf#L37)                  | Region where the managed notebook will be created                                          |   <code>string</code>    |          |   <code>us-central1</code>    |
| [network_name](variables.tf#L43)            | Network name to deploy notebook instances to.                                              |   <code>string</code>    |          |     <code>default</code>      |
| [network_name](variables.tf#L48)            | SubNetwork name to deploy notebook instances to.                                           |   <code>string</code>    |          |     <code>default</code>      |

## Outputs

| name                                 | description                                 | sensitive |
|--------------------------------------|---------------------------------------------|:---------:|
| [notebook_instances](outputs.tf#L17) | List of managed notebook instances created. |           |