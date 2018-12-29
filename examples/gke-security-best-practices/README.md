# Kubernetes Engine - Security Best Practices

**What is this?**    
*A Security Best Practices Demo:*    

This project demonstrates how to stand up a basic GKE (Google Kubernetes Engine) Cluster
with security best practices configured/enabled

What are the security settings?    
**GKE Security Best Practices**: [Configuration Standard](./docs/settings.md)    


**How to deploy**     

## 1. Set variables

authenticate with the GCP SDK:    
```bash
bash$ gcloud auth application-default login
```
- update variables.tf to reflect your environment
- update packer.json to reflect your environment

## 2. Pack the hardend bastion VM image    
(use hashicorp packer)    
[HashiCorp Packer](https://www.packer.io/intro)

```bash
bash$ packer build packer.json
```

## 3. Run Terraform

```bash
bash$ terraform init
bash$ terraform plan
bash$ terraform apply
```

## 4. Connecting with kubectl

ssh to the bastion & configure kubectl & ensure connectivity
```bash
$ gcloud container clusters get-credentials $(terraform output cluster_name) --zone $(terraform output cluster_zone)
$ kubectl get ns
```

## To cleanup

```bash
bash$ terraform plan
bash$ terraform destroy
```

===
