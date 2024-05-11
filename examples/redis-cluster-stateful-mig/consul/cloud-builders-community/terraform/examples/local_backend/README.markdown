# Local back end example

This is an example of how to use the Terraform cloud builder, using the default backend.

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
1. Clone this project
1. [Build the Terraform cloud builder](../../README.markdown)
1. Navigate to this directory
1. Build this builder

## What's it do?
This example includes tf files for a cluster named 'terraform-builder-gcs-backend' in the current project, per main.tf. As written, the cloudbuild.yaml just initializes terraform and performs a couple of commands to parse the config and examine the current project. If you want to actually implement & destory the cluster, add these steps:
```yaml
- name: 'gcr.io/${PROJECT_ID}/terraform'
  args: ['apply', '-auto-approve']
  env:
    - "TF_VAR_project-name=${PROJECT_ID}"
- name: 'gcr.io/${PROJECT_ID}/terraform'
  args: ['destroy', '-auto-approve']
  env:
    - "TF_VAR_project-name=${PROJECT_ID}"
```
All told this will take around 5 minutes.

## Parameterization
It's worth noting how Terraform passes variables via the command line. In cloudbuild.yaml, the project name is passed into the build steps as an environment variable
```yaml
"TF_VAR_project-name=${PROJECT_ID}"
```
TF_VAR is a prefix Terraform uses to identify tf variables; the rest maps to a variable defined in variables.tf. Depending on your needs, you may not want to parameterize values like this; you could just hard-code them in the tf files.