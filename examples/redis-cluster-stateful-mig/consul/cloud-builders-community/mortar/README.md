# [Mortar](https://github.com/kontena/mortar)

## Using this builder with Google Container Engine

To use this builder, your
[builder service account](https://cloud.google.com/cloud-build/docs/how-to/service-account-permissions)
will need IAM permissions sufficient for the operations you want to perform. For
typical read-only usage, the "Kubernetes Engine Viewer" role is sufficient. To
deploy container images on a GKE cluster, the "Kubernetes Engine Developer" role
is sufficient. Check the
[GKE IAM page](https://cloud.google.com/container-engine/docs/iam-integration)
for details.

For most use, kubectl will need to be configured to point to a specific GKE
cluster. You can configure the cluster by setting environment variables.

    # Set region for regional GKE clusters or Zone for Zonal clusters
    CLOUDSDK_COMPUTE_REGION=<your cluster's region>
    or
    CLOUDSDK_COMPUTE_ZONE=<your cluster's zone>

    # Name of GKE cluster
    CLOUDSDK_CONTAINER_CLUSTER=<your cluster's name>

    # (Optional) Project of GKE Cluster, only if you want kustomize to authenticate
    # to a GKE cluster in another project (requires IAM Service Accounts are properly setup)
    GCLOUD_PROJECT=<destination cluster's GCP project>

Setting the environment variables above will cause this step's entrypoint to
first run a command to fetch cluster credentials as follows.

    gcloud container clusters get-credentials --zone "$CLOUDSDK_COMPUTE_ZONE" "$CLOUDSDK_CONTAINER_CLUSTER"`

Then, `kubectl` and consequently `kustomize` will have the configuration needed to talk to your GKE cluster.

## Firing the shot

The default entrypoint will automatically apply your build via `kubectl apply -f -` if you set the env `APPLY=true`. Thus, you can run:

```yaml
- id: deploy
  name: 'gcr.io/$PROJECT_ID/mortar'
  args:
  - 'fire'
  - 'deployment.yaml'
  - 'myshot'
  env:
    - 'CLOUDSDK_COMPUTE_ZONE=us-west1'
    - 'CLOUDSDK_CONTAINER_CLUSTER=tf-k8s'
    - 'GCLOUD_PROJECT=compound-dev'
```

## Building this builder

To build this builder, run the following command in this directory.

    $ gcloud builds submit . --config=cloudbuild.yaml
