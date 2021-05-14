# Auto Encrypt PostgreSQL SSL Connection Using Istio Proxy Sidecar

### Summary

PostgreSQL uses application-level protocol negotiation for SSL connection. Istio Proxy currently uses TCP-level protocol negotiation, so Istio Proxy sidecar errors out during SSL handshake when it tries to auto encrypt connection with PostgreSQL. In this article, we document how to reproduce this issue.

### Prerequisites

* Enforce SSL connection on Cloud SQL PostgreSQL instance.
* Create client certificate and download client certificate, client key and server certificate. We will use them in the client container for testing without sidecar auto-encryption, and mount them into Istio Proxy sidecar for sidecar auto-encryption.
* Add K8s node IPs to the Authorized Networks of PostgreSQL instance. Or, we can add "0.0.0.0/0" to allow client connection from any IP address for testing purpose.

### Build Container

Use the Dockerfile to build a testing PostgreSQL client container image. We package the certificates into Docker image just for initial connection testing. **They are not needed in client container for sidecar auto-encryption**.

### Test Direct SSL Connection

Deploy a PostgreSQL client without any sidecar. Please note that we turn off the sidecar inject in the YAML file even though we have label our namespace to have Istio sidecar auto inject. 

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

### Deploy Istio Proxy Sidecar

#### Create K8s secret for the certificates

We will mount our PostgreSQL certificates into Istio Proxy sidecar. In order to achieve this, we need to upload certificates as K8s secret.

```
kubectl create secret generic postgres-cert --from-file=certs/client-cert.pem  --from-file=certs/client-key.pem  --from-file=certs/server-ca.pem
```

#### Mount the certificates into Istio Proxy sidecar

We mount our PostgreSQL certificates into Istio Proxy sidecar via the following annotations.
```
        sidecar.istio.io/userVolume: '[{"name":"postgres-cert", "secret":{"secretName":"postgres-cert"}}]'
        sidecar.istio.io/userVolumeMount: '[{"name":"postgres-cert", "mountPath":"/etc/certs/postgres-cert", "re
adonly":true}]'
```

#### Configure Sidecar certificates 

We use [Service Entry](https://istio.io/latest/docs/reference/config/networking/service-entry/) and [Destination
 Rule](https://istio.io/latest/docs/reference/config/networking/destination-rule/) to instruct Istio Proxy sidec
ar to auto encrypt network traffic with specified Redis host and port with **SIMPLE** TLS. The detailed comments
 can be found in `destination-rule.yaml` and `service-entry.yaml` source code. 

Also, here is how we instruct Istio Proxy sidecar to use our certificates for encryption. 

```
      clientCertificate: /etc/certs/postgres-cert/client-cert.pem
      privateKey: /etc/certs/postgres-cert/client-key.pem
      caCertificates: /etc/certs/postgres-cert/server-ca.pem
```

Deploy both YAML files to your namespace. 
```
kubectl apply -f destination-rule.yaml -n <YOUR_NAMESPACE>

kubectl apply -f service-entry.yaml -n <YOUR_NAMESPACE>
```

#### Deploy PostgresSQL client with sidecar injection

Run this command to deploy PostgreSQL client with Istio Proxy sidecar inject
``
kubectl apply -f postgres-istio.yaml -n <YOUR_NAMESPACE>
``

#### Run `psql` command in Non-SSL mode
```
psql "hostaddr=YOUR_POSTGRESQL_IP port=5432 user=YOUR_USERNAME dbname=YOUR_DB_NAME"
```

You should be prompted for password. 

You will see errors.  

#### Look into the Istio Proxy log

You can read the logs in Cloud Logging. However, you may want to view sidecar log messages for the detailed network traffic information and errors with the following command.
```
kubectl logs deploy/postgres-istio -c istio-proxy -n <YOUR_NAMESPACE>
```
