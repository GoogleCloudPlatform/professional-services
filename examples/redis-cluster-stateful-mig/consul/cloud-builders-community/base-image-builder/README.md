# base-image-builder

This build step creates a base image builder that uses a GCE instance similar to [remote buidler](https://github.com/GoogleCloudPlatform/cloud-builders-community/tree/master/remote-builder). The **base-image-builder** requires some specific licenses be added for nested virtualization. This builder makes use of [packer](https://github.com/GoogleCloudPlatform/cloud-builders-community/packer) to build an agent image that will be used by the resulting builder to build GCP base images. That agent also has [packer](https://www.packer.io/) installed.

The builder also adds the [packer builder](https://github.com/GoogleCloudPlatform/cloud-builders-community/packer) if it is not already part of the project's container registry. The resulting builder requires the following environmental settings: 

* BUILD_NUMBER - added to resulting base image name (available by default with [GCB](https://cloud.google.com/cloud-build/docs/configuring-builds/substitute-variable-values#using_default_substitutions))
* PROJECT_ID - used to store the image (available by default with [GCB](https://cloud.google.com/cloud-build/docs/configuring-builds/substitute-variable-values#using_default_substitutions))
* TAG_NAME - included in the name of the stored image (available with [GCB](https://cloud.google.com/cloud-build/docs/configuring-builds/substitute-variable-values#using_default_substitutions) when tags are pushed with git)
* IMAGE_ZONE where to build/upload the image (passed in as a [substitution with GCB](https://cloud.google.com/cloud-build/docs/configuring-builds/substitute-variable-values#using_user-defined_substitutions))
* PACKER_SPEC the path to the Packer specification in the workspace (passed in as a [substitution with GCB](https://cloud.google.com/cloud-build/docs/configuring-builds/substitute-variable-values#using_user-defined_substitutions))


## Setup the Cloud Build service account
```
PROJECT=$(gcloud config get-value project)
GCB_SA=$(gcloud projects get-iam-policy $PROJECT --filter="(bindings.role:roles/cloudbuild.builds.builder)"  --flatten="bindings[].members" --format="value(bindings.members[])")
gcloud projects add-iam-policy-binding $PROJECT \
  --member $GCB_SA --role roles/compute.instanceAdmin.v1
 gcloud projects add-iam-policy-binding $PROJECT \
  --member $GCB_SA --role roles/iam.serviceAccountUser
```

## Create the base-image-builder

Run this build step and it will:

1. Create a **packer** container image in your GCP Project GCR (later used as a build step)
2. Create a custom GCE image with nested virtualization enabled
3. Create a Packer Agent with **packer** installed and nested virtualization enabled
4. Create a **base-image-builder** container image in your GCP Project GCR

```
$ git clone https://github.com:GoogleCloudPlatform/cloud-builders-community
$ cd cloud-builders-community/base-image-builder
$ gcloud builds submit .
# or pass in custom substitutions
$ export ZONE=us-central1-c
$ gcloud builds submit . --substitutions "_IMAGE_ZONE=$ZONE,_BUILD_PACKER_AGENT_IMAGE=true,_BUILD_NESTED_VIRT_IMAGE=true"
```

## Create a storage bucket for uploading your custom images
```
gsutil mb gs://$PROJECT-custom-images 
```

## Use the base-image-builder to create a custom GCE image

After the builder is successfully built (with the above steps), you can use it to build custom images from an ISO:

```
$ git clone https://github.com/GoogleCloudPlatform/compute-custom-boot-images
$ cd compute-custom-boot-images
$ gcloud builds submit . --config cloudbuild/custom-boot-image-build.yaml
```

After the build is successful, you will have a custom GCE image available in your GCS Bucket
