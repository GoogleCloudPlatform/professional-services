# Dataflow Flex Template CICD

This is a proof-of-concept for continuously deploying a Dataflow job using [Flex Template](https://cloud.google.com/dataflow/docs/guides/templates/overview#flex-templated-dataflow-jobs) and Cloud Build.

It extends the work in [DataflowTemplates/flex-wordcount-python](https://github.com/GoogleCloudPlatform/DataflowTemplates/tree/master/v2/flex-wordcount-python) by adding the CICD pipeline and usage.


## Overview
The Wordcount pipeline demonstrates how to use the new Flex Templates
feature in Dataflow to create a template out of practically any Dataflow pipeline. This pipeline
does not use any [ValueProvider](https://github.com/apache/beam/blob/master/sdks/python/apache_beam/options/value_provider.py) to accept user inputs and is built like any other non-templated
Dataflow pipeline. This pipeline also allows the user to change the job
graph depending on the value provided for an option at runtime
(*--format=text|avro|parquet*)

We make the pipeline ready for reuse by "packaging" the pipeline artifacts (python file + [command specs](python_command_spec.json))
in a Docker container. In order to simplify the process of packaging the pipeline into a container we
utilize [Google Cloud Build](https://cloud.google.com/cloud-build/).

We preinstall all the dependencies needed to *compile and execute* the pipeline
into a container using a custom [Dockerfile](Dockerfile).

In this example, we are using the following base image for Python 3:

`gcr.io/dataflow-templates-base/python3-template-launcher-base`

We will utilize Google Cloud Builds ability to build a container using a Dockerfile as documented in the [quickstart](https://cloud.google.com/cloud-build/docs/quickstart-docker).

In addition, we will use a CICD pipeline on Cloud Build to update the flex template automatically.

## Dataflow Pipeline
[WordCount Example](wordcount.py) - The Wordcount pipeline is a batch pipeline which performs a wordcount on an input text file (via --input flag) and writes the word count to GCS. The output format is determined by the value of the --format flag which can be set to either text, avro or parquet.

## Getting started
To run the CICD pipeline end-to-end:

1. Create a fork/copy of this repo on Github or Cloud Source Repositories, or start a new one.
2. Trigger a manual or automated build as explained in the [CICD](#CICD) section.
3. Run the template as explained in the [Running Flex Templates](#Running-flex-templates) section.
4. Monitor the job progress in the Dataflow job history page.


## CICD
### Steps
The CICD pipeline is defined in [cloudbuild.yaml](cloudbuild.yaml) to be executed by Cloud Build. It follows the following steps:
1. Build and register a container image via Cloud Build as defined in the [Dockerfile](Dockerfile). The container packages the Dataflow pipeline and its dependencies and acts as the Dataflow Flex Template
2. Create a spec file for the created Flex Template with the container image URL
3. Copy the spec file to GCS

### Substitution variables
Cloud Build provides default variables such as $PROJECT_ID that could be used in the build YAML file. User defined variables could also be used in the form of $_USER_VARIABLE.

In this project the following variables are used:
- $_TARGET_GCR_IMAGE: The GCR image name to be submitted to Cloud Build (not URI) (e.g wordcount-flex-template)
- $_TEMPLATE_GCS_LOCATION: GCS location to store the template spec file (e.g. gs://bucket/dir/). The spec file path is required later on to submit run commands to Dataflow

These variables must be set during manual build execution or via a build trigger

### Manual builds

In the repo root directory, run the following command:
```
gcloud builds submit --config=cloudbuild.yaml --substitutions=_TARGET_GCR_IMAGE="word_count_flex_template_python",_TEMPLATE_GCS_LOCATION="gs://bucket/dir/"
```
PS: make sure that your latest code changes are pushed to the repo since the build will clone it from there and won't use the local version

### Triggering builds automatically
To trigger a build on certain actions (e.g. commits to master)
1. Go to Cloud Build > Triggers > Create Trigger. If you're using Github, choose the "Connect Repository" option.     
2. Configure the trigger
3. Point the trigger to the cloudbuild.yaml file in the repository
4. Add the substitution variables as explained in the [Substitution variables](#substitution-variables) section.


## Running Flex Templates
After deploying the template, one can invoke it using this API call
```
API_ROOT_URL="https://dataflow.googleapis.com"
TEMPLATES_LAUNCH_API="${API_ROOT_URL}/v1b3/projects/${PROJECT}/templates:launch"
JOB_NAME="wordcount-flex-template-`date +%Y%m%d-%H%M%S`"
INPUT_FILE="gs://path/to/input/file"
OUTPUT_FILE="gs://path/to/output/dir"
FORMAT="text"
time curl -X POST -H "Content-Type: application/json"     \
     -H "Authorization: Bearer $(gcloud auth print-access-token)" \
     "${TEMPLATES_LAUNCH_API}"`
     `"?validateOnly=false"`
     `"&dynamicTemplate.gcsPath=gs://path/to/image/spec"`
     `"&dynamicTemplate.stagingLocation=gs://path/to/stagingLocation" \
     -d '
      {
       "jobName":"'$JOB_NAME'",
       "parameters": {
                   "input":"'$INPUT_FILE'",
                   "output":"'$OUTPUT_FILE'",
                   "format":"'$FORMAT'",
        }
       }
      '

```
PS: If needed, this manual step could be added in the [cloudbuild.yaml](cloudbuild.yaml) to run the latest version of the pipeline as part of the CICD

## Assumptions and limitations
1. The "clone-source-code" step in [cloudbuild.yaml](cloudbuild.yaml) is configured for a public Github repo. Private repos and/or Cloud Source Repos would require setting up authorization to access them.
2. In complex deployments on GCP, IAM would need to be configured to grant access from/to services such as GCS, CSR, Dataflow and Cloud Build.  
