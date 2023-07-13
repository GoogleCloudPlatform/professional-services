# Reference KFP Pipeline

We include here a reference KFP pipeline implementation, that follows best practices such as:

* Traceability of data by storing training, test and validation datasets as an intermediate artifact
* Splitting the input data into training, test and validation and giving the training step only access to the training and test data
* Producing a model card for flexibility of governance
* Evaluate the model performance metrics and upload this evaluation to Vertex Model Registry

## Preparing to run the reference pipeline

The custom components used in this pipeline use a custom package, mainly to be able to access the configuration in `config.py`. Prior to building this custom image, we need to set the following environment variables:

```
export PROJECT_ID=<your-project-id>
export REGION=<region>
export ARTIFACT_REG_REPO=kfp_reference_pipeline # or choose a different name
```

First create a docker repository in Artifact Registry to store the image:

```
gcloud artifacts repositories create $ARTIFACT_REG_REPO --project=$PROJECT --location=$REGION --repository-format=docker
```

This custom image is built with the following command, executed from this directory (where the `Dockerfile` is):

```
gcloud builds submit --tag ${REGION}-docker.pkg.dev/${PROJECT_ID}/${ARTIFACT_REG_REPO}/base:latest
```

## Launch the pipeline

From the `src` directory:

```
python pipeline.py
```
