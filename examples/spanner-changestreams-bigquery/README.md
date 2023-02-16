<!-- BEGIN_TF_DOCS -->
# Stream Spanner Data Changes to BigQuery

This repo uses terraform to create below resources in order to deploy an end-to-end pipeline for spanner change streams and streaming the observed changes to BigQuery. 
* The Cloud Spanner instance to read change streams from.
* The Cloud Spanner database to read change streams from.
* The Cloud Spanner instance to use for the change streams connector metadata table.
* The Cloud Spanner database to use for the change streams connector metadata table.
* The Cloud Spanner change stream in the database to be monitored.
* The BigQuery dataset for change streams output.
* Dataflow Flex pipeline that streams Cloud Spanner data change records and writes them into BigQuery tables using Dataflow Runner V2.


## Requirements
* A project in an org where all the resources will be created
* A service account which will be used by terraform having below permissions 
   * Spanner
       * "roles/spanner.admin"
   * BigQuery
       * "roles/bigquery.dataOwner""
   * Dataflow
       * "roles/dataflow.admin"
   * At bucket(used to store state) level
       * "roles/storage.objectAdmin"

* User/Service account executing terraform code need to have below permissions on above service account used by terraform.
  * "roles/iam.serviceAccountTokenCreator"

## Providers

| Name | Version |
|------|---------|
| <a name="provider_google.impersonate"></a> [google.impersonate](#provider\_google.impersonate) | n/a |

## Modules

| Name | Source | Version |
|------|--------|---------|
| <a name="module_cs-bq-env"></a> [cs-bq-env](#module\_cs-bq-env) | ./spanner_cs_bq_dataflow | n/a |

## Resources

| Name | Type |
|------|------|
| [google_service_account_access_token.default](https://registry.terraform.io/providers/hashicorp/google/latest/docs/data-sources/service_account_access_token) | data source |

## Inputs

| Name | Description | Type | Default | Required |
|------|-------------|------|---------|:--------:|
| <a name="input_terraform_service_account"></a> [terraform\_service\_account](#input\_terraform\_service\_account) | Service Account to be impersonated by Terraform.  | `string` | n/a | yes |
| <a name="input_region"></a> [region](#input\_region) | Google Cloud region  | `string` | n/a | yes |
| <a name="input_project_id"></a> [project\_id](#input\_project\_id) | Google Project ID.  | `string` | n/a | yes |
| <a name="input_spanner_instance_name_for_userdata"></a> [spanner\_instance\_name\_for\_userdata](#input\_terraform\_spanner\_instance\_name\_for\_userdata) | The Cloud Spanner instance to read change streams from.  | `string` | n/a | yes |
| <a name="input_spanner_database_name_for_userdata"></a> [spanner\_database\_name\_for\_userdata](#input\_spanner\_database\_name\_for\_userdata) | The Cloud Spanner database to read change streams from.  | `string` | n/a | yes |
| <a name="input_spanner_instance_name_for_metadata"></a> [spanner\_instance\_name\_for\_metadata](#input\_spanner\_instance\_name\_for\_metadata) | The Cloud Spanner instance to use for the change streams connector metadata table.  | `string` | n/a | yes |
| <a name="input_spanner_database_name_for_metadata"></a> [spanner\_database\_name\_for\_metadata](#input\_spanner\_database\_name\_for\_metadata) | The Cloud Spanner database to use for the change streams connector metadata table.  | `string` | n/a | yes |
| <a name="bigquery_dataset_name"></a> [bigquery\_dataset\_name](#input\_bigquery\_dataset\_name) | The BigQuery dataset for change streams output.  | `string` | n/a | yes |
| <a name="dataflow_job_name"></a> [dataflow\_job\_name](#input\_dataflow\_job\_name) | Dataflow Streaming Job Name for change streams from Spanner to BigQuery.  | `string` | n/a | yes |
| <a name="spanner_changestream_name"></a> [spanner\_changestream\_name](#input\_spanner\_changestream\_name) | The name of the Cloud Spanner change stream to read from.  | `string` | n/a | yes |

## Outputs

No outputs.
<!-- END_TF_DOCS -->
