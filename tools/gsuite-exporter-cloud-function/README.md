# GSuite log exporter in a Cloud Function

## Overview
The GSuite Log Exporter Tool calls GSuite APIs to pull logs from GSuite  into Cloud Logging on GCP. This example uses a simple script to deploy a Cloud Function integrated with a Cloud Scheduler job that executes the GSuite Log Exporter Tool on a specified cadence.

## Requirements
- `A Cloud Logging Project`: GCP Project prepared for hosting the Cloud Function and the logs from G Suite.
- `A Service Account`: The Service Account in the Cloud Logging Project used to run the Cloud Function

- Grant these IAM roles to your service account:
  - `roles/iam.tokenCreator`
  - `roles/logging.viewer`
  - `roles/logging.logWriter`

- Enables these APIs in the Cloud Logging Project:
  - `Identity and Access Management (IAM) API`
  - `Admin SDK (Admin Reports API)`
  - `Cloud Functions API`
  - `Cloud Scheduler API`
  - `App Engine API`


- Grant the following API scopes to your service account's client_id in the Admin Console under Admin Console > Security > Advanced Settings > Manage API client access:
  - https://www.googleapis.com/auth/admin.reports.audit.readonly
  - https://www.googleapis.com/auth/iam

  The scopes should be entered in a comma-separated list. Populate the Client Name field with your service account's client_id. To find the client_id of your service account, run the following command:
  `gcloud iam service-accounts describe <service-account> --format="value(uniqueId)"`

## Execute the script
Make sure you have the Google Cloud SDK downloaded and can run gcloud commands from your command line. Run the following commands:
`gcloud config set project <logging-project-name>`
`./deploy.sh`

## Alternatives
- [A Terraform module to deploy Gsuite Exporter on a GCE VM](https://github.com/terraform-google-modules/terraform-google-gsuite-export)
- [A Terraform module to deploy the exporter on Google Cloud Functions](https://github.com/terraform-google-modules/terraform-google-gsuite-export/tree/master/examples/cloud_function)
- [The GSuite Exporter tool](https://github.com/GoogleCloudPlatform/professional-services/tree/master/tools/gsuite-exporter)

## Troubleshooting
There’s a chance that you have not created an App Engine app in the project yet. It is required to have App Engine set up before you can deploy a Cloud Scheduler job. To create an App Engine app, simply follow the instructions on screen while running the deploy script.
