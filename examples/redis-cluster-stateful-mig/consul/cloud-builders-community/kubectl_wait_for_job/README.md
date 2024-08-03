# [`kubectl_wait_for_job`](https://kubernetes.io/docs/user-guide/kubectl-overview) tool builder

If you're looking to run a job but actually block execution until that job is complete on the cluster, this wraps the kubectl command to do that. For instance if you need run database migrations prior to deploying the code that utilizes them, you can use this command to execute a job, wait for it to complete, and then update your deployment with the image that utilizes those migrations.  

## Using this builder with Google Kubernetes Engine

To use this builder, your
[builder service account](https://cloud.google.com/cloud-build/docs/how-to/service-account-permissions)
will need IAM permissions sufficient for the operations you want to perform. For
typical read-only usage, the "Kubernetes Engine Viewer" role is sufficient. To
deploy container images on a GKE cluster, the "Kubernetes Engine Developer" role
is sufficient. Check the
[GKE IAM page](https://cloud.google.com/container-engine/docs/iam-integration)
for details.

Running the following command will give Cloud Build Service Account
`container.developer` role access to your Container Engine clusters:

```sh
PROJECT="$(gcloud projects describe \
    $(gcloud config get-value core/project -q) --format='get(projectNumber)')"

gcloud projects add-iam-policy-binding $PROJECT \
    --member=serviceAccount:$PROJECT@cloudbuild.gserviceaccount.com \
    --role=roles/container.developer
```

For most use, kubectl will need to be configured to point to a specific GKE
cluster. You can configure the cluster by setting environment variables.

    CLOUDSDK_COMPUTE_ZONE=<your cluster's zone>
    CLOUDSDK_CONTAINER_CLUSTER=<your cluster's name>


If your GKE cluster is in a different project than Cloud Build, also set:

```CLOUDSDK_CORE_PROJECT=<the GKE cluster project>```

Make sure you also grant the Cloud Build service account permissions in the GKE cluster project.

Setting the environment variables above will cause this step's entrypoint to
first run a command to fetch cluster credentials as follows.

    gcloud container clusters get-credentials --zone "$CLOUDSDK_COMPUTE_ZONE" "$CLOUDSDK_CONTAINER_CLUSTER"`

Then, `kubectl_wait_for_job` will have the configuration needed to talk to your GKE cluster.

## Building this builder

To build this builder, run the following command in this directory.

    $ gcloud builds submit . --config=cloudbuild.yaml
