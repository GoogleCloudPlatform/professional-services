# Aiven MySQL SSL Connection Notes

### 1. Summary

This PoC quickly demostrates that Anthos Service Mesh (ASM) mTLS communication terminates when a pod in ASM tries to communicate with an external service. Instead, the ASM sidecar allows the pod to establish SSL (TLS) connection using a certifcate with external service. 

In this PoC, the external service is Aiven MySQL database service with "SSLmode" set to be "Required". 

### 2. High level architecture

2.1 Aiven MySQL database is launched with "SSLmode" set to be "Required". A certificate (ca.pem) is downloaded from Aiven MySQL console.

2.2 A Python program is developed as a Aiven MySQL client. This program will query all records in the "test" database and return query result as JSON string. 

2.3 This Python is deployed as microservices on ASM cluster. Its API is exposed via ASM Ingress Gateway via HTTP (non-SSL). 

Therefore, here is the network traffic flow:
- User invokes non-SSL request to ASM Ingress Gateway, 
- The request is encrypted into mTLS communication within ASM service mesh. 
- mTLS terminates by the ASM sidecar of the Python pod. 
- Python pod establishes SSL connection with Aiven database service using Aiven certificate.
- The query result is encrypted (mTLS) by ASM sidecar of Python pod before it is sent back into ASM service mesh. 
- The response is decrypted when it leaves ASM service mesh through Ingress Gateway. 
- User receives HTTP response. 

### 3. Build and Deploy Testing Pod

3.1 Set environment variables

Check out this source code and in file [mysql-docker/setup.sh](setup.sh), set the following environment variables:

- GOOGLE_ARTIFACT_REGISTRY_REPO to your [Google Artifact Registry (GAR) Docker repository](https://cloud.google.com/artifact-registry/docs/docker/quickstart#create)
- PROJECT_ID to your Google Cloud project
- MYSQL_DB to your Aiven MYSQL database name
- MYSQL_HOST to your Aiven MYSQL database host name; E.G., "your_mysql_host.aivencloud.com"
- MYSQL_PASSWORD to your Aiven MYSQL password

3.2 Build docker image

Under "mysql-docker" directory, run docker command to build Docker container image.

```
# Build the Docker image

docker build -t $GOOGLE_ARTIFACT_REGISTRY_REPO/mysql-test:v1.0.0 .
```

3.3 Push docker image to [Google Artifact Registry (GAR)](https://cloud.google.com/artifact-registry/docs/docker/quickstart#push)

**NOTE:** Ensure [GAR is enabled](https://console.cloud.google.com/apis/library/artifactregistry.googleapis.com) for your Google Cloud project

```
# Enable GAR API

gcloud services enable artifactregistry.googleapis.com

# Create an artifact repository

gcloud artifacts repositories create $GOOGLE_ARTIFACT_REGISTRY_REPO --repository-format=docker \
--location=us-central1 --description="Docker repository"

# Make sure "$GOOGLE_ARTIFACT_REGISTRY_REPO" is set to your container repository

docker push $GOOGLE_ARTIFACT_REGISTRY_REPO/mysql-test:v1.0.0
```

3.4 Create 'sample' namespace and label it for automatically Istio injection

```
# Create namespace

kubectl create namespace sample

# Label it for ASM Istio auto injection

kubectl label namespace sample istio-injection- istio.io/rev=asm-173-6 --overwrite
```

3.5 Download the Aiven certificate and use it with the mysql-test Kubernetes service, that was created using the mysql-test image

**NOTE** Aiven MySQL database is launched with "SSLmode" set to be "Required". The certificate (ca.pem) is downloaded from Aiven MySQL console

3.6 Deploy the application and service
Update the [mysql-test.yaml](./mysql-test.yaml) Kubernetes secret with the value from the Aiven ca.pem file

```
apiVersion: v1
kind: Secret
metadata:
  name: aiven-tls
type: kubernetes.io/tls
data:
  # Download the Aiven certificate from the Aiven MySQL console.
  ca.pem |
        MIIC2DCCAcCgAwIBAgIBATANBgkqh...
```

Run the below sed command to update mysql-test.yaml with the path to your container image. Please then that confirm the path is correct

```
# Deploy the pod
sed -i -e "s/GOOGLE_ARTIFACT_REGISTRY_REPO/${GOOGLE_ARTIFACT_REGISTRY_REPO}/g" mysql-test.yaml
kubectl apply -f mysql-test.yaml -n sample

# Deploy the gateway, so its API can be exposed via ASM Ingress Gateway
kubectl apply -f mysql-test-gateway.yaml -n sample
```

3.7 Make sure that pod and gateway are up and running

```
# Check pod
kubectl get pod -n sample

# Check gateway
kubectl get gateway -n sample
```

3.8 Find your ASM Ingress Gateway IP address

```
# Find the ASM Ingress Gateway IP. In this example, it is 34.94.58.160
kubectl get svc -n istio-system | grep ingressgateway
```

**NOTE:** In file [mysql-docker/setup.sh](setup.sh) add the ASM Ingress Gateway IPs for the clusters 

```
# Invoke on cluster 3
curl http://<asm-ingress-gw-ip>/query

# Invoke on cluster 4
curl http://<asm-ingress-gw-ip>/query
```

3.9 Invoke the API for testing

Use a browser or use a curl command as following. You should receive a result JSON string.
```
curl -i http://35.235.106.163/query 
```

### 4. Validate the mTLS and SSL connection

If you receive a result JSON string, you can be sure 
- your user-end request/response is HTTP (non-SSL).
- the connection between Python pod and Aiven database is SSL connection vis Aiven certificate because Aiven service has turned on "SSLmod" to be "required".

Now, we need to verify that service within Anthos ASM service mesh is secured by mTLS. 
- Make several call to the testing API to generate some request traffic as illustrate in step 3.7 above.
- Log into your GCP console,
- Navigate to __Anthos__ -> __Service Mesh__, find **mysql-test** service in the services list. Then, click it. 
- With **mysql-test** selected, click the "Security" sub-tab on the left under __Anthos Service Mesh__. You should find a green lock under "Request Port" in "Inbound Service Access". This shows that traffic within ASM for this API call is mTLS secured.

You have sucessfully completed this PoC.
