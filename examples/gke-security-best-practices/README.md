# Kubernetes Engine - Security Best Practices    

**What is this?**    
- This is a security best practices demonstration.   
- This project demonstrates how to stand up a basic GKE [(Google Kubernetes Engine)](https://cloud.google.com/kubernetes-engine/) Cluster    
with [GKE security best practices](https://cloud.google.com/kubernetes-engine/docs/how-to/hardening-your-cluster) configured and enabled.    

## GKE security baseline

What are the security settings?    
- GKE Security Best Practices [Configuration Standard](./docs/settings.md)    
- GKE Security Hardening [Hardening your cluster's security](https://cloud.google.com/kubernetes-engine/docs/how-to/hardening-your-cluster)

## Deployment    

**To deploy this project perform the following actions:**     

1. Configure the Google Cloud SDK, authenticate, and set some environment variables.    

- Install and configure the [Cloud SDK](https://cloud.google.com/sdk).   
- Authenticate with the Cloud SDK: [Cloud SDK login](https://cloud.google.com/sdk/docs/authorizing).       

```bash
gcloud auth application-default login
```    

- Edit [create-tfvars.sh](./create-tfvars.sh) to reflect your environment and required settings.    

2. Run "make" to execute the terraform steps in the included [Makefile.](./Makefile)    

```bash
make all
```

## Connect and validate    

3. Use the SDK to connect to the bation host via "ssh".      

- ssh to the bastion host:    

```bash
gcloud compute --project $(gcloud config get-value project) ssh --zone "us-west2-a" "bastion-$(gcloud config get-value project)-gke"
```    

- Configure kubectl & verify api connectivity.    

```bash
gcloud container clusters get-credentials $(gcloud config get-value project)  --zone us-west2-a --project $(gcloud config get-value project)
```    
    
`Fetching cluster endpoint and auth data.`    
`kubeconfig entry generated for ${project_name}.`        

- Install the "kubectl" command.    

```bash
sudo snap install kubectl --classic
```   

`kubectl 1.13.1 from Canonical✓ installed`    

- Run the "kubectl" command and fetch the available namespaces.    

```bash
kubectl get ns
```    
    
`NAME          STATUS   AGE`    
`default       Active   1m`    
`kube-public   Active   1m`    
`kube-system   Active   1m`    
    
## Clean up    

4. To remove and clean up.    

```bash
make plan
make destroy
make clean
```    
     
