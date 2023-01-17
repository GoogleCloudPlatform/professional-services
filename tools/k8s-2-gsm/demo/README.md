# End to end demo

Clone this repo and set/update the environment variables in `.env` and export:

```shell
source .env
```

## Create GKE cluster

A GKE cluster with [Workload Identity enabled](https://cloud.google.com/kubernetes-engine/docs/how-to/workload-identity).

```shell
hack/deploy-gke-wi-cluster.sh
```

(code review/source: [hack/deploy-gke-wi-cluster.sh](../hack/deploy-gke-wi-cluster.sh))

## Cluster setup using k8s secrets

First we need something running to migrate. Setup a namespace with a deployment that uses secrets.

### Create namespace & context

```
kubectl create namespace ${NAMESPACE}

kubectl config set-context --current --namespace=${NAMESPACE}
```

### Create secret

```shell
kubectl create secret generic literal-token --from-literal user=admin --from-literal password=1234
```

### Create deployment

```shell
kubectl apply -f /demo/example-app/busybox-pod-w-k8s-secret.yaml
```

Validate the deployment / secrets exist:

```
# exec into the pod
kubectl exec -it secret-demo -- sh

# list the secrets
ls -lh /etc/secrets
```

Output looks like:

```
ls -lah /etc/secrets
total 0      
lrwxrwxrwx    1 root     root          15 Nov  8 15:42 password -> ..data/password
lrwxrwxrwx    1 root     root          11 Nov  8 15:42 user -> ..data/user
```

Lastly, check the file contents:

```
# should return "admin"
cat /etc/secrets/user
```

## Migrate the secrets

High-level steps:
- Create a (GCP) service account in Google
- Bind `roles/secretmanager.admin` IAM to the GCP service account for secret creation
- Bind `roles/iam.workloadIdentityUser` to the service account
- Create a Kubernetes service account and association with the GCP service account
- Run the containerized script / job

### Setup GCP

Create a (GCP) service account in Google

```
gcloud iam service-accounts create ${GCP_SERVICEACCOUNT} --project=${GCP_PROJECT}
```

Bind `roles/iam.workloadIdentityUser` IAM to a Kubernetes service account (and namespace)

```
gcloud iam service-accounts add-iam-policy-binding ${GCP_SERVICEACCOUNT}@${GCP_PROJECT}.iam.gserviceaccount.com \
--role roles/iam.workloadIdentityUser \
--member "serviceAccount:${GCP_PROJECT}.svc.id.goog[${K8S_NAMESPACE}/${K8S_SERVICEACCOUNT}]"
```

Bind `roles/secretmanager.admin` IAM to the GCP service account for secret creation

```
gcloud projects add-iam-policy-binding ${GCP_PROJECT} \
--member "serviceAccount:${GCP_SERVICEACCOUNT}@${GCP_PROJECT}.iam.gserviceaccount.com" \
--role "roles/secretmanager.admin"
```

At this point, GCP permissions are set and now we need to configure Kubernetes to "link" the service accounts for Workload Identity

### Setup Kubernetes

Create a Kubernetes service account and association with the GCP service account

```
# create k8s service account
kubectl -n ${K8S_NAMESPACE} create serviceaccount ${K8S_SERVICEACCOUNT}

# annotate GKE's service account to link to the GCP identity
kubectl annotate serviceaccount ${K8S_SERVICEACCOUNT} \
--namespace ${K8S_NAMESPACE} \
iam.gke.io/gcp-service-account=${GCP_SERVICEACCOUNT}@${GCP_PROJECT}.iam.gserviceaccount.com
```

Grant the service account the ability to read secrets in the namespace

```
# create a reusable cluster role allowing to read secrets
kubectl create clusterrole secret-reader --verb=get,list,watch --resource=secrets

# bind the cluster role to our Workload Identity service account
kubectl -n ${K8S_NAMESPACE} create rolebinding read-secrets-${K8S_NAMESPACE} --clusterrole=secret-reader --serviceaccount=${K8S_NAMESPACE}:${K8S_SERVICEACCOUNT}
```

Validate access:

```
kubectl auth can-i get secrets --namespace ${NAMESPACE} --as system:serviceaccount:${NAMESPACE}:${K8S_SERVICEACCOUNT}

# yes
```

### Run the migration container

```
cat <<EOF | kubectl apply -f -
apiVersion: batch/v1
kind: Job
metadata:
  name: migrate-secrets
spec:
  backoffLimit: 0  # run once
  template:
    spec:
      containers:
      - image: REPO/K8S2GSM:TAG  # <------ replace me
        name: migrate-secrets
        args:
        - --project=${GCP_PROJECT}
        - --namespace=${K8S_NAMESPACE}
      restartPolicy: Never
      serviceAccountName: ${K8S_SERVICEACCOUNT}
EOF
```

Watch logs:

```
kubectl logs -f job/migrate-secrets
```

### Install [Secret Store CSI Driver](https://secrets-store-csi-driver.sigs.k8s.io/getting-started/installation.html)

I'm following the [yaml instructions](https://secrets-store-csi-driver.sigs.k8s.io/getting-started/installation.html#alternatively-deployment-using-yamls) to avoid installing Helm.

```
kubectl create -f demo/csi/ --recursive
```

(code review/source files: [demo/csi/](../demo/csi/))

Ensure it's running:

```
kubectl get po --namespace=kube-system
kubectl get crd
```

### Install [Google Secret Manager Provider](https://github.com/GoogleCloudPlatform/secrets-store-csi-driver-provider-gcp) for Secret Store CSI Driver

```
kubectl create -f demo/google-secret-provider/provider-gcp-plugin.yaml
```

(code review/source: [demo/google-secret-provider/provider-gcp-plugin.yaml](../demo/google-secret-provider/provider-gcp-plugin.yaml))

### Setup an application service account (in GCP & k8s) for using Google secrets

```
gcloud iam service-accounts create ${GCP_WORKLOAD_SA}
```

Allow `${K8S_SERVICEACCOUNT}` in `${K8S_NAMESPACE}` to act as the new GCP service account

```
export K8S_SERVICEACCOUNT=workload-1

gcloud iam service-accounts add-iam-policy-binding ${GCP_SERVICEACCOUNT}@${GCP_PROJECT}.iam.gserviceaccount.com \
--role roles/iam.workloadIdentityUser \
--member "serviceAccount:${GCP_PROJECT}.svc.id.goog[${K8S_NAMESPACE}/${K8S_SERVICEACCOUNT}]"
```

On Kubernetes, create SA add annotation:

```
# create k8s service account
kubectl -n ${K8S_NAMESPACE} create serviceaccount ${K8S_SERVICEACCOUNT}

# annotate GKE's service account to link to the GCP identity
kubectl annotate serviceaccount ${K8S_SERVICEACCOUNT} \
--namespace ${K8S_NAMESPACE} \
iam.gke.io/gcp-service-account=${GCP_SERVICEACCOUNT}@${GCP_PROJECT}.iam.gserviceaccount.com
```

Grant the new GCP service account permission to access the secret(s)

> ["literal-token-user","literal-token-password"]

```
gcloud secrets add-iam-policy-binding literal-token-user \
--member=serviceAccount:${GCP_SERVICEACCOUNT}@${GCP_PROJECT}.iam.gserviceaccount.com \
--role=roles/secretmanager.secretAccessor

gcloud secrets add-iam-policy-binding literal-token-password \
--member=serviceAccount:${GCP_SERVICEACCOUNT}@${GCP_PROJECT}.iam.gserviceaccount.com \
--role=roles/secretmanager.secretAccessor
```

### Test the new deployments


```
# literal-token-user
# literal-token-password
```

Create the SecretProviderClass

```
cat <<EOF | kubectl apply -f -
apiVersion: secrets-store.csi.x-k8s.io/v1
kind: SecretProviderClass
metadata:
  name: workload-1-secrets
spec:
  provider: gcp
  parameters:
    secrets: |
      - resourceName: "projects/${GCP_PROJECT}/secrets/literal-token-user/versions/latest"
        path: "user"
      - resourceName: "projects/${GCP_PROJECT}/secrets/literal-token-password/versions/latest"
        path: "password"
EOF
```

Create deployments

```
export K8S_SERVICEACCOUNT=${K8S_SERVICEACCOUNT}
envsubst < deployment.yaml | kubectl apply -f -
```

Validate the deployment / secrets exist:

```
# exec into the pod
kubectl exec -it secret-demo-2 -- sh

# list the secrets
ls -lh /etc/secrets
```

Output looks like:

```
ls -lah /etc/secrets
total 0      
lrwxrwxrwx    1 root     root          15 Nov  8 17:19 password -> ..data/password
lrwxrwxrwx    1 root     root          11 Nov  8 17:19 user -> ..data/user
```

Lastly, check the file contents:

```
# should return "admin"
cat /etc/secrets/user
```

### Demo clean up

```
hack/clean-up.sh
```
