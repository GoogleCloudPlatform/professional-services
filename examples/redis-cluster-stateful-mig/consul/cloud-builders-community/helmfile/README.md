# [Helmfile](https://github.com/roboll/helmfile) builder

## Helm version

At this time this builder is only compatible with helm v3. Backwards functionality with helm v2 can be added in a subsequent PR if desired.

## Using this builder with Google Kubernetes Engine

To use this builder, your
[Cloud Build Service Account](https://cloud.google.com/cloud-build/docs/securing-builds/set-service-account-permissions)
will need IAM permissions sufficient for the operations you want to perform. For
typical read-only usage, the "Kubernetes Engine Viewer" role is sufficient. To
deploy container images on a GKE cluster, the "Kubernetes Engine Developer" role
is sufficient. Check the
[GKE IAM page](https://cloud.google.com/kubernetes-engine/docs/concepts/access-control)
for details.

For most use, kubectl will need to be configured to point to a specific GKE
cluster. You can configure the cluster by setting environment variables.

    # Set region for regional GKE clusters or Zone for Zonal clusters
    CLOUDSDK_COMPUTE_REGION=<your cluster's region>
    or
    CLOUDSDK_COMPUTE_ZONE=<your cluster's zone>

    # Name of GKE cluster
    CLOUDSDK_CONTAINER_CLUSTER=<your cluster's name>

    # (Optional) Project of GKE Cluster, only if you want helm to authenticate
    # to a GKE cluster in another project (requires IAM Service Accounts are properly setup)
    GCLOUD_PROJECT=<destination cluster's GCP project>

Setting the environment variables above will cause this step's `entrypoint` to
first run a command to fetch cluster credentials as follows.

    gcloud container clusters get-credentials --zone "$CLOUDSDK_COMPUTE_ZONE" "$CLOUDSDK_CONTAINER_CLUSTER"`

Then, `kubectl` and consequently `helm` and `helmfile` will have the configuration needed to talk to your GKE cluster.

## Building this builder

To build this builder, run the following command in this directory.

    gcloud builds submit . --config=cloudbuild.yaml

You can set the `Helm` and `Helmfile` versions in `cloudbuild.yaml`.

    args: [
        'build',
        '--tag=gcr.io/$PROJECT_ID/helm',
        '--build-arg', 'HELM_VERSION=v3.6.3',
        '--build-arg', 'HELMFILE_VERSION=v0.140.0',
        '.'
    ]

## Using Helmfile

Check the [examples](examples) folder for examples of using Helm in `Cloud Build` pipelines.

## Configuration

The following options are configurable via environment variables passed to the build step in the `env` parameter:

| Option        | Description   |
| ------------- | ------------- |
| GCS_PLUGIN_VERSION | [GCS plugin](https://github.com/nouney/helm-gcs) version to install, optional |
