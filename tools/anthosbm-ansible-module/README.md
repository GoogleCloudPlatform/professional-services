- [1. Introduction](#1-introduction)
- [2. Anthos on Bare Metal Ansible Module](#2-anthos-on-bare-metal-ansible-module)
  - [2.1 Ansible Configuration file](#21-ansible-configuration-file)
  - [2.2 Execute Playbook](#22-execute-playbook)
- [3. Prerequisites for Anthos on Bare Metal](#3-prerequisites-for-anthos-on-bare-metal)
  - [3.1 Google Cloud Account](#31-google-cloud-account)
  - [3.2 OS Prerequisites](#32-os-prerequisites)
  - [3.3 Workstation Docker prerequisite](#33-workstation-docker-prerequisite)
  - [3.4 Workstation gcloud SDK prerequisite](#34-workstation-gcloud-sdk-prerequisite)
  - [3.5 Workstation Kubectl prerequisite](#35-workstation-kubectl-prerequisite)
  - [3.6 Workstation bmctl prerequisite](#36-workstation-bmctl-prerequisite)
- [4. Google Cloud Configuration](#4-google-cloud-configuration)
- [5. Anthos Cluster Role](#5-anthos-cluster-role)
  - [5.1 Inventory File](#51-inventory-file)
  - [5.2 Variable File](#52-variable-file)
  - [5.3 Admin Cluster](#53-admin-cluster)
    - [5.3.1 Admin Cluster Inventory File](#531-admin-cluster-inventory-file)
    - [5.3.2 Admin Cluster Variables](#532-admin-cluster-variables)
    - [5.3.3 Create Admin Cluster](#533-create-admin-cluster)
  - [5.4 Create User Cluster](#54-create-user-cluster)
    - [5.4.1 User Cluster Inventory File](#541-user-cluster-inventory-file)
    - [5.4.2 User Cluster Variables](#542-user-cluster-variables)
    - [5.4.3 Create User Cluster](#543-create-user-cluster)
  - [5.5 Create Hybrid Cluster](#55-create-hybrid-cluster)
    - [5.5.1 Hybrid Cluster Inventory File](#551-hybrid-cluster-inventory-file)
    - [5.5.2 Hybrid Cluster Variables](#552-hybrid-cluster-variables)
    - [5.5.3 Create Hybrid Cluster](#553-create-hybrid-cluster)
  - [5.6 Create Standalone Cluster](#56-create-standalone-cluster)
    - [5.6.1 Standalone Cluster Inventory File](#561-standalone-cluster-inventory-file)
    - [5.6.2 Standalone Cluster Variables](#562-standalone-cluster-variables)
    - [5.6.3 Create Standalone Cluster](#563-create-standalone-cluster)
- [6. Connect Gateway Configuration](#6-connect-gateway-configuration)
  - [6.1 Configure Connect Gateway](#61-configure-connect-gateway)
  - [6.2 Validate Connect Gateway](#62-validate-connect-gateway)
- [7. Reset Cluster](#7-reset-cluster)
- [8. Update Kubelet Config](#8-update-kubelet-config)


## 1. Introduction

Anthos on bare metal allows you to run Kubernetes clusters on your own hardware infrastructure and also allows you to monitor your cluster from Google Cloud Console.  Read more on Anthos on bare metal  [here](https://cloud.google.com/anthos/gke/docs/bare-metal/1.8/concepts/about-bare-metal).

This guide explains the steps required for creating Anthos clusters on bare metal on Ubuntu hosts and also explains steps to try it on Google Compute Engine (GCE) VMs. 


## 2. Anthos on Bare Metal Ansible Module

This module can be used for installation of Anthos on Bare Metal nodes for all kind of clusters (admin, user, hybrid and standalone).


### 2.1 Ansible Configuration file

The ansible.cfg configuration file is placed in the &lt;REPOSITORY\_ROOT>/ansible directory. This configures the inventory location and disables host checking.


```
[defaults]
inventory = ./inventory/hosts.yml
host_key_checking = False
```



### 2.2 Execute Playbook

Install Ansible on Workstation and run the below command to create the Anthos cluster.


```
sudo apt install ansible

cd <REPOSITORY_ROOT>/ansible

ansible-playbook create_anthos_cluster.yml
```



## 3. Prerequisites for Anthos on Bare Metal

The complete list of prerequisites is available [here](https://cloud.google.com/anthos/clusters/docs/bare-metal/1.8/installing/install-prereq).

Other than cluster nodes, you need a workstation machine that is used for running Anthos installation commands. It can be a GCE VM, or an on-premise VM or an on-premise physical server.  Following are the main prerequisites for a workstation:



*   Operating system is the same supported Linux distribution running on the cluster node machines.
*   More than 50 GB of free disk space.
*   L3 connectivity to all cluster node machines.
*   Access to all cluster node machines through SSH via private keys with passwordless root access. Access can be either direct or through sudo.
*   Access to the control plane VIP.


### 3.1 Google Cloud Account

You need a user account or a service account that has a Project Owner/Editor role creating the required Google Cloud resources.  Alternatively You can add the following IAM roles to the user account (or service account):



*   Service Account Admin
*   Service Account Key Admin
*   Project IAM Admin
*   Compute Viewer
*   Service Usage Admin

```
gcloud auth login
gcloud auth application-default login
```




### 3.2 OS Prerequisites

The Ubuntu OS prerequisites for all the cluster nodes including Workstation can be accomplished through**ubuntu-prereq/rhel-prereq** Ansible role. The execution of this role is controlled by the below variable in vars/anthos\_vars.yml file


*vars/anthos_vars.yml*

```
# Possible values: ubuntu | rhel
# Use rhel for CentOS as well
os_type: "ubuntu"
```


The role execution is done from the playbook (create_anthos_cluster.yml).


*create_anthos_cluster.yml*

```
- hosts: all
  remote_user: "{{ login_user }}"
  gather_facts: "no"
  vars_files:
    - vars/anthos_vars.yml
  roles:
    - role: ubuntu-prereq
      become: yes
      become_method: sudo
      when: os_type == "ubuntu"
    - role: rhel-prereq
      become: yes
      become_method: sudo
      when: os_type == "rhel"
```


### 3.3 Workstation Docker prerequisite

The workstation should have Docker installed and the non-root user that is used for Anthos installation should have access to the Docker. This can be achieved through the ws-docker role.


*create_anthos_cluster.yml*

```
- hosts: workstation
  remote_user: "{{ login_user }}"
  gather_facts: "no"
  vars_files:
    - vars/anthos_vars.yml
  roles:
    - role: ws-docker
      become: yes
      become_method: sudo
      when: ws_docker == "yes"
```

The role execution can be controlled by the below variable.


*vars/anthos_vars.yml*

```
# Leave it blank if you would like to skip the docker installation and configuration
ws_docker: "yes"
```



### 3.4 Workstation gcloud SDK prerequisite

The Workstation should have gcloud SDK installed. You can do this using the**gcloud-sdk** Ansible role.


*create_anthos_cluster.yml*

```
    - role: gcloud-sdk
      become: yes
      become_method: sudo
      when: gcloud_sdk == "yes"
```


The role execution can be controlled by the below variable.


*vars/anthos_vars.yml*

```
# Leave it blank if you would like to skip the gcloud SDK installation
gcloud_sdk: "yes"
```



### 3.5 Workstation Kubectl prerequisite

The Workstation should have the kubectl tool installed. This can be done through**kubectl-tool** Ansible role.


*create_anthos_cluster.yml*

```
    - role: kubectl-tool
      become: yes
      become_method: sudo
      when: kubectl_tool == "yes"
```


The role execution can be controlled by the below variable.


*vars/anthos_vars.yml*

```
# Leave it blank if you would like to skip the kubectl installation
kubectl_tool: "yes"
```



### 3.6 Workstation bmctl prerequisite

The Workstation should have the bmctl tool installed. This can be done through**bmctl-tool** Ansible role.


*create_anthos_cluster.yml*

```
    - role: bmctl-tool
      become: yes
      become_method: sudo
      when: bmctl_tool == "yes"
```


The role execution can be controlled by the below variable.


*vars/anthos_vars.yml*

```
# Leave it blank if you would like to skip the bmctl installation
bmctl_tool: "yes"
```


The bmctl download location and version is configured through below variables.


*vars/anthos_vars.yml*

```
bmctl_download_url: gs://anthos-baremetal-release/bmctl/1.6.2/linux-amd64/bmctl
```


The location of bmctl executable is defaulted to `/usr/local/sbin` which can be changed through below variable.


*vars/anthos_vars.yml*

```
bmctl_path: /home/user1/baremetal
```



## 4. Google Cloud Configuration

The Google Cloud configuration can be done from a Cloud Shell or a GCE VM Instance. If the configuration is done from the Workstation, then you should login with a Google account. You can find the required details [here](https://cloud.google.com/anthos/clusters/docs/bare-metal/1.8/installing/install-prereq#logging_into_gcloud). 

You can configure the Google Cloud as well as create required Service Accounts using**service-accounts** Ansible role.


*create_anthos_cluster.yml*

```
    - role: service-accounts
      when: service_accounts == "yes"
```


In case you have already created the Service Account and would like to skip this step, you can do so through the below variable.


*vars/anthos_vars.yml*
 
 ```
 # Leave it blank if you would like to skip the bmctl installation
service_accounts: "yes"
```


The location for downloaded key files for Service Accounts and the names of Service Accounts are configured through below variables.


*vars/anthos_vars.yml*

```
# The Service Account Key files are stored in this location. The role that creates cluster searches this location for the key files.
gcp_sa_key_dir: /home/anthos/gcp_keys
# Below are the names of the Service Accounts created for the Anthos cluster
local_gcr_sa_name: anthos-gcr-svc-account
local_connect_agent_sa_name: connect-agent-svc-account
local_connect_register_sa_name: connect-register-svc-account
local_cloud_operations_sa_name: cloud-ops-svc-account
```


**Note:** The below bmctl command can also enable Google Cloud APIs and create the required service accounts. However, the Ansible role provides better control especially when you would like to use the same Service Accounts for different clusters.


```
bmctl create config -c [CLUSTER_NAME]
    --enable-apis \
    --create-service-accounts
```



## 5. Anthos Cluster Role

The Anthos cluster can be created using the**anthos** Ansible role.


*create_anthos_cluster.yml*

```
    - role: anthos
```


The**anthos** Ansible role uses a number of variables in addition to the Service Accounts variables. It also uses the Inventory host file.


### 5.1 Inventory File

The IP address or the DNS names of cluster nodes including Workstation should be set in the Ansible inventory. The**cp\_nodes** contains the list of Control Plane Nodes and**worker\_nodes** contains the list of Worker Nodes.


*inventory/hosts.yml*

```
all:
  hosts:
  children:
    workstation:
      hosts:
        10.200.0.7:
    cp_nodes:
      hosts:
        10.200.0.2:
        10.200.0.3:
        10.200.0.4:
    worker_nodes:
      hosts:
        10.200.0.5:
        10.200.0.6:
```



### 5.2 Variable File

The variable file is placed in the**vars** directory under the root of the code repository. The purpose of each variable explained below.


*vars/anthos_vars.yml*

```
# Login user, group and home for Cluster nodes
login_user: anthos
login_user_group: anthos
login_user_home: /home/anthos
# node login user, when "login_user" used for admin node is different for worker node.
# node_login_user: anthos2
# Possible values: ubuntu | rhel 
# Use rhel for CentOS as well
os_type: "ubuntu"
# Set value to "yes" to apply the respective role
ws_docker: "yes"
gcloud_sdk: "yes"
kubectl_tool: "yes"
bmctl_tool: "yes"
service_accounts: "yes"
# Link to download bmctl from. It also contains the version
bmctl_download_url: gs://anthos-baremetal-release/bmctl/1.8.2/linux-amd64/bmctl
# Directory used by bmctl tool for creating the cluster
bmctl_workspace_dir: bmctl-workspace
# Directory where Service Account keys are placed
gcp_sa_key_dir: /home/anthos/gcp_keys
# Names of the Service Accounts
local_gcr_sa_name: anthos-gcr-svc-account
local_connect_agent_sa_name: connect-agent-svc-account
local_connect_register_sa_name: connect-register-svc-account
local_cloud_operations_sa_name: cloud-ops-svc-account
# The SSH key file for logging into Anthos nodes
ssh_private_key_path: /home/anthos/.ssh/id_rsa
# Project ID for the Google Cloud Project
project_id: [PROJECT_ID]
# Google Cloud region
location: [REGION]
# Name of the Cluster
cluster_name: [CLUSTER_NAME]
# Type of cluster deployment. Possible values are: standalone | hybrid | admin | user
cluster_type: hybrid
# Number of maximum Pods that can run on a node
max_pod_per_node: 250
# Container runtime for the cluster. Possible values are: docker and containerd
container_runtime: containerd
# enable/disable application logging for cluster workloads. use 'true' to enable
app_logs: false
# Kubernetes POD CIDR.Change it if the default one overlaps with the Cluster Nodes CIDR.
pod_cidr: 192.168.0.0/16
# Kubernetes Services CIDR.Change it if the default one overlaps with the Cluster Nodes CIDR.
service_cidr: 10.96.0.0/12
# Anthos Cluster Control Plane VIP. This should be in the Cluster Node subnet and should not be part of lb_address_pool.
cp_vip: 10.200.0.47
# Anthos Ingress VIP. This should be in the Cluster Node subnet and should be part of lb_address_pool.
ingress_vip: 10.200.0.48
# Address pool for Cluster Load Balancer
lb_address_pool: 
- 10.200.0.48/28
# For a 'user' cluster, place the admin cluster kubeconfig file on workstation machine and set admin_kubeconfig_path to the absolute path of this file
admin_kubeconfig_path: [ADMIN_CLUSTER_KUBECONFIG]
cgw_members: 
- [email id of IAM user or service account]
# Provide multiple NIC for pods - https://cloud.google.com/anthos/clusters/docs/bare-metal/latest/how-to/multi-nic
# multi_nic: true
```



### 5.3 Admin Cluster

You can read about the admin cluster installation [here](https://cloud.google.com/anthos/clusters/docs/bare-metal/1.8/installing/creating-clusters/admin-cluster-creation).


#### 5.3.1 Admin Cluster Inventory File

The admin cluster consists of Control Plane nodes only. Therefore, the inventory file for an admin cluster would look like this.


*inventory/hosts.yml*

```
all:
  hosts:
  children:
    workstation:
      hosts:
        10.200.0.7:
    cp_nodes:
      hosts:
        10.200.0.2:
```


The _cp\_nodes_ list should contain an odd number of hosts (such as 1, 3 or 5). The installation ignores _worker\_nodes_ list if it is present in the inventory file.


#### 5.3.2 Admin Cluster Variables

You need to set the _cluster\_type_ and _cluster\_name_ variables in the variable file.  Below is a sample variable file for the admin cluster using Ubuntu nodes. Replace the values enclosed in square brackets ([]) with actual values relevant to your GCP project and the cluster.


*vars/anthos_vars.yml*

```
login_user: anthos
login_user_group: anthos
login_user_home: /home/anthos
os_type: "ubuntu"
ws_docker: "yes"
gcloud_sdk: "yes"
kubectl_tool: "yes"
bmctl_tool: "yes"
service_accounts: "yes"
bmctl_download_url: gs://anthos-baremetal-release/bmctl/1.8.2/linux-amd64/bmctl
bmctl_workspace_dir: bmctl-workspace
gcp_sa_key_dir: /home/anthos/gcp_keys
local_gcr_sa_name: anthos-gcr-svc-account
local_connect_agent_sa_name: connect-agent-svc-account
local_connect_register_sa_name: connect-register-svc-account
local_cloud_operations_sa_name: cloud-ops-svc-account
ssh_private_key_path: /home/anthos/.ssh/id_rsa
project_id: [PROJECT_ID]
location: [REGION]
cluster_name: [CLUSTER_NAME]
cluster_type: admin
max_pod_per_node: 250
container_runtime: containerd
app_logs: false
pod_cidr: 192.168.0.0/16
service_cidr: 10.96.0.0/12
cp_vip: 10.200.0.47
cgw_members:
- [email id of IAM user or service account]
```

Below variables are not used for the admin cluster. You can either ignore them or remove them from the variable file.

```
ingress_vip: 10.200.0.48
lb_address_pool: 
- 10.200.0.48/28
admin_kubeconfig_path: 
```

#### 5.3.3 Create Admin Cluster

Run below command from workstation node (ansible should be installed on the workstation node)  to create the cluster.


```
cd <REPOSITORY_ROOT>/ansible
ansible-playbook create_anthos_cluster.yml
```



### 5.4 Create User Cluster

You can read about the user cluster installation [here](https://cloud.google.com/anthos/clusters/docs/bare-metal/1.8/installing/creating-clusters/user-cluster-creation).


#### 5.4.1 User Cluster Inventory File

The user cluster consists of Control Plane nodes as well as worker nodes. Therefore, the inventory file for a user cluster would look like this.


*inventory/hosts.yml*

```
all:
  hosts:
  children:
    workstation:
      hosts:
        10.200.0.7:
    cp_nodes:
      hosts:
        10.200.0.3:
    worker_nodes:
      hosts:
        10.200.0.5:
        10.200.0.6:
```


#### 5.4.2 User Cluster Variables

You need to set the _cluster\_type_ and _cluster\_name_ variables in the variable file.  Below is a sample variable file for the user cluster using Ubuntu nodes. Replace the values enclosed in square brackets ([]) with the actual values relevant to your GCP project and the cluster.

Set *admin_kubeconfig_path* variable to the full path of the admin cluster kubeconfig file.


*vars/anthos_vars.yml*

```
login_user: anthos
login_user_group: anthos
login_user_home: /home/anthos
os_type: "ubuntu"
ws_docker: "yes"
gcloud_sdk: "yes"
kubectl_tool: "yes"
bmctl_tool: "yes"
service_accounts: "no"
bmctl_download_url: gs://anthos-baremetal-release/bmctl/1.8.2/linux-amd64/bmctl
bmctl_workspace_dir: bmctl-workspace
gcp_sa_key_dir: /home/anthos/gcp_keys
local_gcr_sa_name: anthos-gcr-svc-account
local_connect_agent_sa_name: connect-agent-svc-account
local_connect_register_sa_name: connect-register-svc-account
local_cloud_operations_sa_name: cloud-ops-svc-account
ssh_private_key_path: /home/anthos/.ssh/id_rsa
project_id: [PROJECT_ID]
location: [REGION]
cluster_name: [CLUSTER_NAME]
cluster_type: user
max_pod_per_node: 250
container_runtime: containerd
app_logs: false
pod_cidr: 192.168.0.0/16
service_cidr: 10.96.0.0/12
cp_vip: 10.200.0.46
ingress_vip: 10.200.0.48
lb_address_pool: 
- 10.200.0.48/28
admin_kubeconfig_path: /home/anthos/bmctl-workspace/admin-abm/admin-abm-kubeconfig
cgw_members: 
- [email id of IAM user or service account]
```



#### 5.4.3 Create User Cluster

Run below command from workstation node (ansible should be installed on the workstation node) to create the cluster.


```
cd <REPOSITORY_ROOT>/ansible
ansible-playbook create_anthos_cluster.yml
```



### 5.5 Create Hybrid Cluster

You can read about the hybrid cluster installation [here](https://cloud.google.com/anthos/clusters/docs/bare-metal/1.8/installing/creating-clusters/hybrid-cluster-creation).


#### 5.5.1 Hybrid Cluster Inventory File

The hybrid cluster consists of Control Plane nodes as well as worker nodes. Therefore, the inventory file for a hybrid cluster would look like this.


*inventory/hosts.yml*

```
all:
  hosts:
  children:
    workstation:
      hosts:
        10.200.0.7:
    cp_nodes:
      hosts:
        10.200.0.2:
        10.200.0.3:
        10.200.0.4:
    worker_nodes:
      hosts:
        10.200.0.5:
        10.200.0.6:
```



#### 5.5.2 Hybrid Cluster Variables

You need to set the _cluster\_type_ and _cluster\_name_ variables in the variable file.  Below is a sample variable file for the hybrid cluster using Ubuntu nodes. Replace the values enclosed in square brackets ([]) with actual values relevant to your GCP project and the cluster.



*vars/anthos_vars.yml*

```
login_user: anthos
login_user_group: anthos
login_user_home: /home/anthos
node_login_user: anthos2
os_type: "ubuntu"
ws_docker: "yes"
gcloud_sdk: "yes"
kubectl_tool: "yes"
bmctl_tool: "yes"
service_accounts: "yes"
bmctl_download_url: gs://anthos-baremetal-release/bmctl/1.8.2/linux-amd64/bmctl
bmctl_workspace_dir: bmctl-workspace
gcp_sa_key_dir: /home/anthos/gcp_keys
local_gcr_sa_name: anthos-gcr-svc-account
local_connect_agent_sa_name: connect-agent-svc-account
local_connect_register_sa_name: connect-register-svc-account
local_cloud_operations_sa_name: cloud-ops-svc-account
ssh_private_key_path: /home/anthos/.ssh/id_rsa
project_id: [PROJECT_ID]
location: [REGION]
cluster_name: [CLUSTER_NAME]
cluster_type: hybrid
max_pod_per_node: 250
container_runtime: containerd
app_logs: false
pod_cidr: 192.168.0.0/16
service_cidr: 10.96.0.0/12
cp_vip: 10.200.0.47
ingress_vip: 10.200.0.48
lb_address_pool: 
- 10.200.0.48/28
admin_kubeconfig_path: 
cgw_members: 
- [email id of IAM user or service account]
```

The variables *admin_kubeconfig_path* is not used by the hybrid cluster.


#### 5.5.3 Create Hybrid Cluster

Run below command from workstation node (ansible should be installed on the workstation node) to create the cluster.


```
cd <REPOSITORY_ROOT>/ansible
ansible-playbook create_anthos_cluster.yml
```



### 5.6 Create Standalone Cluster

You can read about the standalone cluster installation [here](https://cloud.google.com/anthos/clusters/docs/bare-metal/1.8/installing/creating-clusters/standalone-cluster-creation).


#### 5.6.1 Standalone Cluster Inventory File

The standalone cluster consists of Control Plane nodes as well as worker nodes. Therefore, the inventory file for a standalone cluster would look like this.


*inventory/hosts.yml*

```
all:
  hosts:
  children:
    workstation:
      hosts:
        10.200.0.7:
    cp_nodes:
      hosts:
        10.200.0.2:
        10.200.0.3:
        10.200.0.4:
    worker_nodes:
      hosts:
        10.200.0.5:
        10.200.0.6:
```



#### 5.6.2 Standalone Cluster Variables

You need to set the _cluster\_type_ and _cluster\_name_ variables in the variable file.  Below is a sample variable file for the standalone cluster using Ubuntu nodes. Replace the values enclosed in square brackets ([]) with actual values relevant to your GCP project and the cluster.



*vars/anthos_vars.yml*

```
login_user: anthos
login_user_group: anthos
login_user_home: /home/anthos
os_type: "ubuntu"
ws_docker: "yes"
gcloud_sdk: "yes"
kubectl_tool: "yes"
bmctl_tool: "yes"
service_accounts: "yes"
bmctl_download_url: gs://anthos-baremetal-release/bmctl/1.8.2/linux-amd64/bmctl
bmctl_workspace_dir: bmctl-workspace
gcp_sa_key_dir: /home/anthos/gcp_keys
local_gcr_sa_name: anthos-gcr-svc-account
local_connect_agent_sa_name: connect-agent-svc-account
local_connect_register_sa_name: connect-register-svc-account
local_cloud_operations_sa_name: cloud-ops-svc-account
ssh_private_key_path: /home/anthos/.ssh/id_rsa
project_id: [PROJECT_ID]
location: [REGION]
cluster_name: [CLUSTER_NAME]
cluster_type: standalone
max_pod_per_node: 250
container_runtime: containerd
app_logs: false
pod_cidr: 192.168.0.0/16
service_cidr: 10.96.0.0/12
cp_vip: 10.200.0.47
ingress_vip: 10.200.0.48
lb_address_pool: 
- 10.200.0.48/28
admin_kubeconfig_path: 
cgw_members: 
- [email id of IAM user or service account]
```

The variables *admin_kubeconfig_path* is not used by the hybrid cluster.


#### 5.6.3 Create Standalone Cluster

Run below command from workstation node (ansible should be installed on the workstation node) to create the cluster.


```
cd <REPOSITORY_ROOT>/ansible
ansible-playbook create_anthos_cluster.yml
```



## 6. Connect Gateway Configuration

You can use Connect Gateway for connecting to the registered clusters and run commands to monitor the workload. You can read more about Connect Gateway [here](https://cloud.google.com/anthos/multicluster-management/gateway).


### 6.1 Configure Connect Gateway

You can configure the Connect Gateway with**connect-gateway** Ansible role. 


*create_anthos_cluster.yml*

```
    - role: connect-gateway
      when: (cgw_members is defined) and (cgw_members != None)
```


This role requires the below variable that contains a list of users and/or service accounts that can connect to the cluster through Connect Gateway.


*vars/anthos_vars.yml*

```
cgw_members: 
- user:[USER_EMAIL_ID]
- serviceAccount:[SERVICE_ACCOUNT_EMAIL_ID]
```



### 6.2 Validate Connect Gateway

Open Cloud Shell from the GCP console after logging in using your Google account.


```
gcloud alpha container hub memberships get-credentials [CLUTER_NAME] --project [PROJECT_ID]
```


where `[CLUSTER_NAME]` is the name of the Anthos cluster and `[PROJECT_ID]` is the Google Cloud Project ID.

Run the below command to verify that you can connect successfully to the Cluster API. 

**NOTE:** your email ID should be added to the CGW configuration.


```
Kubectl get pods -A
```

## 7. Reset Cluster

You can reset the anthos cluster using **reset_anthos_cluster.yml** playbook.

```
cd <REPOSITORY_ROOT>/ansible
ansible-playbook reset_anthos_cluster.yml
```

## 8. Update Kubelet Config

You can update kubelet config of all nodes using **update_kubelet_config.yml** playbook. The playbook currently supports the following kubelet configs and if not provided, [default values](https://kubernetes.io/docs/reference/config-api/kubelet-config.v1beta1/#kubelet-config-k8s-io-v1beta1-KubeletConfiguration) will be used:

* serializeImagePulls
* registryPullQPS
* registryBurst

**NOTE:** This will add `serializeImagePulls`, `registryPullQPS`, and `registryBurst` to kubelet config with default values if it doesn't exists already (but it will not restart kubelet if there's no changes to the config values)\

```
cd <REPOSITORY_ROOT>/ansible
ansible-playbook update_kubelet_config.yml -e "serialize_image_pulls=false registry_pull_qps=5 registry_burst=10"
```
