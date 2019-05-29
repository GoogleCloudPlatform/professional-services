# GCS to GKE ConfigMaps

The example of this project is to demonstrate a mechanism whereby a user adds a text based file (e.g. YAML) to a GCS bucket, and the contents of this file are placed in a K8s ConfigMap in GKE.  Similarly, if a user deletes a file from a GCS bucket, the relevant ConfigMaps are updated accordingly.

This is done by configuring a Google Cloud Function (GCF) to listen to an OBJECT_FINALIZE or OBJECT_DELETE event from a GCS bucket.  The function determines which file in the bucket was updated/created, and obtains the content.  If the file was deleted, it is not necessary to obtain the content.  To be clear, the GCF can only listen for either OBJECT_FINALIZE or OBJECT_DELETE events.  This means that if both events should be monitored, then the function will have to be deployed twice; one listenting for OBJECT_FINALIZE and the other OBJECT_DELETE.

Next, the GCF determines which ConfigMaps to update and patches those ConfigMaps with the new content.  If these ConfigMaps are mounted to any K8s Deployments, those pods will be restarted.

## Prerequisites

1. A project in GCP with billing enabled.
2. Set environment variables
3. An authenticated *gcloud* CLI.
4. The following project service API's enabled: Cloud Functions, Kubernetes Engine, Stackdriver Logging, Compute Engine.
5. A IAM service account with permissions to read an object in GCS, and write to logs.
6. An existing GKE cluster.

If you are performing the **Quick Start** then having the **gsutil** CLI is helpful.

### Authenticating the *gcloud* CLI

Authenticate the *gcloud* CLI, for example:

```shell
gcloud auth login
```

### Export Necessary Environment Variables

```shell
export PROJECT_ID={ID_OF_PROJECT}
export GKE_CLUSTER_NAME={NAME_OF_GKE_CUSTER}
export LOCATION={REGION_OR_ZONE_OF_GKE_CLUSTER}
export SERVICE_ACCOUNT_NAME={DESIRED_NAME_OF_IAM_SERVICE_ACCOUNT}
export SERVICE_ACCOUNT_EMAIL=$SERVICE_ACCOUNT_NAME@$PROJECT_ID.iam.gserviceaccount.com
export GCS_BUCKET={THE_GCS_BUCKET_TO_WATCH_FOR_EVENTS}
export OBJECT_TO_WATCH={THE_FULL_OR_PARTIAL_PATH_TO_OBECT(S)_TO_WATCH}
```

### Enabling the Necessary API's

Run the following commands to enable the appropriate API's

```shell
gcloud services enable logging.googleapis.com \
                       cloudfunctions.googleapis.com \
                       compute.googleapis.com \
                       container.googleapis.com \
                       storage-api.googleapis.com
```

### Creating the IAM Service Account

```shell
gcloud iam service-accounts create $SERVICE_ACCOUNT_NAME
```

For this purpose, most of the default IAM roles maybe too permissive.  Create a custom role, with limited permissions.

```shell
gcloud iam roles create gcsToGke \
     --project $PROJECT_ID \
     --permissions=container.clusters.get,container.configMaps.create,container.configMaps.delete,container.configMaps.get,container.configMaps.list,container.configMaps.update,container.deployments.get,container.deployments.list,container.pods.get,container.pods.delete,container.pods.list,container.pods.update,storage.buckets.get,storage.objects.get,logging.logEntries.create
```

Assign this role to the IAM service account.

```shell
gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member serviceAccount:$SERVICE_ACCOUNT_EMAIL \
  --role projects/$PROJECT_ID/roles/gcsToGke
```

## Quick Start

Assuming that the above prerequisites are satisfied, it's time to deploy the Google Cloud Function.  To deploy the "create" function from a local folder (e.g. this repo has been cloned), execute the following.

```shell
gcloud functions deploy gcs-to-gke-configmaps-create \
     --trigger-resource $GCS_BUCKET \
     --trigger-event google.storage.object.finalize \
     --runtime python37 \
     --entry-point gcs_trigger \
     --region $LOCATION \
     --service-account $SERVICE_ACCOUNT_EMAIL \
     --set-env-vars="CLUSTER_LOCATION=$LOCATION","CLUSTER_NAME=$GKE_CLUSTER_NAME","OBJECT_TO_WATCH=${_OBJECT_TO_WATCH"
```

## Add the Example Kubernetes ConfigMap and Deployment

Edit the following files and update the **gcs_bucket** and **gcs_object** labels to match your $GCS_BUCKET and $GCS_OBJECT respectively.

1. [examples/k8s/configmap-example-empty.yaml](examples/k8s/configmap-example-empty.yaml)
2. [examples/k8s/deployment-with-labels.yaml](examples/k8s/deployment-with-labels.yaml)

Next, add these to Kubernetes

```shell
kubectl apply -f examples/k8s/configmap-example-empty.yaml
kubectl apply -f examples/k8s/deployment-with-labels.yaml
```

## Observe ConfigMap Updates

Determine the name of the Pod from the Deployment in the previous step.

```shell
NGINX_POD=$(kubectl get pod | grep nginx-deployment | cut -d" " -f1)
```

Execute the following to list the contents of the /tmp/config directory in the Pod where the ConfigMap is mounted.  You should see the **data-example-2.yaml** file.

```shell
kubectl exec $NGINX_POD ls /tmp/config
```

Copy the [examples/gcs/data-example-apple.yaml](examples/gcs/data-example-apple.yaml) to the bucket and at the $OBJECT_TO_WATCH in question.  This can be done in the Cloud Console or using the *gsutil* CLI as follows:

```shell
gsutil cp examples/gcs/data-example-apple.yaml gs://$BUCKET/$OBJECT_TO_WATCH
```

Because the Pod was deleted, we need to get the new Pod name.

```shell
NGINX_POD=$(kubectl get pod | grep nginx-deployment | cut -d" " -f1)
```

Now take a look at the contents of the /tmp/config directory in the Pod.  You should see both the **data-example-2.yaml** and **data-example-apple.yaml**.  

```shell
kubectl exec $NGINX_POD ls /tmp/config
```

Next, delete the **data-example-2.yaml** file from the GCS Bucket.

```shell
gsutil rm gs://$BUCKET/$OBJECT_TO_WATCH/data-example-apple.yaml
```

Once again, because the Pod was deleted, we need to get the new Pod name.

```shell
NGINX_POD=$(kubectl get pod | grep nginx-deployment | cut -d" " -f1)
```

Now take a look at the contents of the /tmp/config directory in the Pod.  You should see only the **data-example-2.yaml** as the data-example-apple.yaml file has been rmoved from the ConfigMap.

```shell
kubectl exec $NGINX_POD ls /tmp/config
```

## Design

### Basic Operation

![Activity diagram](./images/gcs-to-gke-activity.png)

### Authentication

When the function is invoked, the first step is to obtain the IAM Service Account credentials.  By refresing the credentials, the google.auth.credentials.Credentials.**token** attribute is populated.

```python
import google.auth
import google.auth.transport.requests

def get_credentials():
    credentials, _ = google.auth.default()
    request = google.auth.transport.requests.Request()
    credentials.refresh(request)
    return credentials

def get_token():
    return get_credentials().token
```

The returned credentials provides access to the necessary GCP services: GCS and GKE.  The token inside the credentials, provides access to the Kubernetes API.  To interact with the Kubernetes API, we use the [Kubernetes Python Client](https://github.com/kubernetes-client/python).  The token is then provided to the Kubernetes configuration object.

```python
def get_k8s_client_configuration(ca_cert_fp, endpoint, token):
     ...
    configuration = kubernetes.client.Configuration()
    configuration.api_key['authorization'] = token
    configuration.api_key_prefix['authorization'] = 'Bearer'
    ...
    return configuration
```

### Mapping to ConfigMaps

Determining which Kubernetes ConfigMaps to update is done through the use of labels.  Here, two labels are employed: gcs_bucket and gcs_object.  For example:

```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  labels:
    gcs_bucket: "test-bucket"
    gcs_object: "file.yaml"
data: {}
```

The **gcs_bucket** label must match, in its entirety, the name of the bucket being watched by the GCF.  The **gcs_object** can either be a folder path or a full path to a file in the bucket.

| Full Object Path             | Label gcs_bucket | Label gcs_file | Match? |
|------------------------------|------------------|----------------|--------|
| gs://mybucket/dir1/test.yaml | mybucket         | dir1/test.yaml | yes    |
| gs://mybucket/dir1/test.yaml | mybucket         | dir1           | yes    |
| gs://mybucket/dir1/test.yaml | mybucket         | di             | yes    |
| gs://mybucket/dir1/test.yaml | mybucket         | dir2           | no     |
| gs://mybucket/dir1/test.yaml | mybucket         | test.yaml      | no     |
| gs://mybucket/dir1/test.yaml | notmybucket      | dir1/test.yaml | no     |

### Getting the Pod to Read the ConfigMap

Depending on the application running in a pod, the application may need to be restarted.  This is accomplished by deleting the the pod and allowing the controller (Replicas, Deployment, etc.) to replace the pod.  This step is optional and dependent on whether the workload actually needs to be restarted to read new configurations.  In order to indicate that a pod needs to be restarted, apply the same labels as you would in a ConfigMap:

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  ...
spec:
  template:
    metadata:
      labels:
        gcs_bucket: "test-bucket"
        gcs_object: "file.yaml"
    spec:
      containers:
        ...
```

## TODO

1. ~~Determine the Deployments/Pods where the updated ConfigMaps are used~~
2. ~~Restart the pod (e.g. delete the container)~~
3. ~~Handle deletions from GCS~~
4. Write unit-tests