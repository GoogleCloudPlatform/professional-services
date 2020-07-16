## Providers

| Name | Version |
|------|---------|
| archive | n/a |
| google | ~> 3.21.0 |

## Inputs

| Name | Description | Type | Default | Required |
|------|-------------|------|---------|:-----:|
| bucket\_lifecycle | Number of days the exported query result files should stay in the storage bucket. | `number` | `1` | no |
| export\_logging\_sink\_name | Name for the logging sink that triggers Pub/Sub topic 3 when export to GCS is completed. | `string` | `"bq-email-export-completed"` | no |
| function\_bucket\_1 | GCS bucket for function 1 code that runs query. | `any` | n/a | yes |
| function\_bucket\_2 | GCS bucket for function 2 code that exports query results. | `any` | n/a | yes |
| function\_bucket\_3 | GCS bucket for function 3 code that sends email. | `any` | n/a | yes |
| function\_name\_1 | Name for the Cloud Function that runs query. | `string` | `"bq-email-run-query"` | no |
| function\_name\_2 | Name for the Cloud Function that exports query results. | `string` | `"bq-email-export-gcs"` | no |
| function\_name\_3 | Name for the Cloud Function that sends email. | `string` | `"bq-email-send-email"` | no |
| location | Location for GCP resources | `string` | `"US"` | no |
| project\_id | Project ID for your GCP project | `any` | n/a | yes |
| query\_logging\_sink\_name | Name for the logging sink that triggers Pub/Sub topic 2 when query is completed. | `string` | `"bq-email-query-completed"` | no |
| region | Region for GCP resources | `string` | `"us-central1"` | no |
| scheduler\_name | Name for Cloud Scheduler job. | `any` | n/a | yes |
| scheduler\_schedule | Cron-style schedule for Scheduler job. | `any` | n/a | yes |
| scheduler\_timezone | Time zone for Cloud Scheduler. | `string` | `"US/Central"` | no |
| sendgrid\_api\_key | API key for authenticating the sending of emails through SendGrid API | `any` | n/a | yes |
| service\_acct\_name | The service account used by the BQ email export Cloud Function | `any` | n/a | yes |
| service\_acct\_roles | Roles for the Cloud Function service account | `list` | <pre>[<br>  "roles/bigquery.admin",<br>  "roles/storage.admin",<br>  "roles/iam.serviceAccountTokenCreator"<br>]</pre> | no |
| storage\_bucket | GCS bucket to store exported query results from BQ. | `any` | n/a | yes |
| topic\_name\_1 | Name for the Pub/Sub topic that is triggered by Cloud Scheduler. | `string` | `"bq-email-run-query"` | no |
| topic\_name\_2 | Name for the Pub/Sub topic that subscribes to the audit log sink for completed queries. | `string` | `"bq-email-export-gcs"` | no |
| topic\_name\_3 | Name for the Pub/Sub topic that subscribes to the audit log sink for exported queries. | `string` | `"bq-email-send-email"` | no |

## How to Use

This Terraform code creates the pipeline to schedule BigQuery query results to be sent via email.  
To deploy the pipeline, run:
```bash
cd terraform
terraform init
terraform apply
```
