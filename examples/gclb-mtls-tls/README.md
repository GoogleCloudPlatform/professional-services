## Setup mTLS and TLS with GCP Application Load Balancer (EXTERNAL_MANAGED)

### OVERVIEW:

mTLS with GCP Application Load Balancer enhances security by requiring clients to authenticate themselves with certificates, in addition to the server authenticating itself to the client. This provides mutual authentication, ensuring that both parties are who they claim to be.

To implement mTLS with GCP Application Load Balancer, you need to create a trust config resource that contains the root and intermediate certificates used to validate client certificates. You then create a client authentication resource that specifies the client validation mode and associates it with the trust config. Finally, you attach the client authentication resource to your load balancer's HTTPS frontend.

mTLS with GCP Application Load Balancer supports various features, including custom mTLS headers that can be used to pass information about the mTLS connection to backend services. It also supports different client validation modes, allowing you to choose how to handle invalid or missing client certificates.

### [Create a VPC native cluster:](https://cloud.google.com/kubernetes-engine/docs/how-to/standalone-neg#create-cluster)

```bash
gcloud container clusters create neg-demo-cluster \
    --create-subnetwork="" \
    --network=default \
    --zone=us-central1-a
```
### Connect to GKE cluster:
```bash
gcloud container clusters get-credentials neg-demo-cluster --zone us-central1-a --project <GCP_PROJECT_ID>
```
### Deploy the Sample application deployment and service(along with [NEG](https://cloud.google.com/load-balancing/docs/negs/zonal-neg-concepts)):
```bash
kubectl apply -f manifests/deploy.yaml
```

### Generate the self signed certificates

A detailed steps to generate the self signed certificates are documented in the [Medium Article.](https://medium.com/google-cloud/tls-and-mtls-connection-with-gcp-application-load-balancer-6e2cd5189707)

After executing the steps from the above article, you should have a root, 2 intermediate, server and client certificates generated. Copy all the generated certificates along with the following unencrypted server keys in the `terraform/certs` directory.

Decrypt the server key file using the passphrase used in previous steps:
```bash
openssl rsa -in server.key -out un-server.key
```

### Deploy the GCP Global application load balancer with both tls and mTLS configuration

#### Update the following terraform local variables in `terraform/main.tf`:
* project_id: GCP Project ID where the GCP load balancer will be deployed.
* vpc_networks: List of VPC network where the load balancer backend exists. The additional firewall rules required by load balancer are added using this input variable.
* vpc_projects: The GCP project ID where the VPC network exists.

#### Initialize the terraform directory

```bash
terraform init
```

#### Generate the terraform plan
```bash
terraform plan
```

#### Apply the terraform plan to provision all GCP resources.

```bash
terraform apply
```

After executing the terraform script, we should have the GCP application load balancer provisioned with 2 forwarding rules:
* One forwarding rule is used to send the tls connection.


* Another forwarding rule is used to send the mtls connection to load balancer.

#### Test the tls connection to the GCP Load balancer by sending the following curl request

```bash
curl -v --cacert int2.cert --connect-to test-domain.com:443:34.149.90.136:443 https://test-domain.com
```

The GCP application load balancer is also configured to send the custom headers of the mtls request back to the backend service which are seen in the curl request output of the mTLS connection, since the above request was tls connection, the custom headers are empty in the above tls connection response.


#### Test the mTLS connection to the GCP application load balancer by sending the following request

```bash
curl -v --cacert int2.cert --key client.key --cert client.cert --connect-to test-domain.com:443:34.8.115.55:443 https://test-domain.com
```

We see the mTLS custom headers in above mtls connection response are populated automatically by load balancer frontend and sent back to the backend server after a successful mTLS connection is established.
