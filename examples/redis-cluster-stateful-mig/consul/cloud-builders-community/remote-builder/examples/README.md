# Remote Builder Example

## Quick Start

In this simple example, you will run a script inside of containers on two instances in
parallel. You will use the Container Optimized OS image to provide an image with Docker
pre-installed. The build request runs the `test/no-op.sh` script from this directory.

Follow instructions at [Usage](https://github.com/GoogleCloudPlatform/cloud-builders-community/tree/master/remote-builder#usage) to build the builder first.

To run, execute this command:

```shell
gcloud builds submit --config cloudbuild.yaml .
```

You should now see 2 instances being provisioned in parallel then the `test/no-op.sh` being
run inside containers based on the `ubuntu:16.04` Docker image.

Further examples are available in the `test-configs` directory.

