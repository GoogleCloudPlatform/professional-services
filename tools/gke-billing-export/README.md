# gke-billing-export

Google Kubernetes Engine fine grained billing export. This consists of a single binary that can be run in a Google Cloud project, which with appropriate permissions can scrape the metrics server for many Kubernetes Engine clusters. The metrics are stored in a dedicated BigQuery dataset.

The executable takes no arguments, it reads project ids and the polling interval from config.json and runs continuously as a daemon.

This repository provides a docker file for creating an image with the executable baked in, as well as a Kubenetes deployment configuration to run the job on a GKE cluster.

Once deployed, the billing export daemon will periodically poll both the K8s API and the Metrics API, saving results to BigQuery.

This is not an officially supported Google product.

# Example Output

Here is an example of querying data that has been exported by this tool into BigQuery.

```
$ bq query 'SELECT * FROM gke_billing.billing LIMIT 10'
Waiting on bqjob_r3e0b632863ac23dc_0000016555efd3fa_1 ... (0s) Current status: DONE
+---------------------+---------------------------+------------------+-------------+----------------------+------------------------------------------------------------+--------------+--------------+----------+-----------+
|      timestamp      |          project          |     cluster      |  namespace  |    serviceaccount    |                            pod                             | reserved_cpu | reserved_ram | used_cpu | used_ram  |
+---------------------+---------------------------+------------------+-------------+----------------------+------------------------------------------------------------+--------------+--------------+----------+-----------+
| 2018-08-20 06:01:02 | gke-billing-export-213323 | regional-cluster | kube-system | fluentd-gcp          | fluentd-gcp-v3.1.0-lvm24                                   |            0 |            0 |        4 | 140042240 |
| 2018-08-20 04:58:50 | gke-billing-export-213323 | cluster-4        | kube-system | kubernetes-dashboard | kubernetes-dashboard-598d75cb96-ppvkj                      |           50 |    104857600 |        0 |  13729792 |
| 2018-08-20 06:02:02 | gke-billing-export-213323 | cluster-4        | kube-system | fluentd-gcp-scaler   | fluentd-gcp-scaler-7c5db745fc-cx5hp                        |            0 |            0 |       12 |   2293760 |
| 2018-08-20 04:59:52 | gke-billing-export-213323 | cluster-3        | kube-system | event-exporter-sa    | event-exporter-v0.1.9-5c8fb98cdb-vcwk6                     |            0 |            0 |        0 |  17580032 |
| 2018-08-20 05:58:02 | gke-billing-export-213323 | cluster-3        | kube-system |                      | kube-proxy-gke-cluster-3-default-pool-69c7db15-k109        |          100 |            0 |        1 |  12603392 |
| 2018-08-20 04:58:52 | gke-billing-export-213323 | cluster-3        | kube-system | heapster             | heapster-v1.5.2-55779c45bc-6298g                           |          138 |    309100544 |        0 |  42246144 |
| 2018-08-20 05:58:02 | gke-billing-export-213323 | cluster-3        | kube-system | default              | l7-default-backend-57856c5f55-ckbnn                        |           10 |     20971520 |        0 |   1449984 |
| 2018-08-20 06:02:02 | gke-billing-export-213323 | regional-cluster | kube-system |                      | kube-proxy-gke-regional-cluster-default-pool-10ec0d87-gjdz |          100 |            0 |        1 |  15073280 |
| 2018-08-20 05:56:02 | gke-billing-export-213323 | cluster-4        | kube-system | event-exporter-sa    | event-exporter-v0.2.1-5f5b89fcc8-vrz22                     |            0 |            0 |        0 |  21147648 |
| 2018-08-20 04:59:51 | gke-billing-export-213323 | cluster-4        | kube-system | fluentd-gcp          | fluentd-gcp-v3.1.0-vzp89                                   |            0 |            0 |        4 | 128950272 |
+---------------------+---------------------------+------------------+-------------+----------------------+------------------------------------------------------------+--------------+--------------+----------+-----------+

$ bq query 'SELECT project, cluster, namespace, SUM(reserved_ram) AS reserved_ram, SUM(reserved_cpu) AS reserved_cpu
            FROM gke_billing.billing
            GROUP BY project, cluster, namespace
            HAVING namespace != "kube-system"
            ORDER BY reserved_ram desc'
Waiting on bqjob_r9b4447e01a43528_00000165561be752_1 ... (0s) Current status: DONE
+------------------------------+------------------+-------------+--------------+--------------+
|           project            |     cluster      |  namespace  | reserved_ram | reserved_cpu |
+------------------------------+------------------+-------------+--------------+--------------+
| gke-billing-export-213323    | regional-cluster | default     |   6186598400 |        11800 |
| web-application-service-demo | cluster-1        | webapp-prod |   1258291200 |         2400 |
| web-application-service-demo | cluster-1        | webapp-test |    209715200 |          400 |
| web-application-service-demo | cluster-1        | vault       |    209715200 |          400 |
+------------------------------+------------------+-------------+--------------+--------------+
```

# Installation

This job is available on the public docker hub at `dparrish/gke-billing-export:1.0.1`, but the following instructions
include building a local version.

## Download

In Cloud Shell for the monitoring project, enable the required APIs:

```shell
$ gcloud services enable \
  bigquery-json.googleapis.com \
  cloudbuild.googleapis.com \
  compute.googleapis.com \
  container.googleapis.com \
  containerregistry.googleapis.com \
  storage-api.googleapis.com \
  storage-component.googleapis.com

$ git clone https://github.com/dparrish/gke-billing-export.git
$ cd gke-billing-export
```

## Build a docker image for the export binary.

```shell
$ docker build -t gcr.io/$GOOGLE_CLOUD_PROJECT/billing_export .
$ docker push gcr.io/$GOOGLE_CLOUD_PROJECT/billing_export
```

## Update configuration file

```shell
$ sed -i.bak "s/GOOGLE_CLOUD_PROJECT/$GOOGLE_CLOUD_PROJECT/g" *.json *.yaml
```

Add additional projects to the `config.json` file now.


## Deploy the binary to an existing Kubernetes cluster.

```shell
$ kubectl create configmap billing-export-config --from-file=config.json
$ gcloud iam service-accounts create gke-billing-export
$ gcloud iam service-accounts keys create key.json \
  --iam-account=gke-billing-export@$GOOGLE_CLOUD_PROJECT.iam.gserviceaccount.com
$ gcloud projects add-iam-policy-binding $GOOGLE_CLOUD_PROJECT \
  --member serviceAccount:gke-billing-export@$GOOGLE_CLOUD_PROJECT.iam.gserviceaccount.com \
  --role roles/container.viewer

# Either grant permission to the new user to create BigQuery datasets, or create the datasets manually:
$ gcloud projects add-iam-policy-binding $GOOGLE_CLOUD_PROJECT \
  --member serviceAccount:gke-billing-export@$GOOGLE_CLOUD_PROJECT.iam.gserviceaccount.com \
  --role roles/bigquery.dataOwner

$ kubectl create secret generic billing-export-credentials --from-file=key.json
$ shred key.json
$ kubectl deploy -f deploy.yaml

$ kubectl get pod
$ kubectl logs -f billing-export-67567849c8-s4btv
```

## Grant permission to other projects

For each project to be added to the billing export, the `roles/container.view` role must be added for the `gke-billing-export` user:

```shell
$ gcloud projects add-iam-policy-binding other-project \
  --member serviceAccount:gke-billing-export@$GOOGLE_CLOUD_PROJECT.iam.gserviceaccount.com \
  --role roles/container.viewer
$ gcloud projects add-iam-policy-binding another-project \
  --member serviceAccount:gke-billing-export@$GOOGLE_CLOUD_PROJECT.iam.gserviceaccount.com \
  --role roles/container.viewer
```

Add the new project names to `config.json` and recreate the configmap:

```shell
$ kubectl create configmap billing-export-config -o yaml --dry-run --from-file=config.json=config.json \
  | kubectl replace -f -
```
