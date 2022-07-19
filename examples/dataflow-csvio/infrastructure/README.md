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

This directory holds code to deploy infrastructure required to deploy the Apache
Beam pipeline to run on Dataflow as a custom template. Tailor according to your
unique Google Cloud environment.

Thanks to [Timothy Itodo](https://github.com/itodotimothy6) for insight,
feedback and edits on these instructions.

# Requirements

- https://www.terraform.io/downloads

# Usage

Follow the steps below to provision resources and deploy the Dataflow custom
template to execute in your Google Cloud environment.

## 1. Navigate to dataflow-csvio root directory

Navigate to the [dataflow-csvio](../.) root directory.

```
cd professional-services/examples/dataflow-csvio
```

## 2. Configure default project

```
gcloud config set project <YOUR PROJECT ID>
```

## 3. Provision Setup

Execute the following on your terminal to provision the initial GCP project
setup.

```
DIR=infrastructure/01.setup
terraform -chdir=$DIR init
terraform -chdir=$DIR apply -var="project=$(gcloud config get-value project)"
```

## 4. Provision Network

Execute the following on your terminal to provision the custom virtual private
network.

```
DIR=infrastructure/02.network
terraform -chdir=$DIR init
terraform -chdir=$DIR apply -var="project=$(gcloud config get-value project)"
```

## 5. Provision IO

Execute the following on your terminal to provision the required IO resources in
the project for the pipeline.

```
DIR=infrastructure/03.io
terraform -chdir=$DIR init
terraform -chdir=$DIR apply -var="project=$(gcloud config get-value project)"
```

## 6. Provision Cloud Build Trigger

### 6.1 Setup special requirements for Cloud Build

See [04.template#Requirements](04.template#Requirements) for setting up
special requirements for Cloud Build.

### 6.2 Execute Cloud Build provisioning module

** SET THE NEW BASH VARIABLE REQUIRED IN THIS STEP **
```
GITHUB_REPOSITORY_OWNER=<CHANGE ME>
```

Execute the following on your terminal to provision the custom Dataflow
templates.
```
DIR=infrastructure/04.template
terraform -chdir=$DIR init
terraform -chdir=$DIR apply -var="project=$(gcloud config get-value project)" -var="github_repository_owner=$GITHUB_REPOSITORY_OWNER"
```

## 7. Manually Execute Cloud Build Trigger

Navigate to https://console.cloud.google.com/cloud-build/triggers. Click the
`RUN` button next to the created Cloud Build trigger to execute manually.

See https://cloud.google.com/build/docs/automating-builds/create-manual-triggers?hl=en#running_manual_triggers
for more information.

This step will take several minutes to complete.