# PostgreSQL Auto SSL Connection Using Cloud SQL Proxy

## Summary

PostgreSQL uses application-level protocol negotiation for SSL connection. Istio Proxy currently uses TCP-level protocol negotiation, so Istio Proxy sidecar errors out during SSL handshake when it tries to auto encrypt connection with PostgreSQL. Please follow the steps in [PostgreSQL Auto SSL Connection Problem Using Istio Sidecar](./Istio-Sidecar.md) to see the details of this issue.

Because ASM Istio Proxy sidecar doesn't work with PostgreSQL SSL auto encryption, we demonstrate how to use Cloud SQL Proxy to auto encrypt SSL connection with Cloud SQL PostgreSQL database in this article.

## Prerequisites

* Enforce SSL connection on Cloud SQL PostgreSQL instance.
* **We don't need certificates for Cloud SQL Proxy connection.** However, we will create client certificate and download client certificate, client key and server certificate for the purpose of initial SSL connection without sidecar auto-encryption. Instructions for downloading Cloud SQL for PostgreSQL certificates is on this page: [Configuring SSL/TLS certificates](https://cloud.google.com/sql/docs/postgres/configure-ssl-instance)
* Add K8s node IPs to the Authorized Networks of PostgreSQL instance. Or, we can add "0.0.0.0/0" to allow client connection from any IP address for testing purpose. 

## Build Container

1. Download the `client-cert.pem`, `client-key.pem` and `server-ca.pem` certificates, using the instructions on [Configuring SSL/TLS certificates](https://cloud.google.com/sql/docs/postgres/configure-ssl-instance)

    **NOTE:** These certificates are not needed for connecting via the Cloud SQL Proxy

2. Use the [Dockerfile](./Dockerfile) to build a test PostgreSQL client container image.

    The certificates are packaged into the Docker image just for initial connection testing.

## Test Direct SSL Connection

1. Deploy a PostgreSQL client without any sidecar.

    ```
    kubectl apply -f postgres-plain.yaml -n sample
    ```

2. Run the follow command to make sure the SSL connection works.

    ```
    # Enter into postgres-plain Pod
    kubectl exec -it deploy/postgres-plain -n sample -- /bin/bash

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

3. Now, run `psql` command in Non-SSL mode

    ```
    psql "hostaddr=YOUR_POSTGRESQL_IP port=5432 user=YOUR_USERNAME dbname=YOUR_DB_NAME"
    ```

    You should see the below error message. This proves that a Non-SSL connection doesn't work.

    ```
    psql: error: FATAL:  connection requires a valid client certificate
    FATAL:  pg_hba.conf rejects connection for host "35.235.65.143", user "postgres", database "postgres", SSL off
    ```

## Deploy the Cloud SQL Proxy Sidecar

1. Create a Kubernetes Service Account

    - We have already deployed our GKE cluster with [Workload Identity](https://cloud.google.com/kubernetes-engine/docs/how-to/workload-identity) enabled.
    - We will use a Kubernetes Service Account (KSA) binding to a Google Cloud Service Account (GSA) to simplify our Cloud Proxy sidecar deployment.
    - Create a KSA named "ksa-sqlproxy"

      ```
      kubectl apply -f service-account.yaml -n sample
      ```

2. Set up a Google Cloud Service Account 

    - Set up a Google Cloud Service Account (or use an existing GSA). 
    - Make sure that [Cloud SQL Client predefined role](https://cloud.google.com/sql/docs/mysql/project-access-control#roles) (roles/cloudsql.client) is granted to this GSA.
    - In the next step, we will create a new GSA `sql-client@${PROJECT_ID}.iam.gserviceaccount.com`.

3. Bind KSA to GSA

    ```
    export PROJECT_ID="$(gcloud config get-value project || ${GOOGLE_CLOUD_PROJECT})"

    gcloud iam service-accounts add-iam-policy-binding \
      --role roles/iam.workloadIdentityUser \
      --member "serviceAccount:${PROJECT_ID}.svc.id.goog[YOUR_NAMESPACE/ksa-sqlproxy]" \
      sql-client@${PROJECT_ID}.iam.gserviceaccount.com
    ```

4. Add annotation to the service account

    ```
    kubectl annotate serviceaccount \
      ksa-sqlproxy \
      iam.gke.io/gcp-service-account="sql-client@${PROJECT_ID}.iam.gserviceaccount.com" \
      -n YOUR_NAMESPACE
    ```

5. Deploy PostgreSQL client with Cloud SQL Proxy sidecar

    Take a look at the deployment YAML file, [postgres-cloudproxy.yaml](./postgres-cloudproxy.yaml). Please note the following two items:

      i. The "serviceAccountName: ksa-sqlproxy" entry for pod.

      - This pod will use this KSA to authenticate itself through Google Cloud IAM.
      - Remember that we don't need the certificate files.

      ii. The container entry for Cloud SQL Proxy. 

    ```
    kubectl apply -f postgres-cloudproxy.yaml -n sample
    ```

6. Test out Cloud SQL Proxy sidecar

    - Run the following command to get into Postgres client container

      ```
      kubectl exec -it deploy/postgres-check -c postgres-check -n sample -- /bin/bash
      ```

    - Run `psql` command in Non-SSL mode
    
      ```
      psql "hostaddr=YOUR_POSTGRESQL_IP port=5432 user=YOUR_USERNAME dbname=YOUR_DB_NAME"
      ```

    You should be prompted for password, then you should be connected to your PostgreSQL database.
