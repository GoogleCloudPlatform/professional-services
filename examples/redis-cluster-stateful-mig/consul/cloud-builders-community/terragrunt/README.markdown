# [Terragrunt](https://github.com/gruntwork-io/terragrunt) cloud builder

## Terragrunt cloud builder
This builder can be used to run the terragrunt tool in the GCE. Terragrunt [product page](https://github.com/gruntwork-io/terragrunt) is a wrapper for Terraform [product page](https://www.terraform.io/):

## Getting started

If you are new to Google Cloud Build, we recommend you start by visiting the [manage resources page](https://console.cloud.google.com/cloud-resource-manager) in the Cloud Console, [enable billing](https://cloud.google.com/billing/docs/how-to/modify-project), [enable the Cloud Build API](https://console.cloud.google.com/flows/enableapi?apiid=cloudbuild.googleapis.com), and [install the Cloud SDK](https://cloud.google.com/sdk/docs/).


### Building this builder
To build this builder, run the following command in this directory.
```sh
$ gcloud builds submit --config=cloudbuild.yaml
```

## Using this builder

### Terragrunt backend

Terragrunt builder is based on Terraform builder [link](https://github.com/GoogleCloudPlatform/cloud-builders-community/tree/master/terraform). Most of the details about backend are the same as for terraform. Please check examples for the differences and example configuration [link](examples/gcs_backend/README.markdown)
