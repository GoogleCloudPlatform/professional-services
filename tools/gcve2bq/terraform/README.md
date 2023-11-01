# Terraform example code to implement GCVE Utilization content

<!-- BEGIN_AUTOMATED_TF_DOCS_BLOCK -->
## Requirements

| Name | Version |
|------|---------|
| <a name="requirement_terraform"></a> [terraform](#requirement\_terraform) | >= 1.3.0 |
| <a name="requirement_google"></a> [google](#requirement\_google) | >= 5.3.0 |

## Usage
Basic usage of this module is as follows:

```hcl
module "example" {
	 source  = "<module-path>"

	 # Optional variables
	 cloudrun-image  = ""
	 cloudrun-job-name  = ""
	 cloudrun-service-account-name  = ""
	 dataset-name  = ""
	 datastore-table-name  = ""
	 esxi-table-name  = ""
	 project  = ""
	 region  = ""
	 repository-name  = ""
	 scheduler-job-name  = ""
	 scheduler-service-account-name  = ""
	 serverless-vpc-connector-name  = ""
	 vCenter-password-secret  = ""
	 vCenter-server  = ""
	 vCenter-username  = ""
	 vm-table-name  = ""
}
```

## Resources

| Name | Type |
|------|------|
| [google_artifact_registry_repository.my-repo](https://registry.terraform.io/providers/hashicorp/google/latest/docs/resources/artifact_registry_repository) | resource |
| [google_bigquery_dataset.default](https://registry.terraform.io/providers/hashicorp/google/latest/docs/resources/bigquery_dataset) | resource |
| [google_bigquery_table.datastore-table](https://registry.terraform.io/providers/hashicorp/google/latest/docs/resources/bigquery_table) | resource |
| [google_bigquery_table.esxi-table](https://registry.terraform.io/providers/hashicorp/google/latest/docs/resources/bigquery_table) | resource |
| [google_bigquery_table.vm-table](https://registry.terraform.io/providers/hashicorp/google/latest/docs/resources/bigquery_table) | resource |
| [google_cloud_run_v2_job.default](https://registry.terraform.io/providers/hashicorp/google/latest/docs/resources/cloud_run_v2_job) | resource |
| [google_cloud_scheduler_job.job](https://registry.terraform.io/providers/hashicorp/google/latest/docs/resources/cloud_scheduler_job) | resource |
| [google_secret_manager_secret.secret](https://registry.terraform.io/providers/hashicorp/google/latest/docs/resources/secret_manager_secret) | resource |
| [google_secret_manager_secret_version.secret-version-data](https://registry.terraform.io/providers/hashicorp/google/latest/docs/resources/secret_manager_secret_version) | resource |
| [google_service_account.cloud_run_sa](https://registry.terraform.io/providers/hashicorp/google/latest/docs/data-sources/service_account) | data source |
| [google_service_account.scheduler_sa](https://registry.terraform.io/providers/hashicorp/google/latest/docs/data-sources/service_account) | data source |
| [google_vpc_access_connector.connector](https://registry.terraform.io/providers/hashicorp/google/latest/docs/data-sources/vpc_access_connector) | data source |

## Inputs

| Name | Description | Type | Default | Required |
|------|-------------|------|---------|:--------:|
| <a name="input_cloudrun-image"></a> [cloudrun-image](#input\_cloudrun-image) | URL of the Container image in Google Container Registry or Google Artifact Registry. | `string` | `""` | no |
| <a name="input_cloudrun-job-name"></a> [cloudrun-job-name](#input\_cloudrun-job-name) | Name of the Cloud Run job which will execute the export. | `string` | `""` | no |
| <a name="input_cloudrun-service-account-name"></a> [cloudrun-service-account-name](#input\_cloudrun-service-account-name) | Cloud Run Service Account name | `string` | `""` | no |
| <a name="input_dataset-name"></a> [dataset-name](#input\_dataset-name) | Name of the BigQuery dataset to store all GCVE Utilization tables | `string` | `""` | no |
| <a name="input_datastore-table-name"></a> [datastore-table-name](#input\_datastore-table-name) | Name of the table which will store all datastore utilization information. | `string` | `""` | no |
| <a name="input_esxi-table-name"></a> [esxi-table-name](#input\_esxi-table-name) | Name of the table which will store all ESXi utilization information. | `string` | `""` | no |
| <a name="input_project"></a> [project](#input\_project) | Google Cloud Project ID | `string` | `""` | no |
| <a name="input_region"></a> [region](#input\_region) | Google Cloud Region for your resources | `string` | `""` | no |
| <a name="input_repository-name"></a> [repository-name](#input\_repository-name) | Name of the repository in artifact registry. | `string` | `""` | no |
| <a name="input_scheduler-job-name"></a> [scheduler-job-name](#input\_scheduler-job-name) | Name of the Cloud Scheduler job | `string` | `""` | no |
| <a name="input_scheduler-service-account-name"></a> [scheduler-service-account-name](#input\_scheduler-service-account-name) | Name of the service account which will invoke the Cloud Run job. | `string` | `""` | no |
| <a name="input_serverless-vpc-connector-name"></a> [serverless-vpc-connector-name](#input\_serverless-vpc-connector-name) | Name of the Serverless VPC Connector. | `string` | `""` | no |
| <a name="input_vCenter-password-secret"></a> [vCenter-password-secret](#input\_vCenter-password-secret) | FQDN of the vCenter server. | `string` | `""` | no |
| <a name="input_vCenter-server"></a> [vCenter-server](#input\_vCenter-server) | FQDN of the vCenter server. | `string` | `""` | no |
| <a name="input_vCenter-username"></a> [vCenter-username](#input\_vCenter-username) | Name of the user account which will access vCenter. | `string` | `""` | no |
| <a name="input_vm-table-name"></a> [vm-table-name](#input\_vm-table-name) | Name of the table which will store all VM utilization information. | `string` | `""` | no |

## Outputs

No outputs.

<!-- END_AUTOMATED_TF_DOCS_BLOCK -->