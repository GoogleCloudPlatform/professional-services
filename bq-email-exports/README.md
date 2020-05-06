# Automated BigQuery Exports via Email

This solution enables users to regularly send BigQuery export results via email. 

The functional steps are listed here:

**Cloud Scheduler:** A Cloud Scheduler job invokes the Pub/Sub topic to schedule the email export periodically.  
**Pub/Sub:** A Pub/Sub topic triggers the Cloud Function.  
**Cloud Function:** A Cloud Function subscribes to the Pub/Sub topic and runs the code calling the BigQuery and Cloud Storage APIs.  
**BigQuery:** The BigQuery API generates the query results, stores them in a table, and then exports the results as a CSV into Cloud Storage.  
**Cloud Storage:** A Cloud Storage bucket stores the CSV file. The Cloud Storage API generates a signed URL for the CSV.  
**SendGrid API** The [SendGrid API](https://sendgrid.com/) is a web based API that sends the signed URL as an email to users.

To implement this solution, follow the steps below:

## Set Up
1. Create a BigQuery Dataset and set a default expiration time of the table to prevent storing outdated data.
```bash
bq --location=US mk -d --default_table_expiration 3600 bq_exports
```
2. Create a Google Cloud Storage bucket to host the exported CSV files from BigQuery.
```bash   
gsutil mb gs://bq_email_exports/
```
3. Generate a SendGrid API key by creating a free tier [SendGrid account](https://signup.sendgrid.com/).

## Deploying the pipeline

To deploy the pipeline, first update the variables in `deploy.sh` and `main.py`. Then, run:
```bash
./deploy.sh
```
This file creates a service account with the BigQuery Admin, Storage Object Admin, and Service Account Token Creator roles. These roles are needed to run the query, generate the signed URL, and generate the signing credentials to authenticate the `generate_signed_url()` function.

It also creates the Pub/Sub topic to trigger the Cloud Function, deploys the Cloud Function using `main.py`, and creates a Cloud Scheduler job to run the function on a regular interval. 

## Running Code Locally

To run `main.py` locally, make sure that the environment variable `GOOGLE_APPLICATION_CREDENTIALS` is set to the path to the service account JSON key file. Ensure that the service account has these permissions:
+ roles/bigquery.admin
+ roles/storage.objectAdmin
+ roles/iam.serviceAccountTokenCreator

In addition, for the code to use the correct credentials, set 
```bash
export IS_LOCAL=1
```
