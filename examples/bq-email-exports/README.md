# Automated BigQuery Exports via Email

This serverless solution enables users to regularly send BigQuery export results via email. The end users will get a scheduled email with a link to either a Google Cloud Storage [signed URL](https://cloud.google.com/storage/docs/access-control/signed-urls) or an [unsigned URL](https://cloud.google.com/storage/docs/request-endpoints#cookieauth), from which they can view query results as a JSON, CSV, or Avro file.

The [signed URL](https://cloud.google.com/storage/docs/access-control/signed-urls) will allow anyone with the link to be able to download the file for a limited time. The [unsigned URL](https://cloud.google.com/storage/docs/request-endpoints#cookieauth) will require cookie-based authentication and ask the user to sign in to their Google account to identify themselves. The user must have the appropriate [IAM permissions](https://cloud.google.com/storage/docs/access-control) to access the object in Google Cloud Storage.

The functional steps are listed here:

**BigQuery Scheduled Query:** A [scheduled query](https://cloud.google.com/bigquery/docs/scheduling-queries#bq_1) is set up in BigQuery.

**Pub/Sub #1:** A Pub/Sub topic is triggered by every successful scheduled query run.

**Cloud Function #1:** A [Cloud Function](https://cloud.google.com/functions) subscribes to the above Pub/Sub topic and exports query results to GCS with a job ID prefix of `email_export`. The GCS bucket will always hold the most recent export and this file will be overwritten for each future export.

**Pub/Sub #2:** A second topic is triggered by a logging sink with a filter for export job completion with the job ID prefix of `email_export`.

**Cloud Function #2:** A second function subscribes to the above Pub/Sub topic and sends the email via the SendGrid API with a link to the signed or unsigned URL of the file.

**SendGrid API** The [SendGrid API](https://sendgrid.com/) is a web based API that sends the signed URL as an email to users.

To implement this solution, follow the steps below:

## Set Up
1. Generate a SendGrid API key by creating a free tier [SendGrid account](https://signup.sendgrid.com/).

2. Deploy with Terraform.

## Deploying the pipeline

To deploy the pipeline, run:
```bash
cd terraform
terraform init
terraform apply
```
The Terraform code will use a compressed version of the source directories that contain `main.py` and `requirements.txt` files as the respective source code for the Cloud Functions.

## Caveats and Considerations
1. BigQuery can export up to 1 GB of data to a single file. If your query results are over 1 GB, you must export your data to multiple files in GCS which this solution does not support. Another option would be to use [GCS Compose](https://cloud.google.com/storage/docs/composite-objects) to concatenate multiple objects in order to email only one file. 

2. Signed URLs can be a data exfiltration risk. Consider the security risks regarding the sending of data through a signed URL.

If your use case does not meet the above constraints, another option would be to use a [Cloud Composer workflow](https://cloud.google.com/composer/docs/how-to/using/writing-dags) to execute the pipeline. If you are a GSuite user, this solution can also be implemented with a scheduled [Apps Script](https://developers.google.com/apps-script) using the [BigQuery Service](https://developers.google.com/apps-script/advanced/bigquery) and exporting data to a [Google Sheet](https://developers.google.com/apps-script/reference/spreadsheet).

## Troubleshooting
If there is an issue with the upstream query or export job, the Cloud Function will log the error. In the case that an email was not sent, please check the Cloud Functions and BigQuery logs.
