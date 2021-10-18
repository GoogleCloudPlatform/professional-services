## Providers

| Name | Version |
|------|---------|
| archive | n/a |
| google | ~> 3.48.0 |

## Inputs

| Name | Description | Type | Default | Required |
|------|-------------|------|---------|:-----:|
| bq\_dataset\_expiration | The default lifetime of all tables in the dataset in milliseconds. The minimum value is 3600000 ms, or one hour. | `string` | `"3600000"` | no |
| bq\_dataset\_name | Name for BQ dataset where the scheduled query results will be saved. | `any` | n/a | yes |
| bq\_table\_name | Name for BQ table where the scheduled query results will be saved. | `any` | n/a | yes |
| bucket\_lifecycle | Number of days the exported query result files should stay in the storage bucket. | `number` | `1` | no |
| email\_results\_function\_name | Name for the Cloud Function that sends email. | `string` | `"bq-email-send-email"` | no |
| email\_subject | Subject of email address containing query results. | `any` | n/a | yes |
| enable\_signed\_url | Boolean indicating whether the link sent via email should be a signed URL or unsigned URL requiring cookie-based authentication | `string` | `"True"` | no |
| export\_compression | Compression type to use for exported files. | `string` | `"NONE"` | no |
| export\_destination\_format | Exported file format. | `string` | `"NEWLINE_DELIMETED_JSON"` | no |
| export\_field\_delimiter | Delimiter to use between fields in the exported data. | `string` | `","` | no |
| export\_logging\_sink\_name | Name for the logging sink that triggers Pub/Sub topic 3 when export to GCS is completed. | `string` | `"bq-email-export-completed"` | no |
| export\_object\_name | GCS object name with JSON, CSV, or AVRO file extension for query results file | `any` | n/a | yes |
| export\_results\_function\_name | Name for the Cloud Function that exports query results. | `string` | `"bq-email-export-gcs"` | no |
| export\_use\_avro\_logical\_types | For loads of Avro data, governs whether Avro logical types are converted to their corresponding BigQuery types. | `string` | `"False"` | no |
| function\_bucket\_1 | GCS bucket name for function 1 code that runs query. | `any` | n/a | yes |
| function\_bucket\_2 | GCS bucket name for function 2 code that exports query results. | `any` | n/a | yes |
| location | Location for GCP resources | `string` | `"US"` | no |
| project\_id | Project ID for your GCP project | `any` | n/a | yes |
| pubsub\_export | Name for the Pub/Sub topic that is triggered on scheduled query completion. | `string` | `"bq-email-gcs-export"` | no |
| pubsub\_send\_email | Name for the Pub/Sub topic that is triggered on successful export to GCS. | `string` | `"bq-email-send-email"` | no |
| query | Query that will run in BQ. The results will be sent via email. | `any` | n/a | yes |
| recipient\_email\_address | Email address of recipient. | `any` | n/a | yes |
| region | Region for GCP resources | `string` | `"us-central1"` | no |
| schedule | Scheduled query schedule. Examples of valid format: 1st,3rd monday of month 15:30, every wed jan, every 15 minutes. | `any` | n/a | yes |
| scheduled\_query\_name | Display name for BQ scheduled query | `string` | `"bq-email-exports"` | no |
| sender\_email\_address | Email address of sender. | `any` | n/a | yes |
| sendgrid\_api\_key | API key for authenticating the sending of emails through SendGrid API | `any` | n/a | yes |
| service\_acct\_name | The service account used by the three BQ email export Cloud Functions | `any` | n/a | yes |
| service\_acct\_roles | Roles for the Cloud Function service account | `list` | <pre>[<br>  "roles/bigquery.admin",<br>  "roles/storage.admin",<br>  "roles/iam.serviceAccountTokenCreator"<br>]</pre> | no |
| signed\_url\_expiration\_hrs | Number of hours until the signed URL sent via email will expire. | `number` | `24` | no |
| storage\_bucket | Name of GCS bucket to store exported query results from BQ. | `any` | n/a | yes |

## How to Use

This Terraform code creates the pipeline to schedule BigQuery query results to be sent via email.  
To deploy the pipeline, run:
```bash
cd terraform
terraform init
terraform apply
```
