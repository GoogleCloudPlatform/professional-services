## Setup service extensions(callout) with GCP Application Load Balancer (EXTERNAL_MANAGED)

### OVERVIEW:

[Callout-based Service Extensions](https://cloud.google.com/service-extensions/docs/overview) let users of Google Cloud products, such as Cloud Load Balancing and Media CDN, to insert programmability directly into the data path. This helps you customize the behavior of these proxies to meet your business needs.
Callouts let you use Cloud Load Balancing to make gRPC calls to user-managed services during data processing.
You write callouts against Envoy's external processing gRPC API (ext-proc). Callouts run as general-purpose gRPC servers on user-managed compute VMs and Google Kubernetes Engine Pods on Google Cloud, multicloud, or on-premises environments.

This repository contains the code to set up the callout-based service extension. The service extension is configured with a Global Application Load Balancer, and the service extension backend runs on GKE. This code repository also highlights detailed steps that are automated to provision a sample application, service extension backend (which modifies the specific request header), and deployment of all GCP resources automated with Terraform.

The service extension code in this repository follows a specific use case where a client header key `secret` value is Base64 encoded by the service extension and sent back to the GCP load balancer backend. This is a common use case where users need to modify headers with their own custom logic and send them back to the backend with the updated value.

This repository contains detailed steps to provision the resources along with the configuration steps in an automated way to setup the callout based service extension.

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
### Deploy the sample application deployment and service (along with [NEG](https://cloud.google.com/load-balancing/docs/negs/zonal-neg-concepts)):
```bash
kubectl apply -f manifests/deploy.yaml
```

### Create a namespace and TLS secret for service extension backend deployment on GKE:
```bash
kubectl create ns gclb-extension

kubectl create secret tls svc-ext-tls --key="extproc/ssl_creds/localhost.key" --cert="extproc/ssl_creds/localhost.crt" -n gclb-extension
```

### Deploy the service extension deployment and service (along with [NEG](https://cloud.google.com/load-balancing/docs/negs/zonal-neg-concepts)):
```bash
kubectl apply -f manifests/service-extension.yaml
```

### The above steps will create 2 zonal NEG each for the sample application and the service extension.


### Deploy the GCP resources to configure GCP Application load balancer with callout based service extension using the above backens deployed on GKE for service extension and sample application:

#### Update the following terraform local variables in `terraform/main.tf`:
* project_id: GCP Project ID.
* vpc_network: VPC network where the load balancer backend exists. The additional firewall rules required by load balancer are added using this input variable.
* vpc_project: The GCP project ID where the VPC network exists.

**Note:** Other variables may not need any change if there are no change in region or names of the GCP resources are needed.

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

After executing the terraform script, we should have the following GCP resource provisioned GCP application load balancer:
* GCP Application Load Balancer
* Callout based service extension attached to the load balancer.
* Service extension backend service.
* Health Check and Firewall rules required for load balancer and Backend services.

#### Test the GCP Load balancer by sending the following curl request

* Send the following curl request with the secret headers set:
    ```bash 
        curl --header 'Host: example.com' --header 'Secret: passcode'  http://34.117.181.83:80
    ```

    We can see in the response that the secret header value received by the backend gets transformed to a bas64 encoded value.
