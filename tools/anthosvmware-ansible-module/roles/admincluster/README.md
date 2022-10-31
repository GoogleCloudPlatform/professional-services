# Ansible Role: admincluster

Installs and configures the Admin Cluster.

## Requirements

Optionally include the `ais` role to set up the Anthos Identity Service (AIS) with OIDC for user login.

## Role Variables

Available variables are listed below, along with default values (see `defaults/main.yml`):

```
ac_name: "ac01" # Name of admin cluster
ac_install: true
```

Name, version, and install/uninstall toggle.

```
component_access_gcpsa: ""
component_access_gcpsa_path: ""
```

Creates a unique folder to temporary store all Google Service Account (GSA) JSON key files.
Source and destination of the component access GSA.

```
# vSphere/vCenter
ac_vc_fqdn: ""
ac_vc_username: ""
ac_vc_password: ""
ac_vc_credfile: "credential.yaml"
ac_vc_credentry: "vCenter"
ac_vc_datacenter: ""
ac_vc_datastore: ""
ac_vc_cluster: ""
ac_vc_folder: "" # optional
ac_vc_respool: "" # if default resourcePool use <ac_vc_cluster>/Resources
ac_vc_cacertpath: "/home/ubuntu/vcenter.pem" # Default location with automatically downloaded cert file name
# for vSAN: ac_vc_datadisk must be created inside a folder when using vSAN. Folder must be created manually
ac_vc_datadisk: "{{ ac_name }}-admin-cluster.vmdk"
```

The vSphere/vCenter specific settings, including credentials and object names.

```
# Networking
ac_nw_ipallocmode: "" # dhcp or static
ac_nw_ipfile: "{{ ac_name }}-ip-block.yaml"
ac_nw_gw: "" # gateway
ac_nw_nm: "" # netmask 255.255.255.0 or similar
ac_nw_ntp: ["",""] # list from group_vars/all
ac_nw_dns: ["","",""] # list of DNS servers
ac_nw_searchdomains: [""] # list from group_vars/all
ac_nw_servicecidr: "10.96.232.0/24"
ac_nw_podcidr: "192.168.0.0/16"
ac_nw_vc_net: "VM Network"

# values for the file content of network.ipMode.ipBlockFilePath
ac_ipblock_netmask: 255.255.255.0
ac_ipblock_gateway: a.b.c.d
ac_ipblock_ips: [""]
```

Network settings.

```
# Load balancing
ac_lb_kind: MetalLB
ac_lb_vips_cp: ""
ac_lb_vips_addons: ""
```

Load balancing and VIPs.
Options for load balancing is limited to MetalLB

```
# masternode sizing
ac_masternode_cpus: 4
ac_masternode_mem: 8192
```

Master node sizing with above default values.

```
ac_antiaffinitygroups: true
```

Toggle distribution of VMs onto different virtualization hosts.


```
# GCP project IDs
ac_stackdriver_projectid: ""
ac_stackdriver_clusterlocation: ""
ac_stackdriver_enablevpc: false
logging_monitoring_gcpsa_path: ""
ac_stackdriver_disablevsphereresourcemetrics: false
ac_gkeconnect_projectid: ""
connect_register_gcpsa_path: ""
ac_cloudauditlogging_projectid: ""
ac_cloudauditlogging_clusterlocation: ""
audit_logging_gcpsa_path: ""
```

Google Cloud Project IDs, regions, and GSA file paths.

```
ac_autorepair: true
```

Toggle the Autorepair feature.

```
# Kubernetes Secrets at-rest encryption
ac_secretsencryption_mode: "GeneratedKey" # optional
ac_secretsencryption_keyversion: 1 # optional
```

Enable encryption at-rest for Kubernetes Secrets.

```
# optional --skip-validation for gkectl
ac_skipvalidations: ""
ac_verbosity: 5
```

Verbosity of `gkectl` command outputs and skipping all or specific validation preflight checks.

## Dependencies

None.

## Example Playbook

```
- name: "[Admin Cluster] Installation"
  hosts: all
  gather_facts: False
  roles:
  - admincluster
  - { role: ais, when: ais_authentication is defined and (ais_authentication|length > 0) and ac_install|default(true)|bool }
```

## **License**

Copyright 2022 Google LLC. This software is provided as-is, without warranty or representation for any use or purpose.
Your use of it is subject to your agreement with Google.
