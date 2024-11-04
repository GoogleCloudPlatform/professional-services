# Overview

Google Cloud Storage (GCS) provides several server side encryption features such as [CMEK](https://cloud.google.com/kms/docs/cmek) and [CSEK](https://cloud.google.com/storage/docs/encryption/customer-supplied-keys) besides the standard Google managed encryption keys. There is also [client side encryption](https://cloud.google.com/storage/docs/encryption/client-side-keys) where a key is passed in the request. However, if you have a use case for which you have to use client side encryption without passing a key and you don't want to make any changes to your existing applicaitons, you've come to the right place. This repository provides a POC that provdies the client side encryption funcationality via a proxy running as a sidecar to your client application.

## Key Features

- **Transparent Encryption/Decryption:** Data uploaded to GCS is automatically encrypted using Google Cloud KMS and [Tink](https://developers.google.com/tink)  at client side, and downloaded data is decrypted seamlessly.
- **Mitmproxy Integration:** Leverages [Mitmproxy](https://mitmproxy.org/) as a proxy to intercept and modify HTTP/HTTPS traffic for GCS operations.
- **Tink Library:** Utilizes the Tink library for cryptographic operations, ensuring secure key management and encryption practices.

## How it Works

1. **Mitmproxy Interception:** Mitmproxy acts as a man-in-the-middle proxy, intercepting all HTTP/HTTPS traffic between the client and GCS.
1. **Request Identification:** The proxy identifies GCS upload and download requests based on specific URL patterns.
1. **Encryption (Upload):** For upload requests, the proxy extracts the data from the request body, encrypts it using Google Cloud KMS, and replaces the original data with the encrypted version.
1. **Decryption (Download):** For download requests, the proxy intercepts the response from GCS, decrypts the encrypted data using Google Cloud KMS, and sends the decrypted data back to the client.

## Setup and Configuration

1. **Prerequisites:**

   The following pre-requisites are required to run this POC with mitmproxy as a sidecar to your client application on GKE cluster:

   - Google Cloud Project with:
     - Artifact registry to store the docker images of your mitm proxy and client app.
     - GCS bucket
       - This GCS bucket is required to perform the upload and download operations on GCS bucket.
       - Ensure the GKE cluster workloads have access to upload/download objects from this GCS bucket.
     - GKE cluster
        - A service account provsioned to nodes that have permissions to KMS keys and GCS APIs.  
    
     - Google Cloud KMS key
       - The KMS key is required to perform the client side encryption with tink.
       - Create KEK in Cloud KMS and get the KEK URI of KMS Key. See [Getting a Cloud KMS resource ID](https://cloud.google.com/kms/docs/getting-resource-ids) for details on how to get the path to your key.

    Note: GKE Cluster, KMS key along with the required IAM roles to access KMS key and GCS bucket can be provisioned by running the terraform scripts in [terraform](./terraform/) directory.

2. **Environment Variables:**

   - Following environment variables are set in gcs-deploy.yaml file to configure the proxy with your client app which sends GCS api requests:
     - `GCP_KMS_PROJECT_ID`: Update this variable with the GCP project ID where the KMS keys is created.
     - `GCP_KMS_KEY`: Update this with the full resource name of your Cloud KMS key. e.g. `gcp-kms://projects/PROJECT_ID/locations/LOCATION/keyRings/KEY_RING/cryptoKeys/KEY_NAME/cryptoKeyVersions/KEY_VERSION`
     - `https_proxy`: Set this environment variable to `https://127.0.0.1:8080` where the mitm proxy is running. This environment variable ensures all https requests are redirected to the mitm proxy.
     - `REQUESTS_CA_BUNDLE`: Update this environment variable to `/proxy/certs/mitmproxy-ca-cert.pem`, where the mitm proxy generates the CA certificates.

3. **Build Docker Images:**

   - Create the repositories in artifact registry to store the docker images of client application and mitm proxy.
   - Run the following commands to build and push the docker images to the artifact registry for both client application and mitm proxy. (Note: The Dockerfile are present in both `/app` and `/mitm` directory to build the docker images):

   ```bash
   cd <DOCKERFILE_DIRECTORY> # Change directory to /app and /mitm respectively for building the images
   docker build -t us-docker.pkg.dev/<GCP_PROJECT_ID>/<ARTIFACT_REGISTRY_REPOSTORY>/<IMAGE_NAME>:<TAG> .
   docker push us-docker.pkg.dev/<GCP_PROJECT_ID>/<ARTIFACT_REGISTRY_REPOSTORY>/<IMAGE_NAME>:<TAG>

   ```

   - Update the docker image with the correct artifact registry image url(`us-docker.pkg.dev/<GCP_PROJECT_ID>/<ARTIFACT_REGISTRY_REPOSTORY>/<IMAGE_NAME>:<TAG>`) in the kubernetes manifest file, [gcs-deplopy.yaml](./manifests/gcs-deploy.yaml), for both client app and mitm proxy images.

4. **Deploy the kubernetes manifests:**

   - The kubernets manifest file to deploy the deployment and load balancer is created in /manifests/gcs-deploy.yaml file. Run the following command to deploy the manifests on GKE cluster:
     ```bash
     kubectl apply -f manifests/gcs-deploy.yaml
     ```
   - Get the IP of the deployed load balancer(pointing to the client app) with following command:
     ```bash
     kubectl get service gcs-app-loadbalancer -o custom-columns=EXTERNAL_IP:.status.loadBalancer.ingress[0].ip 
     ```

## Usage

Once the proxy is running and your client is configured, any GCS upload or download operation performed by the client will be automatically encrypted/decrypted by the proxy.

**Test the application:**

- Create a sample text file named sample.txt, which will be encrypted at client side with tink.
- Send a curl request to the client app to upload a text file named sample.txt to GCS bucket(update \<GCS\_BUCKET\_NAME> with your GCS bucket name) which will be encrypted at client side:
  ```bash
  curl -X POST -F 'file=@sample.txt' http://<k8s_SERVICE_IP>:80/upload/<GCS_BUCKET_NAME>
  ```
- Send a curl request to the client app to download a text file named sample.txt from GCS bucket(update \<GCS\_BUCKET\_NAME> with your GCS bucket name) which will be decrypted at client side and stored to the local file named decrypted.txt:
  ```bash
  curl http://<k8s_SERVICE_IP>:80/download/<GCS_BUCKET_NAME>/sample.txt > decrypted.txt
  ```

## Disclaimer

- POC only uses 2 specific APIs and the rest of GCS objects related APIs are not tested for client side encryption. I.e. GCS provides "compose" to upload composite object, which is a more complicated use case.
- The client app and proxy is implemented in python. We should note that Google client SDK in different languages may have different ways to set proxy and certs related environment variables.
- This POC is tested with small data size with a file of type text to run the gcs upload and download operations for demonstration purposes only and should not be used in a production environment without further security considerations and hardening.

## Contributor
@eshen1991
@pawanphalak
@sampriyadarshi
