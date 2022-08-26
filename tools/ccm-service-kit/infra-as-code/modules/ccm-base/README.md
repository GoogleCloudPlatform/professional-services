# Terraform Composer Module
This module handles the Composer instance creation.

## Assumptions and Prerequisites
This module assumes that below mentioned prerequisites are in place before consuming the module.
- All required APIs are enabled in the GCP Project

## Usage
Basic usage of this module is as follows:

```hcl
module "dataset_creation" {
    source  = "<path>/modules/composer"

  # Required variables
    project_id                      = "<PROJECT_ID>"
    composer_instance_name          = "<COMPOSER_INSTANCE_NAME>"
    composer_image                  = "<COMPOSER_IMAGE>"
    composer_instance_region        = "<COMPOSER_INSTANCE_REGION>"
    composer_node_count             = "<COMPOSER_NODE_COUNT>"
    composer_instance_zone          = "<COMPOSER_INSTANCE_ZONE>"
    composer_machine_type           = "<COMPOSER_MACHINE_TYPE>"
    composer_instance_network       = "<COMPOSER_INSTANCE_NETWORK>"
    composer_instance_subnetwork    = "<COMPOSER_INSTANCE_SUBNETWORK>"
    composer_instance_sa            = "<COMPOSER_INSTANCE_SA>"
    composer_instance_private       = "<COMPOSER_INSTANCE_PRIVATE>"
}
```

## Inputs

| Name | Description | Type | Default | Required |
|------|-------------|------|---------|:--------:|
| project_id | GCP Project ID | `string` | n/a | yes |
| composer_instance_name | Composer instance name | `string` | n/a | yes |
| composer_image | Composer image version | `string` | `"composer-2.0.7-airflow-2.2.3"` | no |
| composer_instance_region | Composer region | `string` | n/a | yes |
| composer_node_count | Composer nodes | `number` | `4` | no |
| composer_instance_zone | Composer Zone | `string` | n/a | yes |
| composer_machine_type | Composer machine type | `string` | `n1-standard-1` | no |
| composer_instance_network | Composer instance Network name | `string` | `default` | no |
| composer_instance_subnetwork | Composer instance Subnetwork name | `string` | `default` | no |
| composer_instance_sa | Service account used by composer | `string` | `Default Compute SA` | no |
| composer_instance_private | Enable private IP | `bool` | `true` | no |


## Outputs

| Name | Description |
|------|-------------|
| composer_environment_id | Full Composer ID |
| composer_airflow_uri | Airflow URI |




## Requirements
These sections describe requirements for using this module.

### Software

- Terraform ~> v0.13+
- Terraform Provider for GCP >= 3.50, < 5.0
- Terraform Provider for GCP Beta >= 3.50, < 5.0

### Service Account

A service account can be used with required roles to execute this module:

- Composer Env Admin/Storage: `roles/composer.environmentAndStorageObjectAdmin`
- Service Account User: `roles/iam.serviceAccountUser`

Service account attached to the Composer instance should have following roles


- For a public IP configuration, assign the Composer Worker (**composer.worker**) role.

- For a private IP configuration: Assign the Composer Worker (**composer.worker**) role.

- Assign the Service Account User (**iam.serviceAccountUser**) role.

- Cloud Composer v2 API Service Agent Extension is a supplementary role required to manage Composer v2 environments (**roles/composer.ServiceAgentV2Ext**).


### APIs
A project with the following APIs enabled must be used to host the main resource of this module:

Bigquery: composer.googleapis.com