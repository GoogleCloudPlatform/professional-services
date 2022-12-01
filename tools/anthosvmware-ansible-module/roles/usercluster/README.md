# Ansible Role: usercluster

Installs and configures the User Cluster.

## Requirements

Optionally include the `ais` role to set up the Anthos Identity Service (AIS) with OIDC for user login.

## Role Variables

### User Cluster

Available variables are listed below, along with default values (see `defaults/main.yml`):

```
uc_name: "uc1"
uc_force_uninstall: false
```

Name of the user cluster. This will be the name that shows up in the Google Cloud Console. It will
also be the name that prepends all of the node names created for the user cluster along with a
unique hash (ex: `uc1-p01-5d66697477-rzvj6`).

```
component_access_gcpsa: ""
component_access_gcpsa_path: ""
uc_kubeconfig: "{{ uc_name }}-kubeconfig"
```

Source and destination of component access Google Service Account ("GSA").
Name of user cluster kubeconfig file.

```
# vSphere/vCenter
# uc_vc_fqdn: ""
# uc_vc_username: ""
# uc_vc_password: ""
# uc_vc_credfile: "credential.yaml"
# uc_vc_credentry: "vCenter"
# uc_vc_datacenter: ""
# uc_vc_datastore: ""
# uc_vc_cluster: ""
# uc_vc_network: "" # VM Network
# uc_vc_folder: "" # optional
# uc_vc_respool: "" # if default resourcePool use <uc_vc_cluster>/Resources
# uc_vc_cacertpath: "/home/ubuntu/vcenter.pem" # Default location with automatically downloaded cert file name
```

Settings to access vSphere/vCenter, including object names.
These settings are inherited from the admin cluster by default and can be omitted.

```
# Networking
uc_nw_ipallocmode: "" # dhcp or static
uc_nw_ipfile: "{{ uc_name }}-ip-block.yaml"
uc_nw_gw: "" # gateway
uc_nw_nm: "" # netmask 255.255.255.0 or similar
uc_nw_dns: [""]
uc_nw_ntp: ["ntp.ubuntu.com"]
uc_nw_searchdomains: [""]
uc_nw_servicecidr: "10.96.0.0/20"
uc_nw_podcidr: ""
uc_nw_vc_net: "VM Network"

# values for the file content of network.ipMode.ipBlockFilePath
uc_ipblock_netmask: "255.255.255.0"
uc_ipblock_gateway: "10.20.0.255"
uc_ipblock_ips: ["10.20.0.51","10.20.0.52","10.20.0.53","10.20.0.54"]
```

Network settings.

```
# Load balancing
uc_lb_kind: MetalLB
uc_lb_vips_cp: ""
uc_lb_vips_ingress: ""
uc_lb_metallb_ips: ""
```

Load balancing and VIPs with MetalLB.

```
# masternode sizing
uc_masternode_cpus: 4
uc_masternode_mem: 8192
uc_masternode_replicas: 1
uc_masternode_datastore: ""
```

Master node sizing and number of replicas with default values.
Set replicas to `3` for a highly-available (HA) User Cluster control plane.
Name of vSphere datastore if different from the Admin Cluster.

```
uc_antiaffinitygroups: false
```

Toggle distribution of VMs onto different virtualization hosts.

```
# nodepools
uc_nodepools_name: "{{ uc_name }}-pool-1"
uc_nodepools_cpus: 4
uc_nodepools_mem: 8192
uc_nodepools_replicas: 3
uc_nodepools_osimagetype: ubuntu_containerd
uc_nodepools_vsphere_tags_category: "" # optional and must be precreated in vSphere
uc_nodepools_vsphere_tags_name: "" # optional and must be precreated in vSphere
```

Node pool name, resources, replicas, OS type, and optional vSphere tags, which must be created in advance to be assigned.

```
# GCP project IDs 
uc_stackdriver_projectid: ""
uc_stackdriver_clusterlocation: ""
uc_stackdriver_enablevpc: false
logging_monitoring_gcpsa_path: ""
uc_stackdriver_disablevsphereresourcemetrics: false
uc_gkeconnect_projectid: ""
connect_register_gcpsa_path: ""
uc_cloudauditlogging_projectid: ""
uc_cloudauditlogging_clusterlocation: ""
audit_logging_gcpsa_path: ""
```

Google Cloud Project IDs, region, and GSA paths.

```
uc_autorepair: true
```

Toogle Autorepair feature.

```
# Kubernetes Secrets at-rest encryption
uc_secretsencryption_mode: "GeneratedKey"
uc_secretsencryption_keyversion: 1
```

Enable encryption at-rest of Kubernetes Secrets.

```
# Optional --skip-validation for gkectl
uc_skipvalidations: ""
uc_verbosity: 8
```

Verbosity and option to skip all or specific `gkectl` preflight checks.

### Anthos Service Mesh 

Optionally define the below variables to be used with the ASM install, upgrade, and uninstall playbooks 

```
# Optional: ASM
asm_version: "1.13"
asm_revision: "asm-1137-3"
asm_asmcli_version: "1.13.7-asm.3-config1"
asm_network_id: "uc1-6789"
```
ASM Service Mesh version, revision, and network ID information. 

The available `asmcli` versions for use can be found by using the below command:
```
gsutil ls gs://csm-artifacts/asm/
```

You can filter for a specific revision with `grep`. For example:
```
gsutil ls gs://csm-artifacts/asm/ | grep 1.14
```

> **Note:** `asm_network_id` is used for configuring a multi-cluster mesh. It *must be unique* for proper
service discovery within the mesh. 

```
# ASM - GCP related
asm_gcp_project: "asm-test" # GCP project where user cluster is registered
asm_gcp_project_number: "123456789"
asm_gcpsa_path: "asm-meshconfig.json"
asm_user_email: "asm-sa@asm-test.iam.gserviceaccount.com"
```

Google Cloud Project IDs and GSA information.


### Anthos Config Management

Optionally define the below variables to be used with the ACM install, upgrade, and uninstall playbooks 

```
# Optional: ACM
acm_membership: "{{ uc_name }}" # user cluster name
acm_version: "1.12.1" # version in format #.#.#
```

Anthos Config Management version and membership details. 

```
# ACM - GCP related
acm_gcpproject: "acm-test"
acm_gcpsa_path: "acm-gcpsa.json"
```

Google Cloud Project IDs and GSA information.

```
# ACM - Config Sync
acm_configsync:
  # Set to true to install and enable Config Sync
  enabled: false
  # FORMAT - unstructured, hierarchy
  sourceFormat: unstructured
  # REPO - git repository URL
  syncRepo: ""
  syncBranch: ""
  # TYPE - none, ssh, cookiefile, token, gcpserviceaccount, gcenode
  secretType: gcpserviceaccount
  # If TYPE == gcpserviceaccount, then add its email below
  gcpServiceAccountEmail: acm-sa@acm-test.iam.gserviceaccount.com
  # DIRECTORY - folder in git repository for ACM
  policyDir: ""
  # PREVENT_DRIFT - true, false
  preventDrift: true
acm_root_repo_sshkey: "" # ssh file key if using acm_configsync.secretType: ssh
```
Configuration for enabling ACM Config Sync, including git repo and authentication details.

```
# ACM - PolicyController 
acm_policycontroller:
  # Set to true to install and enable Policy Controller
  enabled: false
```
Configuration for enabling ACM Policy Controller. 

## Dependencies

None.

## Example Playbook
Each user cluster lifecycle operation (ex: installation, upgrade, uninstallation) has its own playbook.

```
# Install User Cluster
- name: "[User Cluster] Installation"
  hosts: all
  gather_facts: false
  roles:
    - usercluster
    - { role: label_membership, when: gcp_labels is defined and (gcp_labels|length > 0) and uc_install|default(true)|bool }
    - { role: ais, when: ais_authentication is defined and (ais_authentication|length > 0) and uc_install|default(true)|bool }
```

## **License**

Copyright 2022 Google LLC. This software is provided as-is, without warranty or representation for any use or purpose.
Your use of it is subject to your agreement with Google.
