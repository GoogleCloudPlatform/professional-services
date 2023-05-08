# Sample web app using GCS and GCE

This code deploys a sample Web UI in a GCS bucket and a sample nodeJS based backend as container on a MIG.

A GCLB exposes frontend and backend under a joined domain, exposing the backend service via the /api path.

## How to deploy

If you are using a Service Account to deploy the Terraform script, you can add the following line to the google provider in the providers.tf file:

`impersonate_service_account = "SA_EMAIL"`

Terraform will automatically impersonate this service account when deploying the infrastructure. The account which gcloud is currently authenticated with needs to have the "Service Account Token Creator" role on the service account. You can find out which account is currently authenticated with gcloud running `gcloud auth list`. If you are not logged in yet, run `gcloud auth login` to login.

Keep in mind that your currently authenticated user still needs permission to access the state bucket, if you are using one.

## Deploy the infrastructure via Terraform

Run `terraform init` and `terraform apply`. 

## Create the A record for your domain

From the outputs, copy the IP address of the newly created load balancer. Register a new A record with yoru domain provider. The domain must be an exact match to the one you set as variable before running the script.

## Deploy the backend application

Authenticate against Artifact Registry:

`gcloud auth configure-docker REGION.pkg.dev`

Go to the src/backend folder and build the docker image to your newly created artifact registry:

`docker build -t REGION-docker.pkg.dev/PROJECT_ID/image-repo/webserver:v1 .`

Push the docker image to the registry:

`docker push REGION-docker.pkg.dev/PROJECT_ID/image-repo/webserver:v1`

## Update the cloud-init file

Go to config/cloud-init.yaml and updated the following lines with your region and project ID:

`ExecStartPre=/usr/bin/docker-credential-gcr configure-docker --registries REGION-docker.pkg.dev`

`ExecStart=/usr/bin/docker run --rm --name webserver -p 80:80 REGION.pkg.dev/PROJECT_ID/image-repo/webserver:v1`


## Apply the changes

Run `terraform apply` to apply the changes. Now you can reach your frontend under your-domain.com and the backend app under your-domain.com/api