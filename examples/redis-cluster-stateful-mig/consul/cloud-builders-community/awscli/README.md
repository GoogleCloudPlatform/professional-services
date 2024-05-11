# aws command line interface

This is a tool build to simply invoke the
[`awscli`](https://aws.amazon.com/cli/).

`awscli` is useful for managing resources and deploying applications
across AWS and GCP

Arguments passed to this builder will be passed to `awscli` directly.

## Quick Start

1. Build this image and add it to your gcr repo

```
$ git clone git@github.com:GoogleCloudPlatform/cloud-builders-community
$ cd cloud-builders/aws-cli
$ gcloud builds submit .
```

2. Add the steps to your `cloudbuild.yaml`

```
$ cd my-project
$ cat >> cloudbuild.yaml
steps:
- name: gcr.io/$PROJECT_ID/awscli
  args: ['s3', 'sync', '/workspace/', 's3://my-bucket/]
  env: ["AWS_ACCESS_KEY_ID=XXXXXXXXXXXXX", "AWS_SECRET_ACCESS_KEY=YYYYYYYYYYYYYY"]
CTRL-D
```

3. Submit a manual build of your project to Cloud Build
```
$ cd my-project
$ gcloud builds submit .
```

At this point you can automate the build using triggers via GCP Repos or Github


## Authentication

AWS Authentication credentials are passed in via environment variables.
```
env: ["AWS_ACCESS_KEY_ID=XXXXXXXXXXXX", "AWS_SECRET_ACCESS_KEY=YYYYYYYYYYY"]
```

## Example: Deploy Files to S3 Bucket


**Be sure to set AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY**
```
steps:
- name: gcr.io/$PROJECT_ID/awscli
  args: ['s3', 'sync', '/workspace/', 's3://my-bucket/]
  env: ["AWS_ACCESS_KEY_ID=XXXXXXXXXXXXX", "AWS_SECRET_ACCESS_KEY=YYYYYYYYYYYYYY"]
```
