<!-- START doctoc generated TOC please keep comment here to allow auto update -->
<!-- DON'T EDIT THIS SECTION, INSTEAD RE-RUN doctoc TO UPDATE -->
**Table of Contents**

- [Template Bash Script Module](#template-bash-script-module)
  - [Example Usage](#example-usage)
  - [Requirements](#requirements)
  - [Providers](#providers)
  - [Inputs](#inputs)
  - [Outputs](#outputs)

<!-- END doctoc generated TOC please keep comment here to allow auto update -->

# Template Bash Script Module
This module is responsible for handling replacement of variables in the bash
scripts used for Dataproc Initialization Actions. This modules exist to DRY up
the handling of the pattern of having a parent template that sets variables
expected by script and a placeholder for the actual logic to work around the
conflicting `${}` syntax used in HCL string interpolation and bash variable
diambiguation. Inpiration drawn from
[terraform#15933](https://github.com/hashicorp/terraform/issues/15933) which
has more context.

## Example Usage
```hcl-terraform
module "init-action-1" {
  source = "./modules/rendered_bash_script"
  tmpl_file = "setup-kerberos-config.sh.logic"
  # absence logic_file will default steup-kerberos-config.sh
  vars = {
    KEY_CLUST_REALM  = var.key_cluster_realm
    DOMAIN           = "FOO.COM"

    # FOO KDC REALM
    KRB5_FOO_REALM  = var.corp_realm
    KRB5_FOO_MASTER = var.kdc_master

    # HIVE METASTORE REALM
    KRB5_HIVE_REALM  = var.metastore_realm
    KRB5_HIVE_MASTER = var.hive_master
  }
}
```

<!-- BEGINNING OF PRE-COMMIT-TERRAFORM DOCS HOOK -->
## Requirements

No requirements.

## Providers

| Name | Version |
|------|---------|
| template | n/a |

## Inputs

| Name | Description | Type | Default | Required |
|------|-------------|------|---------|:--------:|
| logic\_file | logic file which references variables rendered in the header defined in the template. If not specified this will be replaced with  `var.tmpl_suffix` with `var.logic_suffix` | `string` | `""` | no |
| logic\_suffix | if `logic_file` not specified will default to replacing `var.tmpl_suffix` with this suffix suffix | `string` | `".logic"` | no |
| subs | a map of variables to substitute in the template file | `map` | `{}` | no |
| tmpl\_file | Template file in which to render the variables with and logic file. This should contain a header defining variables referenced by the logic file. | `any` | n/a | yes |
| tmpl\_suffix | if `logic_file` not specified will default to replacing this suffix from template file with `var.logic_suffix` | `string` | `".tmpl"` | no |

## Outputs

| Name | Description |
|------|-------------|
| rendered | result of rendering the variables and logic file in the template file |

<!-- END OF PRE-COMMIT-TERRAFORM DOCS HOOK -->
