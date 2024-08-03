# [Helm](https://docs.helm.sh/) tool builder

## Using this builder with Google Container Engine

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

Then, `kubectl` and consequently `helm` will have the configuration needed to talk to your GKE cluster.

## Building this builder

To build this builder, run the following command in this directory.

    gcloud builds submit . --config=cloudbuild.yaml

You can also build this builder setting `Helm` version via in `cloudbuild.yaml`, no need to do that in `Dockerfile` anymore.

    args: ['build', '--tag=gcr.io/$PROJECT_ID/helm', '--build-arg', 'HELM_VERSION=v3.12.0', '.']

## Using Helm

### Helm v3

Helm v2 (with or without Tiller) is no longer supported.

You can test e.g. installing a chart via `Helm`, running the following command.

    gcloud builds submit . --config=examples/chart-install/cloudbuild.yaml

And to list Helm releases.

    $ gcloud builds submit . --config=examples/releases-list/cloudbuild.yaml

## RBAC Considerations

**Note:** If your GKE cluster has `RBAC` enabled, you must grant Cloud Build Service Account the `cluster-admin` role (or make it more specific for your use case)

    $ export PROJECT_ID="$(gcloud projects describe $(gcloud config get-value core/project -q) --format='get(projectNumber)')"
    $ export SERVICE_ACCOUNT="${PROJECT_ID}@cloudbuild.gserviceaccount.com"

    # Add IAM policy for cloudbuild cluster administration
    $ gcloud projects add-iam-policy-binding ${PROJECT_ID} \
      --member=serviceAccount:${SERVICE_ACCOUNT} \
      --role=roles/container.admin

    # and add a clusterrolebinding
    $ kubectl create clusterrolebinding cluster-admin-${SERVICE_ACCOUNT} \
      --clusterrole cluster-admin --user ${SERVICE_ACCOUNT}

## Configuration

The following options are configurable via environment variables passed to the build step in the `env` parameter:

| Option        | Description   |
| ------------- | ------------- |
| DIFF_PLUGIN_VERSION | [Diff plugin](https://github.com/databus23/helm-diff) version to install, optional |
| GCS_PLUGIN_VERSION | [GCS plugin](https://github.com/nouney/helm-gcs) version to install, optional |
| HELM_REPO_NAME | External Helm repository name, optional |
| HELM_REPO_URL | External Helm repo URL, optional |
| HELMFILE_VERSION | [Helmfile](https://github.com/roboll/helmfile) version to install, optional (if using helm v3, please use the helmfile builder)
| SKIP_CLUSTER_CONFIG | If true, doesn't check or fetch GKE cluster config/creds, optional |
