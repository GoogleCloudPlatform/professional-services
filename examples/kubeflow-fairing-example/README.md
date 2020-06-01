# Kubeflow Fairing Examples
`Kubeflow Fairing` is a Python package that streamlines the process of building, training, and deploying machine learning
(ML) models in a hybrid cloud environment. By using Kubeflow Fairing and adding a few lines of code, you can run your ML
training job locally or in the cloud, directly from Python code or a Jupyter notebook. After your training job is
complete, you can use Kubeflow Fairing to deploy your trained model as a prediction endpoint.

In the repo, we provided three notebooks to demonstrate the usage of Kubeflow Faring:
- Fairing_XGBoost: this notebook demonstrate how to
    * Train an XGBoost model in a local notebook,
    * Train an XGBoost model remotely on Kubeflow cluster, with Kubeflow Fairing
    * Train an XGBoost model remotely on AI Platform training, with Kubeflow Fairing
    * Deploy a trained model to Kubeflow, and call the deployed endpoint for predictions, with Kubeflow Fairing

- Fairing_Tensorflow_Keras: this notebook demonstrate how to
    * Train an Keras model in a local notebook,
    * Train an Keras model remotely on Kubeflow cluster (distributed), with Kubeflow Fairing
    * Train an Keras model remotely on AI Platform training, with Kubeflow Fairing
    * Deploy a trained model to Kubeflow, with Kubeflow Fairing

- Fairing_Py_File: this notebook introduces you to using Kubeflow Fairing to train the model, which is developed
using tensorflow or keras and enclosed in python files
    * Train an Tensorflow model remotely on Kubeflow cluster (distributed), with Kubeflow Fairing
    * Train an Tensorflow model remotely on AI Platform training, with Kubeflow Fairing

**Note that Kubeflow Fairing doesn't require kubeflow cluster as pre-requisite.
Kubeflow Fairing + AI platform is a valid combination**

## Setups:
### Prerequisites
Before you follow the instructions below to deploy your own kubeflow cluster,
you need a Google cloud project if you don't have one. You can find detailed instructions
[here](https://cloud.google.com/dataproc/docs/guides/setup-project).

- Make sure the following API & Services are enabled.
    * Cloud Storage
    * Cloud Machine Learning Engine
    * Cloud Source Repositories API (for CI/CD integration)
    * Compute Engine API
    * GKE API
    * IAM API
    * Deployment Manager API

- Configure project id and bucket id as environment variable.
  ```bash
  $ export PROJECT_ID=[your-google-project-id]
  $ export GCP_BUCKET=[your-google-cloud-storage-bucket-name]
  $ export DEPLOYMENT_NAME=[your-deployment-name]
  ```

- Deploy Kubeflow Cluster on GCP.
The running of training and serving jobs on kubeflow will require a kubeflow deployment. Please refer the link
[here](https://www.kubeflow.org/docs/gke/deploy/) to set up your Kubeflow deployment in your environment.

### Setup Environment
Please refer the link [here](https://www.kubeflow.org/docs/fairing/gcp-local-notebook/) to properly
setup the environments. The key steps are summarized as follows
- Create service account
    ```bash
    export SA_NAME = [service account name]
    gcloud iam service-accounts create ${SA_NAME}
    gcloud projects add-iam-policy-binding ${PROJECT_ID} \
      --member serviceAccount:${SA_NAME}@${PROJECT_ID}.iam.gserviceaccount.com \
      --role 'roles/editor'
    gcloud iam service-accounts keys create ~/key.json \
      --iam-account ${SA_NAME}@${PROJECT_ID}.iam.gserviceaccount.com
    ```

- Authorize for Source Repository
    ```bash
    gcloud auth configure-docker
    ```

- Update local kubeconfig (for submiting job to kubeflow cluster)
    ```bash
    export CLUSTER_NAME=${DEPLOYMENT_NAME} # this is the deployment name or the kubenete cluster name
    export ZONE=us-central1-c
    gcloud container clusters get-credentials ${CLUSTER_NAME} --region ${ZONE}
    ```

- Set the environmental variable: GOOGLE_APPLICATION_CREDENTIALS
    ```bash
    export GOOGLE_APPLICATION_CREDENTIALS = ~/key.json
    ```

- Install the lastest version of fairing
    ```bash
    pip install git+https://github.com/kubeflow/fairing@master
    ```
### Running Notebook
Please not that the above configuration is required for notebook service running outside Kubeflow environment.
And the examples demonstrated are fully tested on notebook service outside Kubeflow cluster also, which
means it could be
- Notebook running on your personal computer
- Notebook on AI Platform, Google Cloud Platform
- Essentially notebook on any environment outside Kubeflow cluster

For notebook running inside Kubeflow cluster, for example JupytHub will be deployed together with kubeflow, the
environemt variables, e.g. service account, projects and etc, should have been pre-configured while
setting up the cluster. The fairing package will also be pre-installed together with the deployment. **The only thing
need to be aware is that docker is usually not installed, which would require `cluster` as the builder option as
explained in the following section**

## Concepts of Kubeflow Fairing
There are three major concepts in Kubeflow Fairing: preprocessor, builder and deployer

### Preprocessor
The preprocessor defines how Kubeflow Fairing will map a set of inputs to a context when building the container image for your training job. The preprocessor can convert input files, exclude some files, and change the entrypoint for the training job.

* **python**: Copies the input files directly into the container image.
* **notebook**: Converts a notebook into a runnable python file. Strips out the non-python code.
* **full_notebook**: Runs a full notebook as-is, including bash scripts or non-Python code.
* **function**: FunctionPreProcessor preprocesses a single function. It sets as the command a function_shim that calls the function directly.

### Builder
The builder defines how Kubeflow Fairing will build the container image for your training job, and location of the container registry to store the container image in. There are different strategies that will make sense for different environments and use cases.

* **append**: Creates a Dockerfile by appending the your code as a new layer on an existing docker image. This builder requires less to time to create a container image for your training job, because the base image is not pulled to create the image and only the differences are pushed to the container image registry.
* **cluster**: Builds the container image for your training job in the Kubernetes cluster. This option is useful for building jobs in environments where a Docker daemon is not present, for example a hosted notebook.
* **docker**: Uses a local docker daemon to build and push the container image for your training job to your container image registry.

### Deployer
The deployer defines where Kubeflow Fairing will deploy and run your training job. The deployer uses the image produced by the builder to deploy and run your training job on Kubeflow or Kubernetes.

* **Job**: Uses a Kubernetes Job resource to launch your training job.
* **TfJob**: Uses the TFJob component of Kubeflow to launch your Tensorflow training job.
* **GCPJob**: Handle submitting training job to GCP.
* **Serving**: Serves a prediction endpoint using Kubernetes deployments and services
