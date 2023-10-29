# Autopsc Example

This folder contains an example application that is using Gateway API and PSC ServiceAttachments.

In order to deploy, you are going to need to create a TLS certificate and upload it to K8S:
```
openssl req  -nodes -new -x509  -keyout private.key -out cert.pem
kubectl create secret tls hello-example-com \
    --cert=cert.pem \
    --key=private.key
```
You will need a internal IP address, with the correct types:
```
gcloud compute networks subnets create ilb-private --network default --range=10.1.0.0/24 --purpose=PRIVATE
gcloud compute addresses create gw-ip --purpose=GCE_ENDPOINT --subnet=ilb-private
```
You are also going to need two subnets.
```
gcloud compute networks subnets create psc-subnet --network default --range=10.2.0.0/24 --purpose=PRIVATE_SERVICE_CONNECT
gcloud compute networks subnets create proxy-subnet --purpose=REGIONAL_MANAGED_PROXY --role=ACTIVE --network=default --range=10.3.0.0/24
```
In the `gateway.yaml` please replace the `PROJECT_ID` and `REGION` placeholders with the values for your setup. Afterwards you can deploy the two yaml resources.
```
kubectl apply -f gateway.yaml
kubectl apply -f app.yaml
```

Afterwards, you should be able to see the ServiceAttachment in the PSC web console.