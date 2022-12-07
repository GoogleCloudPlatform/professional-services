# Google Cloud BQ Factory

This module allows creation and management of BigQuery datasets and views as well as tables by defining them in well formatted `yaml` files.

Yaml abstraction for BQ can simplify users onboarding and also makes creation of tables easier compared to HCL.

Subfolders distinguish between views and tables and ensures easier navigation for users.

This factory is based on the [BQ dataset module](https://github.com/GoogleCloudPlatform/cloud-foundation-fabric/tree/master/modules/bigquery-dataset) which currently only supports tables and views. As soon as external table and materialized view support is added, factory will be enhanced accordingly.

You can create as many files as you like, the code will loop through it and create the required variables in order to execute everything accordingly.

## Example

### Terraform code

```hcl
module "bq" {
  source = "github.com/GoogleCloudPlatform/cloud-foundation-fabric/modules/bigquery-dataset"

  for_each   = local.output
  project_id = var.project_id
  id         = each.key
  views      = try(each.value.views, null)
  tables     = try(each.value.tables, null)
}
# tftest skip
```

### Configuration Structure

```bash
base_folder
│
├── tables
│   ├── table_a.yaml
│   ├── table_b.yaml
├── views
│   ├── view_a.yaml
│   ├── view_b.yaml
```

## YAML structure and definition formatting

### Tables

Table definition to be placed in a set of yaml files in the corresponding subfolder. Structure should look as following:

```yaml

dataset: # required name of the dataset the table is to be placed in
table: # required descriptive name of the table
schema: # required schema in JSON FORMAT Example: [{name: "test", type: "STRING"},{name: "test2", type: "INT64"}]
labels: # not required, defaults to {}, Example: {"a":"thisislabela","b":"thisislabelb"}
use_legacy_sql: boolean # not required, defaults to false
deletion_protection: boolean # not required, defaults to false
```

### Views
View definition to be placed in a set of yaml files in the corresponding subfolder. Structure should look as following:

```yaml
dataset: # required, name of the dataset the view is to be placed in
view: # required, descriptive name of the view
query: # required, SQL Query for the view in quotes
labels: # not required, defaults to {}, Example: {"a":"thisislabela","b":"thisislabelb"}
use_legacy_sql: bool # not required, defaults to false
deletion_protection: bool # not required, defaults to false
```

<!-- BEGIN TFDOC -->

## Variables

| name | description | type | required | default |
|---|---|:---:|:---:|:---:|
| [project_id](variables.tf#L27) | Project ID | <code>string</code> | ✓ |  |
| [tables_dir](variables.tf#L22) | Relative path for the folder storing table data. | <code>string</code> | ✓ |  |
| [views_dir](variables.tf#L17) | Relative path for the folder storing view data. | <code>string</code> | ✓ |  |

<!-- END TFDOC -->


## TODO

- [ ] add external table support
- [ ] add materialized view support

