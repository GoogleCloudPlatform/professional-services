# Dataflow Python builder

## Introduction

[Google Cloud Dataflow](https://cloud.google.com/dataflow/), based on [Apache Beam](https://beam.apache.org/), is a fully-managed service for transforming and enriching data in stream (real time) and batch (historical) modes with equal reliability and expressiveness.  Developers and Data Scientists use Dataflow to process large amounts of data without managing complex cluster infrastructure.

[Google Cloud Build](https://cloud.google.com/cloud-build/) offers a number of advantages for Cloud Dataflow developers:
* Small workloads which run in a `n1-standard-1` virtual machine can take advantage of the [free tier](https://cloud.google.com/cloud-build/pricing), which provides 120 free build-minutes per day
* Workflows start very quickly, typically within a few seconds (depending on the size of your container)
* Pipelines get all the benefits of containerization, including a consistent environment and integration with your CI/CD flow
* Cloud Build supports automatic triggering from Github, Bitbucket and Google Cloud
  Source Repositories, so you can configure your data warehouse to automatically
  update when the pipeline code changes
* Pipelines can be initiated by a simple [REST
  API](https://cloud.google.com/cloud-build/docs/api/reference/rest/).

The builder supports both Dataflow execution modes:
* *DirectRunner* runs your code in-process inside Cloud Build, taking
  advantage of the fast start and free tier pricing
* *DataflowRunner* starts workers on Compute Engine, allowing for massive
  scalability.

This builder supports the Cloud Dataflow Python API.

## Usage

If this is your first time using Cloud Build, follow the [Quickstart for
Docker](https://cloud.google.com/cloud-build/docs/quickstart-docker) to
get started.

Then, clone this code and build the builder:

```
gcloud builds submit --config=cloudbuild.yaml .
```

To access resources on Google Compute Platform from your pipeline - whether
Cloud Storage, BigQuery datasets, or Dataflow runners - issue the following
commands to permission your Cloud Build service account:

```
# Setup IAM bindings
export PROJECT=$(gcloud info --format='value(config.project)')
export PROJECT_NUMBER=$(gcloud projects describe $PROJECT --format 'value(projectNumber)')
export CB_SA_EMAIL=$PROJECT_NUMBER@cloudbuild.gserviceaccount.com
gcloud projects add-iam-policy-binding $PROJECT --member=serviceAccount:$CB_SA_EMAIL --role='roles/iam.serviceAccountUser' --role='roles/iam.serviceAccountActor' --role='roles/dataflow.admin'
# Enable Dataflow API
gcloud services enable dataflow.googleapis.com
# Setup GCS bucket
gsutil mb gs://cloudbuild-dataflow-$PROJECT
```

## Python notes

Python has several different dependency management tools, which interact in
different ways with containers.  In this case we use `virtualenv` to setup an
isolated folder inside the container with the libraries we need.  As a result of
this, be sure that your first build step loads the `virtualenv` environment.
See examples for details.

Additional libraries can be added by creating another container based on this
one, for example:

```
FROM gcr.io/my-project/dataflow-python3

RUN /bin/bash -c "source venv/bin/activate"

RUN pip install my-library
...
```

## Examples

For examples, see the [examples
directory](https://github.com/GoogleCloudPlatform/cloud-builders-community/tree/master/dataflow-python3/examples).

