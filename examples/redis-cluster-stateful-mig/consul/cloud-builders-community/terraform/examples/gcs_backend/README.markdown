# GCS back end example

This is an example of how to use the Terraform cloud builder, using a GCS backend.

### Building this builder
To build this builder, run the following command in this directory.
```sh
$ gcloud builds submit . --config=cloudbuild.yaml
```

## Using this builder

1. Create a new GCloud project.
1. Open the [GCP IAM console](https://console.cloud.google.com/iam-admin) and select your GCloud project
1. Find the 'Cloud Container Builder' service account for your project. It will
   - Have the 'Cloud Container Builder' role
   - The Member ID will be <project ID>@cloudbuild.gserviceaccount.com
1. Edit the permission for that service account and add the 'Kubernetes Engine Service Agent' role.
1. Create a GCS bucket for Terraform to hold state.
1. Clone this project
1. [Build the Terraform cloud builder](../../README.markdown)
1. Navigate to this directory
1. Build this builder

## What's it do?
This builder will create a cluster named 'terraform-builder-gcs-backend' in your project, per main.tf. It will then destroy it. All told this will take around 5 minutes.

This builder uses a bucket to hold data for the Terraform GCS back end. The name of this bucket will be be passed in as a substitution to this example cloudbuild. You can create the bucket using the Google cloud [web console](https://console.cloud.google.com/storage/browser), or using gsutil:

```$ gsutil mb -l us-east1 gs://<SOME BUCKET NAME>```

The bucket will persist until you delete it. Don't forget to do that, once you're done with the examples!

## Parameterization
It's worth noting how Terraform passes variables via the command line. In cloudbuild.yaml, the project name is passed into the build steps as an environment variable
```yaml
"TF_VAR_project-name=${PROJECT_ID}"
```
TF_VAR is a prefix Terraform uses to identify tf variables; the rest maps to a variable defined in variables.tf. Depending on your needs, you may not want to parameterize values like this; you could just hard-code them in the tf files.

