# Google Distributed Cloud Edge (GDCE) examples

This example demonstrates how to provision Google Distributed Cloud Edge (GDCE) resources using terraform with Cloud Build. The resources provisioned are listed below:

- GDCE Cluster
- GDCE Node Pool
- GDCE VPN Connection

## Run build using Cloud Build

### Requirements

- Cloud IAM Permission: roles/cloudbuild.builds.editor - to be able to start the build
- Cloud IAM Permission: roles/edgecontainer.admin - to fully manage GDCE clusters, node-pools and VPN connections

### Steps

```
cd terraform
terraform init
cp terraform.tfvars.sample terraform.tfvars

### Edit terraform.tfvars, especially <PROJECT_ID> and <GDCE_EDGE_ZONE_NAME>

cp backend.tf.sample backend.tf

### Edit backend.tf, replacing the bucket name
```

```
gcloud builds submit . --config=cloudbuild.yaml
```

### Cleanup

```
gcloud builds submit . --config=cloudbuild-destroy.yaml
```

## Run terraform locally

### Requirements

- Cloud IAM Permission: roles/edgecontainer.admin - to fully manage GDCE clusters, node-pools and VPN connections
- Terraform version 1.3.7 or greater

### Steps

```
cd terraform
terraform init
cp terraform.tfvars.sample terraform.tfvars

### Edit terraform.tfvars, especially <PROJECT_ID> and <GDCE_EDGE_ZONE_NAME>
```

Provision the infrastructure

`terraform apply`

### Cleanup

`terraform destroy`