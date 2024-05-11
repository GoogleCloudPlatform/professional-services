# GCS backend example

This is an example of how to use the Terragrunt cloud builder, using a GCS backend.

### Building this builder
To build this builder, run the following command in this directory.
```sh
$ gcloud builds submit . --config=cloudbuild.yaml
```

## Using this builder

1. Create a new GCloud project.
1. Open the [GCP IAM console](https://console.cloud.google.com/iam-admin) and select your GCloud project
1. Find the 'Cloud Container Builder' service account for your project.
1. Edit the permission for that service account and add required roles
1. Create a GCS bucket for Terraform to hold state.
1. Clone this project
1. [Build the Terraform cloud builder](../../README.markdown)
1. Navigate to this directory
1. Build this builder

## What's it do?
Creates pubsub topic for prod and dev environment

This builder uses a bucket to hold data for the Terraform GCS back end. You can create the bucket using the Google cloud [web console](https://console.cloud.google.com/storage/browser), or using gsutil:

```$ gsutil mb -l us-east1 gs://<SOME BUCKET NAME>```

The bucket will persist until you delete it. Don't forget to do that, once you're done with the examples!

## How to configure bucket name
The bucket name is configured inside [terraform.tfvars](env/terraform.tfvars)
