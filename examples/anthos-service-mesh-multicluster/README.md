- [Twistlock PoC](./twistlock)    
- [Aiven MySQL PoC](./mysql-docker)

# Multi-Cluster ASM on Private Clusters

## Documentation

Here are several reference documents if you encounter issue when follow along instructions below:

- [Installing ASM using Anthos CLI](https://cloud.google.com/service-mesh/docs/gke-anthos-cli-existing-cluster)
- [Installing ASM using IstioCtl](https://cloud.google.com/service-mesh/docs/gke-install-existing-cluster)
- [Adding clusters to an Athos Service Mesh](https://cloud.google.com/service-mesh/docs/gke-install-multi-cluster)

## Description

In [Adding clusters to an Athos Service Mesh](https://cloud.google.com/service-mesh/docs/gke-install-multi-cluster), it shows how to federate service meshes of two Anthos **public** clusters. However, it misses a key instruction to open firewall for the service port to remote cluster. So, you final test of HelloWorld might not work. 

This sample builds on topic of Google's Anthos Service Mesh official installation documents, and adds instruction on how to federate two private clusters, which is more demanded in real customer environments. 

As illustrated in the diagram below, we will create a VPC with three subnets. Two subnets are for private clusters, and one for GCE servers. So, we illustrate using bastion server to access private clusters as in real environment. 

![NetworkImage](./asm-private-multiclusters-intranet.png)

The clusters are not accessible from external network. User can only log into the bastion server via IAP tunnel to gain access to this VPC. A firewall is built to allow IAP tunnel into GCE subnet (Subnet C) only. For bastion server in Subnet C to access Kubernetes APIs of both private clusters, Subnet C CIDR range is added to the "_Master Auth Network_" of both clusters. This is illustrated as blue lines and yellow underscore lines in the diagram above.

Also, in order for both clusters to access the service mesh (Istiod) and service deployed on the other cluster, we need to do the following:
- The pod CIDR range of one cluster must be added to the "_Master Auth Network_" of the other cluster. This enables one cluster to ping _istiod_ on the other cluster. 
- A firewall need to be open for one cluster's pod CIDR to access the service port on the other cluster. In this sample, it is port 5000 used by the HelloWord testing application. Because the invocation of service is bidirection in HelloWorld testing application, we will add firewall rule for each direction. 

The infrastruction used in this sample is coded in Terraform scripts. The ASM installation steps are coded in Shell script.     

## Prerequisites

As mentioned in [this document](https://cloud.google.com/service-mesh/docs/gke-install-multi-cluster), there are several prerequisites. 

This guide assumes that you have:

- [A Cloud project](https://cloud.google.com/resource-manager/docs/creating-managing-projects).
- [A Cloud Billing account](https://cloud.google.com/billing/docs/how-to/manage-billing-account).

Also, multi-cluster configuration has these requirements for the clusters in it:

- All clusters must be on the same network. 
- If you join clusters that are not in the same project, they must be installed using the asm-gcp-multiproject profile and the clusters must be in a shared VPC configuration together on the same network. In addition, we recommend that you have one project to host the shared VPC, and two service projects for creating clusters. For more information, see [Setting up clusters with Shared VPC](https://cloud.google.com/kubernetes-engine/docs/how-to/cluster-shared-vpc).

In this sample, we create two private clusters in different subnets of the same VPC in the same project, and enable clusters to communicate to each other's API server.   

## How to set up and run this sample

### Build Infrastructure

1. Create a GCP project.
2. Create a VPC in GCP project.
3. Create a subnet in the VPC. 
4. Create a VM in the subnet. This will be the bastion server to simulate an intranet access to GKE clusters.  
5. SSH onto this bastion server.
6. Make sure you have the following tools installed:
- The Cloud SDK (the gcloud command-line tool)
- The standard command-line tools: awk, curl, grep, sed, sha256sum, and tr
- git
- kpt
- kubectl
- jq

7. Set up Git on your machine, then clone this Github sample onto your machine. 

8. Set up [Terraform](https://learn.hashicorp.com/terraform/getting-started/install.html) on your machine, so you will be able to build infrastructure. 

9. Update the corresponding parameters for your project. 

- In vars.sh, check to see whether you need to update CLUSTER1_LOCATION,CLUSTER1_CLUSTER_NAME, CLUSTER1_CLUSTER_CTX, CLUSTER2_LOCATION, CLUSTER2_CLUSTER_NAME, CLUSTER2_CLUSTER_CTX.
- In _infrastructure/terraform.tfvars_, update "project_id".
- In _infrastructure/variables.tf_, update default values for "project_id" and "project_number".  
- In _infrastructure/shared.tf_, check whether you need to update "prefix" and "region". 
- In the locals section of _infrastructure/shared.tf_, update CIDR ranges for bastion_cidr, existing_vpc, cluster1 subnet/cluster and cluster2 subnet/cluster if you need to. 
- Source _vars.sh_ to set up basic environment variables. 

``` 
source vars.sh
```

10. If you want to run Terraform in your own workspace, create a backend.tf file from _infrastructure/backend.tf_tmpl_, and update your Terraform workspace information in this file. 

11. Under "_infrastructure_" directory, run
- terraform init
```
terraform init
```

- terraform plan
```
terraform plan -out output.tftxt
```

- terraform apply
```
terraforn apply output.tftxt
```

If Terraform completes without error, you should have VPC, NAT, two private clusters and firewall rules. Please check all artifacts in GCP Console. 

### Install ASM

1. On bastion server, go to this source code directory, then source _vars.sh_
```
cd asm-private-multiclusters-intranet
source vars.sh
```

2. Source _scripts/main.sh_
```
source scripts/main.sh
```
3. Run install_asm_mesh
```
install_asm_mesh
```

or, you can run the commands in install_asm_mesh step by step manually
```
    # Navigate to your working directory. Binaries will be downloaded to this directory.
    cd ${WORK_DIR}

    # Set up K8s config and context
    set_up_credential ${CLUSTER1_CLUSTER_NAME} ${CLUSTER1_LOCATION} ${CLUSTER1_CLUSTER_CTX} ${TF_VAR_project_id}
    set_up_credential ${CLUSTER2_CLUSTER_NAME} ${CLUSTER2_LOCATION} ${CLUSTER2_CLUSTER_CTX} ${TF_VAR_project_id}

    # Download ASM Installer
    download_asm_installer ${ASM_MAJOR_VER} ${ASM_MINOR_VER}

    #Install ASM
    install_asm ${CLUSTER1_CLUSTER_NAME} ${CLUSTER1_LOCATION} ${TF_VAR_project_id}
    install_asm ${CLUSTER2_CLUSTER_NAME} ${CLUSTER2_LOCATION} ${TF_VAR_project_id}

    # Register clusters
    grant_role_to_connect_agent ${TF_VAR_project_id}
    register_cluster ${CLUSTER1_CLUSTER_CTX} ${CLUSTER1_LOCATION}
    register_cluster ${CLUSTER2_CLUSTER_CTX} ${CLUSTER2_LOCATION}

    # Add clusters to mesh
    cross_cluster_service_secret ${CLUSTER1_CLUSTER_NAME} ${CLUSTER1_CLUSTER_CTX} ${CLUSTER2_CLUSTER_CTX}
    cross_cluster_service_secret ${CLUSTER2_CLUSTER_NAME} ${CLUSTER2_CLUSTER_CTX} ${CLUSTER1_CLUSTER_CTX}

```

### Deploy test helloworld application

Run install_test_app
```
install_test_app
```

### Prepare for verification
```
export CTX1=$CLUSTER1_CLUSTER_CTX
export CTX2=$CLUSTER2_CLUSTER_CTX
```

Follow the instruction in "**Verify cross-cluster load balancing**" section of [Add clusters to an Anthos Service Mesh](https://cloud.google.com/service-mesh/docs/gke-install-multi-cluster) to verify.

**Please Note:** You don't need to install Helloworld application, it has been installed for you already. 

## Internal Load Balancer

Anthos ASM deploys ingress gateway using exernal load balancer by default. If we need to change the ingress gateway to be internal load balancer, we can use "--option" or "--custom-overlay" parameter along with out load balancer yaml (./istio-profiles/internal-load-balancer.yaml). 

Please note that we need to specify out "targetPort" for https and http2 ports for current ASM version. 
