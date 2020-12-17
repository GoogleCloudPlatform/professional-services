# Aiven MySQL SSL Connection Notes

### 1. Summary

This PoC quickly demostrates that Anthos ASM mTLS communication terminates when a pod in ASM service mesh tries to communicate with an external service. Instead, ASM sidecar allows the pod to establish SSL connection using a certifcate with external service. 

In this PoC, the external service is Aiven MySQL database service with "SSLmode" set to be "Required". 

### 2. High level architecture

2.1 Aiven MySQL database is launched with "SSLmode" set to be "Required". A certificate (ca.pem) is downloaded from Aiven MySQL console.

2.2 A Python program is developed as a Aiven MySQL client. This program will query all records in the "test" database and return query result as JSON string. 

2.3 This Python is deployed as microservices on ASM cluster. Its API is exposed via ASM Ingress Gateway via HTTP (non-SSL). 

Therefore, here is the network traffic flow:
- User invokes non-SSL request to ASM Ingress Gateway, 
- The request is encrypted into mTLS communication within ASM service mesh. 
- mTLS terminates by the ASM sidecar of the Python pod. 
- Python pod establishes SSL connection with Auven database service using Aiven certificate.
- The query result is encrypted (mTLS) by ASM sidecar of Python pod before it is sent back into ASM service mesh. 
- The response is decrypted when it leaves ASM service mesh through Ingress Gateway. 
- User receives HTTP response. 

### 3. Build and Deploy Testing Pod

3.1 Build docker image

Check out this source code, and under "mysql-docker" directory, run docker command to build Docker container image. 

```
# Change "liaojianhe" Dockhub repository to be your container repository

docker built -t liaojianhe/mysql-test:v1.0.0 .
```

3.2 Push docker image to DockerHub

```
# Change "liaojianhe" Dockhub repository to be your container repository

docker push liaojianhe/mysql-test:v1.0.0
```

3.3 Create 'sample' namespace and label it for automatically Istio injection

```
# Create namespace

kubectl create namespace sample

# Label it for ASM Istio auto injection

kubectl label namespace sample istio-injection- istio.io/rev=asm-173-6 --overwrite
```

3.4 Deploy the application and service

Open up mysql-test.yaml and update the container image to be your container image before you run the following commands.

```
# Deploy the pod

kubectl apply -f mysql-test.yaml -n sample

# Deploy the gateway, so its API can be exposed via ASM Ingress Gateway
kubectl apply -f mysql-test-gateway.yaml -n sample
```

3.5 Make sure that pod and gateway are up and running

```
# Check pod
kubectl get pod -n sample

# Check gateway
kubectl get gateway -n sample
```

3.6 Find your ASM Ingress Gateway IP address

```
# Find the ASM Ingress Gateway IP. In this example, it is 34.94.58.160
kubectl get svc -n istio-system | grep ingressgateway
```

3.7 Invoke the API for testing

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
