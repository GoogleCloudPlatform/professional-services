## Inputs

| Name | Description | Type | Default | Required |
|------|-------------|------|---------|:-----:|
| bq\_dataset | Dataset name where BQ queries will run. | `any` | n/a | yes |
| bucket\_lifecycle | Number of days the exported JSON query result files should stay in the storage bucket. | `any` | n/a | yes |
| function\_bucket | Bucket for function code. | `any` | n/a | yes |
| function\_name | Name for the Cloud Function | `any` | n/a | yes |
| location | Location for GCP resources | `string` | `"US"` | no |
| project\_id | Project ID for your GCP project | `any` | n/a | yes |
| region | Region for GCP resources | `any` | n/a | yes |
| scheduler\_name | Name for Cloud Scheduler job. | `any` | n/a | yes |
| scheduler\_schedule | Cron-style schedule for Scheduler job. | `any` | n/a | yes |
| scheduler\_timezone | Time zone for Cloud Scheduler. | `any` | n/a | yes |
| sendgrid\_api\_key | API key for authenticating the sending of emails through SendGrid API | `any` | n/a | yes |
| service\_acct\_name | The service account used by the BQ email export Cloud Function | `any` | n/a | yes |
| storage\_bucket | Storage bucket for exported JSON files. | `any` | n/a | yes |
| topic\_name | Name for the Pub/Sub topic that the Cloud Function will subscribe to | `any` | n/a | yes |

## How to Use

This Terraform code creates the pipeline to schedule BigQuery query results to be sent to an email. It will create a Cloud Scheduler job with the payload from `payload.txt` that holds the configurations for the query and email API. This will trigger a Pub/Sub topic which will run the Cloud Function. The function code (`main.zip`) will run the query on a temporary BigQuery table and then export it to Cloud Storage, where a signed URL will be generated. This URL will be emailed using the [SendGrid API](https://sendgrid.com/) to the end users.

