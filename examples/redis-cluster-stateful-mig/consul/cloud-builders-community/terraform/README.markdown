# [Terraform](https://www.terraform.io/docs) cloud builder
This builder can be used to run the terraform tool in GKE. From the Hashicorp Terraform 
[product page][terraform]:

> HashiCorp Terraform enables you to safely and predictably create, change, and improve 
> infrastructure. It is an open source tool that codifies APIs into declarative configuration 
> files that can be shared amongst team members, treated as code, edited, reviewed, and versioned.

[terraform]: https://www.terraform.io/

## Getting started

If you are new to Google Cloud Build, we recommend you start by visiting the [manage resources page](https://console.cloud.google.com/cloud-resource-manager) in the Cloud Console, [enable billing](https://cloud.google.com/billing/docs/how-to/modify-project), [enable the Cloud Build API](https://console.cloud.google.com/flows/enableapi?apiid=cloudbuild.googleapis.com), and [install the Cloud SDK](https://cloud.google.com/sdk/docs/).

This builder can be used to run the terraform tool in the GCE. From the Hashicorp Terraform 
[product page][terraform]:

> HashiCorp Terraform enables you to safely and predictably create, change, and improve 
> infrastructure. It is an open source tool that codifies APIs into declarative configuration 
> files that can be shared amongst team members, treated as code, edited, reviewed, and versioned.

[terraform]: https://www.terraform.io/

### Building this builder

To build this builder with the default version, run the following command in this directory.
```sh
$ gcloud builds submit --config=cloudbuild.yaml
```

To override the builder version for Terraform, run the following command in this directory 
(make sure to update the version and the SHA256 hash with the desired ones).

```
$ gcloud builds submit --config=cloudbuild.yaml \
  --substitutions=_TERRAFORM_VERSION="0.12.29",_TERRAFORM_VERSION_SHA256SUM="872245d9c6302b24dc0d98a1e010aef1e4ef60865a2d1f60102c8ad03e9d5a1d"
```

## Using this builder

### Terraform backend
The default backend for Terraform is local, which will store state information the working directory in ```$ ./.terraform```. Most build platforms (including Cloud Build) do not persist the working directory between builds. Losing this state information is no bueno.

Terraform stores state information about infrastructure it has provisioned. 
It uses this to plan out the delta between what your .tf files specifiy, and what's actually out there. 
This state can be stored in different ways by Terraform; it is configured via 
[backends][terraform-backends].


There are a couple of options for managing Terraform state across builds:

[terraform-backends]: https://www.terraform.io/docs/backends/

###### Ignore the issue

In your build, you'll want to initialize terraform and refresh the local state. 
This is really **not a good idea**; it'll be slow and not multi-run safe 
(if multiple runs kick off concurrently, there'll be nastiness such as race conditions). 
[local_backend](examples/local_backend/README.markdown) is an example of this approach.

###### Persist the state in a GCS bucket manually

In your build, set up steps to manually fetch the state before running Terraform, 
then push it back up after Terraform is done. This will help by removing the need 
to init & refresh on every build; but will not address the concurrency issues.

###### Use a backend for remote storage

This is probably what you want to do. You'll still need to set up your GCS storage, 
and you'll need to configure the backend in your tf configurations. 
Some backends (happily, the [GCS][terraform-gcs-backend] one does!) 
support locking of the remote state. This helps address the concurrency issue. 
[gcs_backend](examples/gcs_backend/README.markdown) is an example of this approach.

[terraform-gcs-backend]: https://www.terraform.io/docs/backends/types/gcs.html

### Using this builder with Google Kubernetes Engine (GKE)
To use this builder, your [builder service account](https://cloud.google.com/build/docs/securing-builds/configure-access-for-cloud-build-service-account) will need IAM permissions sufficient for the operations you want to perform. Adding the 'Kubernetes Engine Service Agent' role is sufficient for running the examples. Refer to the Google Cloud Platform [IAM integration page](https://cloud.google.com/kubernetes-engine/docs/concepts/access-control) for more info.

To use this builder, your [builder service account][builder-sa-permissions] will need IAM 
permissions sufficient for the operations you want to perform. Adding the 
'Kubernetes Engine Service Agent' role is sufficient for running the examples. 
Refer to the Google Cloud Platform [IAM integration page][iam-integration] for more info.

The article [Managing GCP projects with terraform][gcp-with-terraform] 
gives a good strategy for administering projects in GCP with Terraform. 
If you intend to go beyond the examples, strongly consider an approach that isolates 
service accounts by function. A service account that can do 'all the things' is risky.

[builder-sa-permissions]: https://cloud.google.com/cloud-build/docs/securing-builds/configure-access-for-cloud-build-service-account
[iam-integration]: https://cloud.google.com/container-engine/docs/iam-integration
[gcp-with-terraform]: https://cloud.google.com/community/tutorials/managing-gcp-projects-with-terraform

### Concurrently deploying to multiple regions

Platform teams usually attempt to complete the full set of their deployments within a certain time. [This example](./examples/infra_at_scale/) demonstrates how you can concurrently deploy your infrastructure to multiple regions with Cloud Build and Terraform.

### Using this builder image anywhere else
This image can be run on any Docker host, without GCE. Why would you want to do this? 
It'll let you run Terraform locally, with no environment dependencies other than a Docker host installation. 
You can use the [local Cloud Build][cloud-build-local-debug] for this; 
but if you're curious or have weird / advanced requirements (for example, if you want 
to run Terraform as a build step on another platform like Travis or Circle CI, 
and don't want to use Cloud Build, it is an option).

You'll need to:

 1. Provide a service account key file
 2. Mount your project directory at '/workspace' when you run docker
 ```sh
docker run -it --rm -e GCLOUD_SERVICE_KEY=${GCLOUD_SERVICE_KEY} \
  --mount type=bind,source=$PWD,target=/workdir \
  -w="/workdir" \
  gcr.io/$PROJECT_ID/terraform <command>
```

[cloud-build-local-debug]: https://cloud.google.com/cloud-build/docs/build-debug-locally
