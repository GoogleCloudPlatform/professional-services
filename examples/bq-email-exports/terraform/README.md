## Providers

| Name | Version |
|------|---------|
| archive | n/a |
| google | ~> 3.21.0 |

## Inputs

| Name | Description | Type | Default | Required |
|------|-------------|------|---------|:-----:|
| allow\_large\_results | Allow large query results tables | `string` | `"True"` | no |
| bucket\_lifecycle | Number of days the exported query result files should stay in the storage bucket. | `number` | `1` | no |
| email\_results\_function\_name | Name for the Cloud Function that sends email. | `string` | `"bq-email-send-email"` | no |
| email\_subject | Subject of email address containing query results. | `any` | n/a | yes |
| export\_compression | Compression type to use for exported files. | `string` | `"NONE"` | no |
| export\_destination\_format | Exported file format. | `string` | `"NEWLINE_DELIMETED_JSON"` | no |
| export\_field\_delimiter | Delimiter to use between fields in the exported data. | `string` | `","` | no |
| export\_logging\_sink\_name | Name for the logging sink that triggers Pub/Sub topic 3 when export to GCS is completed. | `string` | `"bq-email-export-completed"` | no |
| export\_object\_name | GCS object name for query results file | `any` | n/a | yes |
| export\_results\_function\_name | Name for the Cloud Function that exports query results. | `string` | `"bq-email-export-gcs"` | no |
| export\_use\_avro\_logical\_types | For loads of Avro data, governs whether Avro logical types are converted to their corresponding BigQuery types. | `string` | `"False"` | no |
| flatten\_results | Flatten nested/repeated fields in query results. | `string` | `"False"` | no |
| function\_bucket\_1 | GCS bucket for function 1 code that runs query. | `any` | n/a | yes |
| function\_bucket\_2 | GCS bucket for function 2 code that exports query results. | `any` | n/a | yes |
| function\_bucket\_3 | GCS bucket for function 3 code that sends email. | `any` | n/a | yes |
| gcs\_query\_path | Path to GCS file with query. | `any` | n/a | yes |
| location | Location for GCP resources | `string` | `"US"` | no |
| max\_bytes\_billed | Maximum bytes to be billed for query job. | `number` | `1000000000` | no |
| project\_id | Project ID for your GCP project | `any` | n/a | yes |
| query\_logging\_sink\_name | Name for the logging sink that triggers Pub/Sub topic 2 when query is completed. | `string` | `"bq-email-query-completed"` | no |
| recipient\_email\_address | Email address of recipient. | `any` | n/a | yes |
| region | Region for GCP resources | `string` | `"us-central1"` | no |
| run\_query\_function\_name | Name for the Cloud Function that runs query. | `string` | `"bq-email-run-query"` | no |
| scheduler\_name | Name for Cloud Scheduler job. | `any` | n/a | yes |
| scheduler\_schedule | Cron-style schedule for Scheduler job. | `any` | n/a | yes |
| scheduler\_timezone | Time zone for Cloud Scheduler. | `string` | `"US/Central"` | no |
| sender\_email\_address | Email address of sender. | `any` | n/a | yes |
| sendgrid\_api\_key | API key for authenticating the sending of emails through SendGrid API | `any` | n/a | yes |
| service\_acct\_name | The service account used by the three BQ email export Cloud Functions | `any` | n/a | yes |
| service\_acct\_roles | Roles for the Cloud Function service account | `list` | <pre>[<br>  "roles/bigquery.admin",<br>  "roles/storage.admin",<br>  "roles/iam.serviceAccountTokenCreator"<br>]</pre> | no |
| signed\_url\_expiration\_hrs | Number of hours until the signed URL sent via email will expire. | `number` | `24` | no |
| storage\_bucket | Name of GCS bucket to store exported query results from BQ. | `any` | n/a | yes |
| topic\_name\_1 | Name for the Pub/Sub topic that is triggered by Cloud Scheduler. | `string` | `"bq-email-run-query"` | no |
| topic\_name\_2 | Name for the Pub/Sub topic that subscribes to the audit log sink for completed queries. | `string` | `"bq-email-export-gcs"` | no |
| topic\_name\_3 | Name for the Pub/Sub topic that subscribes to the audit log sink for exported queries. | `string` | `"bq-email-send-email"` | no |
| use\_legacy\_sql | Use legacy SQL syntax for query. | `string` | `"False"` | no |
| use\_query\_cache | Look for the query result in the cache. | `string` | `"True"` | no |

## How to Use

This Terraform code creates the pipeline to schedule BigQuery query results to be sent via email.  
To deploy the pipeline, run:
```bash
cd terraform
terraform init
terraform apply
```
