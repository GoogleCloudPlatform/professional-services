# Azure kubectl

The az-kubectl builder step uses the az build step to perform kubectl commands to an Azure Kubernetes Service (AKS) cluster.

Since it uses the az build step, it requires a SERVICE_PRINCIPAL and PRINCIPAL_PASSWORD generated and appropriate Roles grants for AKS in your TENANT_ID.
It also requires the RESOURCE_GROUP and CLUSTER_NAME of your AKS cluster you want to perform kubectl commands against.

**Example:**
```
- name: gcr.io/$PROJECT_ID/az-kubectl
  args: ['set', 'image', 'deployment/my-app', 'my-app=gcr.io/$PROJECT_ID/my-docker-app:latest']
  env:  ["RESOURCE_GROUP=aks-test-rg", "CLUSTER_NAME=aks-test", "SERVICE_PRINCIPAL=http://azure-cli-2019-06-01-18-04-35", "PRINCIPAL_PASSWORD=86466-34556f3-174a-8745-35e896c45","TENANT_ID=0835686-7345-9005-a567-92223645f"]
```

