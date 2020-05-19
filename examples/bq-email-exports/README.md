# Automated BigQuery Exports via Email

This solution enables users to regularly send BigQuery export results via email. The end users will get a scheduled email with a link to a Google Cloud Storage [signed URL](https://cloud.google.com/storage/docs/access-control/signed-urls), from which they can view query results as a JSON file.

The functional steps are listed here:

**Cloud Scheduler:** A [Cloud Scheduler](https://cloud.google.com/scheduler) job invokes the Pub/Sub topic to schedule the email export periodically. The job will take a payload which will include the configurations to run the query and send the email.
**Pub/Sub:** A [Pub/Sub](https://cloud.google.com/pubsub) topic triggers the Cloud Function.  
**Cloud Function:** A [Cloud Function](https://cloud.google.com/functions) subscribes to the Pub/Sub topic and runs the code calling the BigQuery and Cloud Storage APIs. 
**BigQuery:** The [BigQuery API](https://cloud.google.com/bigquery/docs/reference/rest) generates the query results, stores them in a table, and then exports the results as a JSON file into Cloud Storage.  
**Cloud Storage:** A [Cloud Storage](https://cloud.google.com/storage/) bucket stores the JSON file. The Cloud Storage API generates a signed URL for the JSON file.  
**SendGrid API** The [SendGrid API](https://sendgrid.com/) is a web based API that sends the signed URL as an email to users.

To implement this solution, follow the steps below:

## Set Up
1. Generate a SendGrid API key by creating a free tier [SendGrid account](https://signup.sendgrid.com/).

2. Set the variables in `terraform/payload.txt` to the appropriate values. The variables `project_id`, `dataset_id`, and `bucket_name` will be imported from Terraform. The payload will be sent from Cloud Scheduler to the function. This way, the same Cloud Function can be used for different queries and emails by simply updating the payload. Keep in mind that the `table_name` in `terraform/payload.txt` will automatically have a timestamp appended to the end from the Cloud Function code.

## Deploying the pipeline

To deploy the pipeline, run:
```bash
cd terraform
terraform init
terraform apply
```
The Terraform code will use a compressed version of the `source/` directory containing `main.py` and `requirements.txt` as the source code for the Cloud Function.

## Caveats and Considerations
1. This solution will only handle queries that can be executed and exported to Google Cloud Storage within 9 minutes, which is the Cloud Functions maximum execution timeout.

2. BigQuery can export up to 1 GB of data to a single file. If your query results are over 1 GB, you must export your data to multiple files in GCS which this solution does not support. Another option would be to use [GCS Compose](https://cloud.google.com/storage/docs/composite-objects) to concatenate multiple objects in order to email only one file. 

3. Signed URLs can be a data exfiltration risk. Consider the security risks regarding the sending of data through a signed URL.

4. Cloud Scheduler is not supported by [VPC Service Controls](https://cloud.google.com/vpc-service-controls/docs/supported-products).

If your use case does not meet the above constraints, another option would be to use a [Cloud Composer workflow](https://cloud.google.com/composer/docs/how-to/using/writing-dags) to execute the pipeline. If you are a GSuite user, this solution can also be implemented with a scheduled [Apps Script](https://developers.google.com/apps-script) using the [BigQuery Service](https://developers.google.com/apps-script/advanced/bigquery) and exporting data to a [Google Sheet](https://developers.google.com/apps-script/reference/spreadsheet).

## Running Code Locally

To run `main.py` locally, make sure that the environment variable `GOOGLE_APPLICATION_CREDENTIALS` is set to the path to the service account JSON key file. Ensure that the service account has these permissions:
+ roles/bigquery.admin
+ roles/storage.objectAdmin
+ roles/iam.serviceAccountTokenCreator

In addition, for the code to use the correct credentials, set 
```bash
export IS_LOCAL=1
```
