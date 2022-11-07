# Ansible Role: adminws

Install and configure the Admin Workstation. Can also uninstall and upgrade the Admin Workstation.

## Requirements

No special requirements.

## Role Variables

Available variables are listed below, along with default values (see `defaults/main.yml`):

```YAML
ssh_auth_key_priv: ""
ssh_auth_key_priv_path: "/home/user/.ssh/x_id_ed25519"
ssh_auth_key: ""
ssh_auth_key_path: "{{ ssh_auth_key_priv_path }}.pub"
```

SSH public/private key on the jump host to use for the admin workstation creation.

```YAML
adminws_install: true
```

Whether to install `true` or uninstall `false`.

```YAML
adminws_name: ""
```

Name of the Admin Workstation. This name shows as the VM-name in the vSphere web interface.

```YAML
component_access_gcpsa_path: "component-access.json"
```

Destination file name of the Anthos component access Google Service Account on the build server / jump host from which the Admin Workstation is being build.

```YAML
# vSphere/vCenter
adminws_vc_fqdn: '{{ lookup("env", "VMWARE_HOST") }}'
adminws_vc_credfile: "credential.yaml"
adminws_vc_credentry: "vCenter"
adminws_vc_datacenter: ""
adminws_vc_datastore: ""
adminws_vc_cluster: ""
adminws_vc_network: "" # VM Network
adminws_vc_folder: "" # optional
adminws_vc_respool: "" # if default resourcePool use <adminws_vc_cluster>/Resources
adminws_vc_cacertpath: "{{ yamldestpath }}/vcenter.pem" # Location for automatically downloaded CA cert
adminws_datadiskname: "" # <name>-gke-on-prem-admin-workstation-data-disk/<name>-gke-admin-ws-data-disk.vmdk
adminws_rootdisk_gb: "100"
adminws_homedisk_mb: "512"
```

The vSphere/vCenter-specific settings specify how to connect and with what credentials.
It includes the validation of the vSphere TLS certificate material, the vSphere object names, and
the file name of the Admin Workstation data disk.
Uses Ansible `lookup` to read sensitive information from injected environment variables.
This way, you can use AWX or Ansible Tower Vault to securely consume secrets.

```YAML
# Networking
adminws_nw_ipallocmode: "" # dhcp or static
adminws_nw_ip: "" # IP address of VM
adminws_nw_gw: "" # gateway
adminws_nw_nm: "" # netmask 255.255.255.0 or similar
adminws_nw_dns: [""]
adminws_ntp: "" # only one can be set default ntp.ubuntu.com
```

Network settings.

```YAML
adminws_skipvalidations: ""
# adminws_skipvalidations: "--skip-validation"
```

Skip validation checks for temporary workarounds in the deployment environment.

## Dependencies

None.

## Example Playbook

```YAML
- name: "[adminws] Installation"
  hosts: adminws
  gather_facts: false
  roles:
    - adminws
```

## **License**

Copyright 2022 Google LLC. This software is provided as-is, without warranty or representation for any use or purpose.
Your use of it is subject to your agreement with Google.
