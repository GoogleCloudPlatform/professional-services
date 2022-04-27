# dataflow-production-ready (Python)

## Usage

### Creating infrastructure components 

Prepare the infrastructure (e.g. datasets, tables, etc) needed by the pipeline by referring to the
[Terraform module](/terraform/README.MD)

Note the BigQuery dataset name that you crate for late steps.

### Creating Python Virtual Environment for development

In the module root directory, run the following:

```
python3 -m venv /tmp/venv/dataflow-production-ready-env
source /tmp/venv/dataflow-production-ready-env/bin/activate
pip install -r python/requirements.txt
```

### Setting the GCP Project

In the repo root directory, set the environment variables

```
export GCP_PROJECT=<PROJECT_ID>
export REGION=<GCP_REGION>
export BUCKET_NAME=<DEMO_BUCKET_NAME>
```

Then set the GCP project

```
gcloud config set project $GCP_PROJECT
```

Then, create a GCS bucket for this demo
```
gsutil mb -l $REGION -p $GCP_PROJECT gs://$BUCKET_NAME
```


### Running a full build

The build is defined by [cloudbuild.yaml](cloudbuild.yaml) and runs on Cloud Build. It applies the following steps:
* Run unit tests
* Build a container image as defined in [Dockerfile](Dockerfile)
* Create a Dataflow flex template based on the container image
* Run automated system integration test using the Flex template (including test resources provisioning)

Set the following variables:
```
export TARGET_GCR_IMAGE="dataflow_flex_ml_preproc"
export TARGET_GCR_IMAGE_TAG="python"
export TEMPLATE_GCS_LOCATION="gs://$BUCKET_NAME/template/spec.json"
```

Run the following command in the root folder

```
gcloud builds submit --config=python/cloudbuild.yaml --substitutions=_IMAGE_NAME=${TARGET_GCR_IMAGE},_IMAGE_TAG=${TARGET_GCR_IMAGE_TAG},_TEMPLATE_GCS_LOCATION=${TEMPLATE_GCS_LOCATION},_REGION=${REGION}
```

### Manual Commands

#### Prerequisites

* Create an input file similar to [integration_test_input.csv](/data/integration_test_input.csv) (or copy it to GCS and use it as input)

* Set extra variables (use same dataset name as created by the Terraform module)
```
export INPUT_CSV="gs://$BUCKET_NAME/input/path_to_CSV"
export BQ_RESULTS="project:dataset.ml_preproc_results"
export BQ_ERRORS="project:dataset.ml_preproc_errors"
export TEMP_LOCATION="gs://$BUCKET_NAME/tmp"
export SETUP_FILE="/dataflow/template/ml_preproc/setup.py"
```

#### Running pipeline locally 

Export this extra variables and run the script
```
chmod +x run_direct_runner.sh
./run_direct_runner.sh
``` 

#### Running pipeline on Dataflow service

Export this extra variables and run the script
```
chmod +x run_dataflow_runner.sh
./run_dataflow_runner.sh
``` 

#### Running Flex Templates

Even if the job runs successfully on Dataflow service when submitted locally, the template has to be tested as well since
it might contain errors in the Docker file that prevents the job from running. 

To run the flex template after deploying it, run: 

```
chmod +x run_dataflow_template.sh
./run_dataflow_template.sh
``` 

Note that the parameter setup_file must be included in [metadata.json](ml_preproc/spec/metadata.json) and passed to the pipeline. It enables working with multiple Python modules/files and it's set to the path of 
[setup.py](ml_preproc/setup.py) inside the docker container. 

#### Running Unit Tests

To run all unit tests

```
python -m unittest discover
```

To run particular test file

```
python -m unittest ml_preproc.pipeline.ml_preproc_test
```

#### Debug flex-template container image
In cloud shell, run the deployed container image using the bash endpoint 
```
docker run -it --entrypoint /bin/bash gcr.io/$PROJECT_ID/$TARGET_GCR_IMAGE
```



## Dataflow Pipeline
* [main.py](ml_preproc/main.py) - The entry point of the pipeline
* [setup.py](ml_preproc/setup.py) - To package the pipeline and distribute it to the workers. Without this file, main.py won't be able to import modules at runtime. [[source]](https://beam.apache.org/documentation/sdks/python-pipeline-dependencies/#multiple-file-dependencies) 

## Flex Templates Overview
The pipeline demonstrates how to use Flex Templates in Dataflow to create a template out of practically any Dataflow pipeline. This pipeline
does not use any [ValueProvider](https://github.com/apache/beam/blob/master/sdks/python/apache_beam/options/value_provider.py) to accept user inputs and is built like any other non-templated
Dataflow pipeline. This pipeline also allows the user to change the job
graph depending on the value provided for an option at runtime

We make the pipeline ready for reuse by "packaging" the pipeline artifacts
in a Docker container. In order to simplify the process of packaging the pipeline into a container we
utilize [Google Cloud Build](https://cloud.google.com/cloud-build/).

We preinstall all the dependencies needed to *compile and execute* the pipeline
into a container using a custom [Dockerfile](ml_preproc/Dockerfile).

In this example, we are using the following base image for Python 3:

`gcr.io/dataflow-templates-base/python3-template-launcher-base`

We will utilize Google Cloud Builds ability to build a container using a Dockerfile as documented in the [quickstart](https://cloud.google.com/cloud-build/docs/quickstart-docker).

In addition, we will use a CD pipeline on Cloud Build to update the flex template automatically.


## Continues deployment
The CD pipeline is defined in [cloudbuild.yaml](ml_preproc/cloudbuild.yaml) to be executed by Cloud Build. It follows the following steps:
1. Run unit tests
2. Build and register a container image via Cloud Build as defined in the [Dockerfile](ml_preproc/Dockerfile). The container packages the Dataflow pipeline and its dependencies and acts as the Dataflow Flex Template
3. Build the Dataflow template by creating a spec.json file on GCS including the container image ID and the pipeline metadata based on [metadata.json](ml_preproc/spec/metadata.json). The template could be run later on by pointing to this spec.json file
4. Running system integration test using the deployed Flex-template and waiting for it's results 

### Substitution variables
Cloud Build provides default variables such as `$PROJECT_ID` that could be used in the build YAML file. User defined variables could also be used in the form of `$_USER_VARIABLE`.

In this project the following variables are used:
- `$_TARGET_GCR_IMAGE`: The GCR image name to be submitted to Cloud Build (not URI) (e.g wordcount-flex-template)
- `$_TEMPLATE_GCS_LOCATION`: GCS location to store the template spec file (e.g. gs://bucket/dir/). The spec file path is required later on to submit run commands to Dataflow
- `$_REGION`: GCP region to deploy and run the dataflow flex template
- `$_IMAGE_TAG`: Image tag

These variables must be set during manual build execution or via a build trigger


### Triggering builds automatically
To trigger a build on certain actions (e.g. commits to master)
1. Go to Cloud Build > Triggers > Create Trigger. If you're using Github, choose the "Connect Repository" option.     
2. Configure the trigger
3. Point the trigger to the [cloudbuild.yaml](ml_preproc/cloudbuild.yaml) file in the repository
4. Add the substitution variables as explained in the [Substitution variables](#substitution-variables) section.

