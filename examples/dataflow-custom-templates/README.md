<!--
Copyright 2022 Google LLC

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    https://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
-->

# Overview

The purpose of this walkthrough is to create
[Custom Dataflow templates](https://cloud.google.com/dataflow/docs/concepts/dataflow-templates).

The value of Custom Dataflow templates is that it allows us to execute
Dataflow jobs without installing any code.  This is useful to enable Dataflow
execution using an automated process or to enable others without technical
expertise to run jobs via a user-friendly guided user interface.

You have two options to walkthrough the steps to deploy this example:

1. See [Easy Walkthrough](README.md#Easy%20Walkthrough) to walk through the steps
without installing anything on your local machine.
2. See [Requirements](README.md#Requirements) and beyond for an unguided approach.

# Easy Walkthrough 🏖️

For an easy walkthrough without installing anything on your local machine:

[![Open in Cloud Shell](https://gstatic.com/cloudssh/images/open-btn.svg)](https://shell.cloud.google.com/cloudshell/editor?cloudshell_git_repo=https%3A%2F%2Fgithub.com%2FGoogleCloudPlatform%2Fprofessional-services&cloudshell_git_branch=main&cloudshell_workspace=examples%2Fdataflow-custom-templates&cloudshell_tutorial=examples%2Fdataflow-custom-templates%2Fcloud_shell_tutorial.md)

# Requirements

- [Google Cloud SDK](https://cloud.google.com/sdk); `gcloud init`
  and `gcloud auth`
- Google Cloud project with billing enabled
- [terraform](https://www.terraform.io/)

Additionally, refer to each of the following folders for specific requirements.

- [Java](java)
- [Python](python)

# Deployment

In the [examples/dataflow-custom-templates](.) folder of this repository, run the following
[terraform](https://www.terraform.io/) in order to provision resources for your
GCP project.

## 1. Create a new Google Cloud project

**It is recommended to go through this walkthrough using a new temporary Google
Cloud project, unrelated to any of your existing Google Cloud projects.**

See https://cloud.google.com/resource-manager/docs/creating-managing-projects
for more details.

## 2. Configure default project

To simplify the following commands, set the default GCP project.

```
PROJECT=<CHANGE ME>
gcloud config set project $PROJECT
```

## 3. Setup environment

Best practice recommends a Dataflow job to:
1) Utilize a worker service account to access the pipeline's files and resources
2) Minimally necessary IAM permissions for the worker service account
3) Minimally required Google cloud services

Therefore, this step will:

- Create service accounts
- Provision IAM credentials
- Enable required Google cloud services

Run the terraform workflow in
the [infrastructure/01.setup](infrastructure/01.setup) directory.

Terraform will ask your permission before provisioning resources.
If you agree with terraform provisioning resources,
type `yes` to proceed.

```
DIR=infrastructure/01.setup
terraform -chdir=$DIR init
terraform -chdir=$DIR apply -var="project=$(gcloud config get-value project)"
```

## 4. Provision Network

Best practice recommends a Dataflow job to:
1) Utilize a custom network and subnetwork
2) Minimally necessary network firewall rules
3) Building Python custom templates additionally requires the use of a
   [Cloud NAT](https://cloud.google.com/nat/docs/overview); per best practice we
   execute the Dataflow job using private IPs

Therefore, this step will:

- Provision a custom network and subnetwork
- Provision firewall rules
- Provision a Cloud NAT and its dependent Cloud Router

```
DIR=infrastructure/02.network
terraform -chdir=$DIR init
terraform -chdir=$DIR apply -var="project=$(gcloud config get-value project)"
```

## 5. Provision IO

The Apache Beam example that our Dataflow template executes is a derived word
count for both [Java](https://github.com/apache/beam/blob/master/examples/java/src/main/java/org/apache/beam/examples/MinimalWordCount.java)
and [python](https://github.com/apache/beam/blob/master/sdks/python/apache_beam/examples/wordcount_minimal.py).

The word count example requires a source [Google Cloud Storage](https://cloud.google.com/storage) bucket.
To make the example interesting, we copy all the files from
`gs://apache-beam-samples/shakespeare/*` to a custom bucket in our project.

Therefore, this step will:
- Provision a Google Cloud storage bucket
- Create Google Cloud storage objects to read from in the pipeline

Run the terraform workflow in
the [infrastructure/03.io](infrastructure/03.io) directory.

Terraform will ask your permission before provisioning resources.
If you agree with terraform provisioning resources,
type `yes` to proceed.

```
DIR=infrastructure/03.io
terraform -chdir=$DIR init
terraform -chdir=$DIR apply -var="project=$(gcloud config get-value project)"
```

## 6. Provision the Dataflow template builder 

We will use [Cloud Build](https://cloud.google.com/build) to build the
custom Dataflow template.  There are advantages to using Cloud Build to build
our custom Dataflow template, instead of performing the necessary commands on
our local machine.  Cloud Build connects to our version control,
[GitHub](https://GitHub.com) in this example, so that any changes made to
a specific branch will automatically trigger a new build of our Dataflow
template.

Therefore, this step will:

- Provision cloud build trigger that will:
  1. Run the language specific build process i.e. gradle shadowJar, go build, etc.
  2. Execute the `gcloud dataflow flex-template` command with relevant arguments.
 
### 6.1 Setup special requirements for Cloud Build

In order to benefit from [Cloud Build](https://cloud.google.com/build), the service
requires we own this repository; it will not work with a any repository, even
if it is public.

See [infrastructure/04.template#Requirements](infrastructure/04.template#Requirements)

### 6.2 Execute module

First, set your GitHub organization or username:

```sh
GITHUB_REPO_OWNER=<change me>
```

Run the terraform workflow in
the [infrastructure/04.template](infrastructure/04.template) directory.

Terraform will ask your permission before provisioning resources.
If you agree with terraform provisioning resources,
type `yes` to proceed.

```sh
DIR=infrastructure/04.template
terraform -chdir=$DIR init
terraform -chdir=$DIR apply -var="project=$(gcloud config get-value project)" -var="github_repository_owner=$GITHUB_REPO_OWNER"
```

## 7. Run Cloud Build Trigger

Navigate to https://console.cloud.google.com/cloud-build/triggers.
You should see a Cloud Build trigger listed for each language of this example.
Click the `RUN` button next to the created Cloud Build trigger to execute the
custom template Cloud Build trigger for your language of choice manually.

See https://cloud.google.com/build/docs/automating-builds/create-manual-triggers?hl=en#running_manual_triggers
for more information.

This step will take several minutes to complete.

## 8. Execute the Dataflow Template

### 1. Start the Dataflow Job creation form

There are multiple ways to run a Dataflow Job from a custom template.  We will
use the Google Cloud Web UI.

To start the process, navigate to https://console.cloud.google.com/dataflow/createjob.

### 2. Select Custom Template

Select `Custom Template` from the `Dataflow template` drop down menu.  Then,
click the `BROWSE` button and navigate to the bucket with the name that starts
with `dataflow-templates-`.  Within this bucket, select the json file object
that represents the template details.  You should see a JSON file for each
of the Cloud Build triggers you ran to create the custom template.

### 3. Complete Dataflow Job template UI form

The Google Cloud console will further prompt for required fields such as Job
name and any required fields for the custom Dataflow template.

### 4. Run the template

When you are satisfied by the values provided to the custom Dataflow template,
click the `RUN` button.

### 5. Monitor the Dataflow Job

Navigate to https://console.cloud.google.com/dataflow/jobs to locate the job
you just created.  Clicking on the job will let you navigate to the job
monitoring screen.

# Clean up

To clean up resources provisioned by the terraform modules, run the following:

Terraform will ask you to confirm with `yes` to proceed.

Destroy the Cloud Build triggers:
```sh
DIR=infrastructure/04.template
terraform -chdir=$DIR destroy -var="project=$(gcloud config get-value project)" -var="github_repository_owner=$GITHUB_REPO_OWNER"
```

Destroy the Google Cloud storage resources:
```sh
DIR=infrastructure/03.io
terraform -chdir=$DIR destroy -var="project=$(gcloud config get-value project)"
```

Destroy the custom networking resources
```sh
DIR=infrastructure/02.network
terraform -chdir=$DIR destroy -var="project=$(gcloud config get-value project)"
```

Destroy the provisioned setup resources
```sh
DIR=infrastructure/01.setup
terraform -chdir=$DIR destroy -var="project=$(gcloud config get-value project)"
```
