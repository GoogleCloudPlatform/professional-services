# PostgreSQL Auto SSL Connection Using Cloud SQL Proxy

### Summary 

PostgreSQL uses application-level protocol negotation for SSL connection. Istio Proxy currently uses TCP-level protocol negotation, so Istio Proxy sidecar errors out during SSL handshake when it tries to auto encryt connection with PostgreSQL. Please follow the steps in [PostgreSQL Auto SSL Connection Problem Using Istio Sidecar](./Istio-Sidecar.md) to see the details of this issue. 

Because ASM Istio Proxy sidecar doesn't work with PostgreSQL SSL auto encryption, we demostrate how to use Cloud SQL Proxy to auto encrypt SSL connection with Cloud SQL PostgreSQL database in this article. 

### Prerequites

* Enforce SSL connection on Cloud SQL PostgreSQL instance.
* **We don't need certificates for Cloud SQL Proxy connection.** However, we will create client certificate and download client certificate, client key and server certificate for the purpose of initial SSL connection without sidecar auto-encryption. 
* Add K8s node IPs to the Authorized Networks of PostgreSQL instance. Or, we can add "0.0.0.0/0" to allow client connection from any IP address for testing purpose. 

### Build Container

Use the Dockerfile to build a testing PostgreSQL client container image. We package the certificates into Docker image just for initial connection testing. **They are not needed for connection via Cloud SQL Proxy**.

### Test Direct SSL Connection

Deploy a PostgreSQL client without any sidecar.

```
kubectl apply -f postgres-plain.yaml -n <YOUR_NAMESPACE>
```

Run the follow command to make sure SSL connection works.
```
# Enter into postgres-plain Pod
kubectl exec -it deploy/postgres-plain -n <YOUR_NAMESPACE> -- /bin/bash

# Once in the Pod, run this psql command with SSL mode
  psql "sslmode=verify-ca sslrootcert=server-ca.pem \
      sslcert=client-cert.pem sslkey=client-key.pem \
      hostaddr=YOUR_POSTGRESQL_IP \
      port=5432 \
      user=YOUR_USERNAME dbname=YOUR_DB_NAME"

# Enter your password when it is prompted
```

You should see something like this:
```
psql (12.5, server 12.4)
SSL connection (protocol: TLSv1.3, cipher: TLS_AES_256_GCM_SHA384, bits: 256, compression: off)
Type "help" for help.
```

Now, run `psql` command in Non-SSL mode
```
psql "hostaddr=YOUR_POSTGRESQL_IP port=5432 user=YOUR_USERNAME dbname=YOUR_DB_NAME"
```

You should see the error message as below. This proves that Non-SSL connection doesn't work.
```
psql: error: FATAL:  connection requires a valid client certificate
FATAL:  pg_hba.conf rejects connection for host "35.235.65.143", user "postgres", database "postgres", SSL off
```

### Deploy Cloud Proxy Sidecar

#### Create a Kubernetes Service Account

Because we have already deployed our GKE cluster with [Workload Identity](https://cloud.google.com/kubernetes-engine/docs/how-to/workload-identity) enabled, we will use Kubernetes Service Account (KSA) binding to GCP Service Account (GSA) to simplify our Cloud Proxy sidecar deployment.

Let's create a KSA "ksa-sqlproxy" 
```
kubectl apply -f service-account.yaml -n sample
```

#### Set up a GCP service account 

Set up a GCP service account (or use an existing GSA). Make sure that Cloud SQL Client permission is granted to this GSA. In this demo, we create a new GSA `sql-client@YOUR_PROJECT_ID.iam.gserviceaccount.com`.

#### Bind KSA to GSA

```
gcloud iam service-accounts add-iam-policy-binding \
  --role roles/iam.workloadIdentityUser \
  --member "serviceAccount:YOUR_PROJECT_ID.svc.id.goog[YOUR_NAMESPACE/ksa-sqlproxy]" \
  sql-client@wwb-brightinsight-seed.iam.gserviceaccount.com
```

#### Add annotation to the service account
```
kubectl annotate serviceaccount \
   ksa-sqlproxy \
   iam.gke.io/gcp-service-account=sql-client@YOUR_PROJECT_ID.iam.gserviceaccount.com \
   -n YOUR_NAMESPACE
```

#### Deploy PostgreSQL client with Cloud SQL Proxy sidecar

Let's take a look at the deployment YAML file, [postgres-cloudproxy.yaml](./postgres-cloudproxy.yaml). Please note the following two items:
* The "serviceAccountName: ksa-sqlproxy" entry for pod. This pod will use this KSA to authenticate itself through GCP IAM. Remember that we don't need the certificate files.  
* The container entry for Cloud SQL Proxy. 

```
kubectl apply -f postgres-cloudproxy.yaml -n sample
```

#### Test out Cloud SQL Proxy sidecar

* Run the following command to get into Postgres client container
```
kubectl exec -it deploy/postgres-check -c postgres-check -n <YOUR_NAMESPACE> -- /bin/bash
```

* Run `psql` command in Non-SSL mode
```
psql "hostaddr=YOUR_POSTGRESQL_IP port=5432 user=YOUR_USERNAME dbname=YOUR_DB_NAME"
```

You should be prompted for password, then you should be connected to your PostgreSQL database.
