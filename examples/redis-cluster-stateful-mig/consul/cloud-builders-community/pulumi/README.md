# Pulumi CLI

This builder installs the [`Pulumi CLI`](https://pulumi.io/quickstart/install.html) in a Node 8-based Docker image. You can use this image to install other language tools too. If you would like to see the Pulumi builder for other languages, please contact us on our community [Slack](https://slack.pulumi.io).

## What is Pulumi?

Use your favorite languages to build, deploy, and manage cloud software – on any cloud – with one workflow for developers and operators alike.
Learn more at [pulumi.com](https://www.pulumi.com).

## Quick Start

1. Build this image and add it to your gcr repo

```
$ git clone git@github.com:GoogleCloudPlatform/cloud-builders-community
$ cd cloud-builders/pulumi
$ gcloud builds submit .
```

2. Add the steps to your `cloudbuild.yaml`

Create a project on Pulumi quickly using one of our examples. Click [![Deploy](https://get.pulumi.com/new/button.svg)](https://app.pulumi.com/new) to get started now.

The following cloud build configuration snippet uses build variable substitution as a quickstart example. [Substitutions](https://cloud.google.com/cloud-build/docs/configuring-builds/substitute-variable-values) are not treated as sensitive values in Cloud Build.
Sensitive values such as access tokens, and other secrets should encrypt such environment variables.

Learn how to encrypt env variables and use them in your build configuration [here](https://cloud.google.com/cloud-build/docs/securing-builds/use-encrypted-secrets-credentials#encrypting_an_environment_variable_using_the_cryptokey).

```
$ cd my-project
$ cat >> cloudbuild.yaml
steps:
- name: gcr.io/$PROJECT_ID/pulumi-node
  entrypoint: /bin/sh
  args:
  - '-c'
  - 'yarn install && pulumi login && pulumi stack select <stack_name> && pulumi preview'
  env: ["PULUMI_ACCESS_TOKEN=$_INSECURE_SUBSTITUTION_PULUMI_ACCESS_TOKEN_FOR_TESTING"]
CTRL-D
```

3. [![Deploy](https://get.pulumi.com/new/button.svg)](https://app.pulumi.com/new) and select a template

4. Submit a manual build of your project to Cloud Build when you are ready
```
$ cd my-project
$ gcloud builds submit .
```

At this point you can automate the build using triggers via GCP Repos or Github. See [this](https://pulumi.io/reference/cd-google-cloud-build.html) doc on how to integrate Pulumi into your CI/CD setup.
