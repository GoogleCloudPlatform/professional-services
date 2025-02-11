## Setup service extensions(callout) with GCP Application Load Balancer (EXTERNAL_MANAGED)

### OVERVIEW:

[Callout-based Service Extensions](https://cloud.google.com/service-extensions/docs/overview) let users of Google Cloud products, such as Cloud Load Balancing and Media CDN, to insert programmability directly into the data path. This helps you customize the behavior of these proxies to meet your business needs.
Callouts let you use Cloud Load Balancing to make gRPC calls to user-managed services during data processing.
You write callouts against Envoy's external processing gRPC API (ext-proc). Callouts run as general-purpose gRPC servers on user-managed compute VMs and Google Kubernetes Engine Pods on Google Cloud, multicloud, or on-premises environments.

This repository contains the code to set up the callout-based service extension. The service extension is configured with a Global Application Load Balancer, and the service extension backend runs on GKE. This code repository also highlights detailed steps that are automated to provision a sample application, service extension backend (which modifies the specific request header), and deployment of all GCP resources automated with Terraform.

The service extension code in this repository follows a specific use case where a client header key `secret` value is Base64 encoded by the service extension and sent back to the GCP load balancer backend. This is a common use case where users need to modify headers with their own custom logic and send them back to the backend with the updated value.

This repository contains detailed steps to provision the resources along with the configuration steps in an automated way to setup the callout based service extension.

![Service Extension](https://github.com/user-attachments/assets/f55e8a92-c63e-44df-89e1-e3c414563966)

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

### Build the service extension code and update the image:

* Copy the all the certificates and key files from [ssl_creds](https://github.com/GoogleCloudPlatform/service-extensions/tree/main/callouts/go/extproc/ssl_creds) directory of the service extensions repository to this code repository working directory `gclb-callouts/service-extensions/extproc/ssl_creds`.
* Build the service extension code in the `service-extensions` directory using the Dockerfile in `service-extensions/extproc/config` directory.
* After the image is built, push the docker image in artifact registry and update the image name in image field of `manifests/service-extension.yaml` file.

### Create a namespace and TLS secret for service extension backend deployment on GKE:
```bash
kubectl create ns gclb-extension

kubectl create secret tls svc-ext-tls --key="extproc/ssl_creds/localhost.key" --cert="extproc/ssl_creds/localhost.crt" -n gclb-extension
```

### Deploy the service extension deployment and service (along with [NEG](https://cloud.google.com/load-balancing/docs/negs/zonal-neg-concepts)):
```bash
kubectl apply -f manifests/service-extension.yaml
```

The above steps will create 2 zonal NEG each for the sample application and the service extension.


### Deployment
Deploy the GCP resources to configure GCP Application load balancer with callout based service extension using the above backens deployed on GKE for service extension and sample application:

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
        curl --header 'Host: example.com' --header 'Secret: passcode'  http://<GCP_LB_IP>:80
    ```
    <img width="976" alt="Screenshot 2025-02-11 at 2 12 06 PM" src="https://github.com/user-attachments/assets/318ccccf-0437-474f-b5fa-b261f0ff574a" />
    We can see in the response that the secret header value received by the backend gets transformed to a base64 encoded value.

* Send the following curl request with no secret headers:
    ```bash 
        curl --header 'Host: example.com' http://<GCP_LB_IP>:80
    ```
    <img width="779" alt="Screenshot 2025-02-11 at 2 13 40 PM" src="https://github.com/user-attachments/assets/af96d7bf-d757-410f-8297-95c3513e6b65" />

    We can see in the response that the secret header value received by the backend gets transformed to empty value as no secret headers were passed via the curl request.
