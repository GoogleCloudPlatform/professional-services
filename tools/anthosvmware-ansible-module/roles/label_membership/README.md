# Ansible Role: label_membership

Labels the Anthos membership in GCP with custom labels. This role works for both Admin clusters and User clusters.

## Requirements

This role requires the connect register account key and project id where the cluster is registered.
The key is copied to the admin workstation, and project id configured with the following variables:

```YAML
# For Admin Cluster
ac_gkeconnect_projectid: "PROJECT_ID"
connect_register_gcpsa: '{{ lookup("env", "GCPSA_CONREG_FILE") }}'
connect_register_gcpsa_path: "connect-register.json"

# For User Cluster
uc_gkeconnect_projectid: "PROJECT_ID"
connect_register_gcpsa: '{{ lookup("env", "GCPSA_CONREG_FILE") }}'
connect_register_gcpsa_path: "connect-register.json"
```

## Role Variables

Available variables are listed below:

```YAML
gcp_labels:
  example: value
  example2: value2
```

The labels to be configured for the environment in map format.

## Dependencies

None.

## Example Playbook

This role should generally run after the admin cluster or user cluster install, and not during uninstallation.

```YAML
- name: "[ac] Cluster management"
  hosts: all
  gather_facts: False
  roles:
  - admincluster
  - { role: label_membership, when: gcp_labels is defined and (gcp_labels|length > 0) and ac_install|default(true)|bool }
```

## **License**

Copyright 2022 Google LLC. This software is provided as-is, without warranty or representation for any use or purpose.
Your use of it is subject to your agreement with Google.
