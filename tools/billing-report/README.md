# Billing Report Tool

This tool generates reports of Cloud Billing data exported to BigQuery dataset, for a given month in csv format.

Main features include:
* Generation of multiple reports at a time with customizable report title and columns
* Support having label keys as report columns.
  * This is usually challenging with pure SQL queries due to [double counting](https://cloud.google.com/billing/docs/how-to/bq-examples#group_by_keyvalue_pairs)

## Prerequisites

Cloud Billing export to BigQuery dataset needs to be preconfigured. Documentation [here](https://cloud.google.com/billing/docs/how-to/export-data-bigquery). 

## Example Usage

`./billing-report --month <YYYYMM> --output-path <dir> --config <path_to_config.json>`

Toggle verbose debugging with `--verbose`

### Permissions

The account to run this tool requires below permissions
* `roles/bigquery.jobUser` permission on GCP Project defined in `control_project` of config json file
* `roles/bigquery.dataViewer` permission on the BigQuery dataset defined in `billing_export_table` of config json file

### Authentication

Authenticate with Google Cloud APIs first with one of these options:

1. When running as a user
   1. Use a service account key. Users can download service account keys from the Google Cloud Console web UI or use the gcloud CLI tool. Once you have a credentials file on your local machine, set the `GOOGLE_APPLICATION_CREDENTIALS` environment variable to point to the credentials file, for example, `export GOOGLE_APPLICATION_CREDENTIALS=credentials.json`
   1. Authenticate via user credentials by running `gcloud auth application-default login` to generate Application Default Credentials.

1. When running as a machine on GCP, authenticate using the GCE or GKE Workload Identity service account using [Application Default Credentials](https://cloud.google.com/docs/authentication/production)


### Config file

An example is provided in `config.json`

```
{
    "control_project": "demo-project-1",
	"billing_export_table": {
		"project": "data-analytics-pocs",
		"dataset": "public",
		"table": "billing_dashboard_export" 
	},
	"reports": [{
		"name": "summary",
		"columns":[
            {
                "raw_name":"invoice.month",
                "name":"Time_Period"
            },
            {
                "raw_name":"project.id",
                "name":"Project_ID"
            },
            {
                "name":"Service",
                "value":"ALL"
            },
            {
                "raw_name":"cost",
                "name":"Amount"
            },
            {
                "raw_name":"cost-center",
                "name":"Cost_Center",
                "is_project_label":true
            }
        ]
    },
    {
		"name": "by-service-sku",
		"columns":[
            {
                "raw_name":"invoice.month",
                "name":"Time_Period"
            },
            {
                "raw_name":"project.id",
                "name":"Project_ID"
            },
            {
                "raw_name":"service.description",
                "name":"Service"
            },
            {
                "raw_name":"sku.description",
                "name":"Sku"
            },
            {
                "raw_name":"cost",
                "name":"Amount"
            },
            {
                "raw_name":"cost-center",
                "name":"Cost_Center",
                "is_project_label":true
            }
        ]
    }],
    "output_path": "/home/user1/billing-reports"
}
```

| Fields  | Description |
| ------------- | ------------- |
| control_project  | string<br>The project to run BigQuery job  |
| billing_export_table  | string <br> BigQuery dataset of your billing export. The example given is a public anonymized dataset with the exact data schema. <br>  |
| billing_export_table.project  | string <br> GCP Project containing the BigQuery export dataset for your billing export<br>  |
| billing_export_table.dataset | string <br> BigQuery dataset configured for your billing export<br>  |
| billing_export_table.table  | string <br> BigQuery dataset table with Cloud Billing data, in the form of `gcp_billing_export_v1_XXXXXX_XXXXXX_XXXXXX`<br>  |
| reports[]  | Report definitions |
| reports.name  | string<br>Report name|
| reports.columns[]  | Report column definitions |
| reports.columns.raw_name  | string<br>Raw column name in dataset. Array columns such as `labels` are not supported. Refer to data schema [here](https://cloud.google.com/billing/docs/how-to/export-data-bigquery#data-schema). All these columns will be included in sql `SELECT` and `GROUP BY` clause of SQL statements, except for `cost`[1] and project labels[2] |
| reports.columns.name  | string<br>Report column name. Fields must contain only letters, numbers, and underscores, start with a letter or underscore, and be at most 128 characters long  |
| reports.columns.value  | string<br>Hardcoded report column value. Useful when you need to have multiple reports with common columns and some column values are not from the dataset.  |
| reports.columns.is_project_label  | bool<br>When this is true, `raw_name` is the project label key  |
| output_path  | string<br>Directory path on local file system for storing the reports |

## Disclaimer
This is not an official Google product.
