# Cloud Build Remote Build Step

## Introduction

![Architecture Diagram](docs/arch.png)

Some continuous integration workloads require special builder types. You may
require things like:

1. High CPU/Memory machines
1. Custom image
1. GPUs attached
1. Fast or large disks
1. Machines in a particular network
1. Pre-emptibility

In these cases you can leverage Container Builder to trigger your builds and
manage their workflow but run the actual build steps on an instance with
exactly the configuration you need.

## How?

When using the remote-builder image, the following will happen:

1. A temporary SSH key will be created in your Container Builder workspace
1. A instance will be launched with your configured flags
1. The workpace will be copied to the remote instance
1. Your command will be run inside that instance's workspace
1. The workspace will be copied back to your Container Builder workspace

## Usage

In order to use this step, first build the builder:

```
gcloud builds submit --config=cloudbuild.yaml .
```

Then, create an appropriate IAM role with permissions to create and destroy
Compute Engine instances in this project:

```
export PROJECT=$(gcloud info --format='value(config.project)')
export PROJECT_NUMBER=$(gcloud projects describe $PROJECT --format 'value(projectNumber)')
export CB_SA_EMAIL=$PROJECT_NUMBER@cloudbuild.gserviceaccount.com
gcloud services enable cloudbuild.googleapis.com
gcloud services enable compute.googleapis.com
gcloud projects add-iam-policy-binding $PROJECT --member=serviceAccount:$CB_SA_EMAIL --role='roles/iam.serviceAccountUser' --role='roles/compute.instanceAdmin.v1' --role='roles/iam.serviceAccountActor'
```

Then, configure your build step as follows:

```
steps:
- name: gcr.io/$PROJECT_ID/remote-builder
  env:
    - COMMAND=ls -la
```

This will launch an instance with the default parameters and then run the
command `ls -la` inside the instance's workspace.

## Configuration

The following options are configurable via environment variables passed to the
build step in the `env` parameter:

| Options       | Description   | Default |
| ------------- | ------------- | ------- |
| GCLOUD | The expression to use as the `gcloud` command-line utility. Can be set to `gcloud alpha` or `gcloud beta`, as examples. | `gcloud` |
| COMMAND | Command to run inside the remote workspace | None, must be set |
| USERNAME  | Username to use when logging into the instance via SSH  | `admin` |
| REMOTE_WORKSPACE  | Location on remote host to use as workspace | `/home/${USERNAME}/workspace/` |
| INSTANCE_NAME  | Name of the instance that is launched  | `builder-$UUID` |
| ZONE  | Compute zone to launch the instance in | `us-central1-f` |
| INSTANCE_ARGS| Parameters to the instance creation command. For a full list run `gcloud compute instances create --help` | `--preemptible` |
| SSH_ARGS| Parameters to the ssh and scp commands. This can be useful to run ssh though a IAP tunnel with ```--tunnel-though-iap``` | None |
| RETRIES| The number of retries to wait for the instance to start accepting SSH connections | `10` |

To give it a try, see the [examples directory](https://github.com/GoogleCloudPlatform/cloud-builders-community/tree/master/remote-builder/examples).

This is not an official Google product.

## Trade-offs

1. Paying for builder + VM
2. Spin up time of VM increases build time

