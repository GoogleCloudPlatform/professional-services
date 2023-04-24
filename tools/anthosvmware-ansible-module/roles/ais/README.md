# Ansible Role: ais

Installs and configures the Anthos Identity Service (AIS).

## Requirements

No special requirements.

## Role Variables

Available variables are listed below, along with default values (see `defaults/main.yml`):

```yaml
ais_kubeconfig: "{{ uc_name + '-kubeconfig' if uc_name is defined else 'kubeconfig' }}"
ais_patch_file: "{{ uc_name + '-ais-patch.yaml' if uc_name is defined else 'admin-ais-patch.yaml' }}"
ais_login_config_file: "{{ uc_name + '-login-config.yaml' if uc_name is defined else 'admin-login-config.yaml' }}"
```

Admin or User cluster `kubeconfig` file name.
AIS patch file for its Kubernetes resource.
File name for the cluster login config file.

```yaml
# OIDC auth values
ais_oidc_clientid: '{{ lookup("env", "AIS_OIDC_CLIENTID") }}'
ais_oidc_clientsecret: '{{ lookup("env", "AIS_OIDC_CLIENTSECRET") }}'
```

OIDC Client ID and Client secret values to be used in AIS configuration.

```yaml
# AIS configuration
ais_authentication:
- name: oidc-ad
  oidc:
    clientID: '{{ ais_oidc_clientid }}'
    clientSecret: '{{ ais_oidc_clientsecret }}'
    cloudConsoleRedirectURI: ""
    extraParams: prompt=consent,access_type=offline
    issuerURI: ""
    kubectlRedirectURI: ""
    scopes: ""
    userClaim: ""
```

AIS configuration block that will be added to the cluster ClientConfig.

```yaml
# GCP related
ais_gcpsa: '{{ lookup("env", "GCPSA_AIS_FILE") }}'
ais_gcpsa_path: "ais-to-gcs.json"
ais_gcsbucket: 'gs://{{ lookup("env", "AIS_GCS_BUCKET") }}'
```

Optionally, reference a Google Service Account with privileges to write to an existing Google Cloud Storage bucket
to store the AIS cluster login config file.

## Dependencies

- `admincluster` role, or
- `usercluster` role

## Example Playbook

This role typically runs after the Admin or User Cluster installation.
The example below shows the `ais` role after the `admincluster` role.

```yaml
# Configure the Anthos Identity Service
- name: "[ais] Configuration"
  hosts: all
  gather_facts: false
  roles:
    - ais
```

## **License**

Copyright 2022 Google LLC. This software is provided as-is, without warranty or representation for any use or purpose.
Your use of it is subject to your agreement with Google.
