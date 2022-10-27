# Ansible Role: asm

Installs and configures Anthos Service Mesh (ASM). Also allows version upgrades.

## Requirements

No special requirements.

## Role Variables

Available variables are listed below, along with default values (see `defaults/main.yml`):

```
asm_install: True
asm_version: "1.13"
asm_minor_version: "1.13.7-asm.3"
asm_revision: "asm-1137-3" # dynamically determined during Ansible execution
asm_asmcli: "asmcli" # installation script name
asm_asmcli_url: "https://storage.googleapis.com/csm-artifacts/asm"
asm_asmcli_version: "1.13.7-asm.3-config1" # full version including the revision
asm_cluster_name: "{{ uc_name }}"
asm_temp: "/tmp/{{ asm_cluster_name }}"
asm_out_dir: "{{ asm_temp }}/asm-{{ asm_version }}" # local directory where ASM artifacts are downloaded and hydrated
```

Install/uninstall toggle, version, script name, source and destination.

```
# GCP related
asm_gcp_project: "" # GCP project where user cluster is registered
asm_gcp_project_number: ""
asm_mesh_id: "proj-{{ asm_gcp_project_number }}" # consists of proj-[GCP Project Number]
asm_gcpsa: '{{ lookup("env", "GCPSA_ASMCFG_FILE") }}'
asm_gcpsa_path: "asm-meshconfig.json"
asm_user_email: ""
```

Google Cloud Project ID and number, ASM Mesh ID, Google Service Account source and destination file name, and admin user email.

```
# Mesh config related
asm_kubeconfig: "{{ yamldestpath }}/{{ asm_cluster_name }}-kubeconfig" # absolute path to user cluster kubeconfig
asm_ingress_namespace: "asm-ingress" # Namespace the Ingress Gateways will get deployed in
asm_network_id: "" # Mesh network ID. Must be unique and non-numeric for multi-cluster mesh to work
```

Path to User Cluster `kubeconfig` file.
Name of ASM Ingress Gateway Kubernetes namespace.
ASM network ID, especially relevant for multi-cluster meshes with East-West gateways.

```
# Offline mode related
asm_offline_mode: False
asm_offline_bundle_file: "asm-1.13.tar.gz"
```

Required when using an ASM offline bundle.

During ASM installation, the`asmcli` install script downloads `kpt` and `asm` packages from the below endpoints:
* `github.com/GoogleCloudPlatform/anthos-service-mesh-packages`
* `github.com/GoogleContainerTools/kpt/releases/download`

However, these requests are redirected to a different domain - namely, `githubusercontent.com`. 

An offline bundle can be used if the Admin Workstation has restricted access to any of these endpoints (or if a user simply has the desire to use a predownloaded bundle). With an offline bundle, the asmcli installation packages must be downloaded, bundled in a .tar file, and made available to the jumphost where the Ansible playbook run. Ideally, the .tar file is uploaded to an accessible git repo to ensure there is a singular and centralized location for its content. 

Once available in an accessible and centralized location, the jumphost running the automation scripts can download the file for use. Currently, the automation code expects the .tar file to be downloaded into the `/roles/asm/files/` directory. Then, during ASM installation, the above fields would be used to configure the installation to use the bundled package instead of reaching out to Github - therefore, bypassing the requests to the Github domains. 

```
# OPTIONAL: CERTIFICATE RELATED - Set the flag to True and define the following cert variables to install cert
asm_install_cert: False
# define cert destination paths
asm_ca_cert_path: "{{ asm_temp }}/ca-cert.pem"
asm_ca_key_path: "{{ asm_temp }}/ca-key.pem"
asm_root_cert_path: "{{ asm_temp }}/root-cert.pem"
asm_cert_chain_path: "{{ asm_temp }}/cert-chain.pem"
# define cert source files
asm_cacert_file: '{{ lookup("env", "ASM_CACERT_FILE") }}'
asm_cakey_file: '{{ lookup("env", "ASM_CAKEY_FILE") }}'
asm_rootcert_file: '{{ lookup("env", "ASM_ROOTCERT_FILE") }}'
asm_certchain_file: '{{ lookup("env", "ASM_CERTCHAIN_FILE") }}'
```

Optionally, use Istio CA (citadel) and provide certificate material.
Assumes the same Root CA is used for a multi-cluster mesh setup.

```
# Optional: Upgrade completion task related
asm_upgrade_completion: False # pass this as command-line argument to playbook asm_upgrade.yml
asm_old_revision: "" # set this to previous revision of ASM installed in the cluster
```

Upgrade toggle.

```
# Optional: private registry
asm_registry_url: "{{ glb_privatereg_url if glb_privatereg_url is defined else '' }}" # set to private registry used for container images

# Optional: private registry, ASM hardcoded image paths in configs
asm_csc_tag: "1.12.2-asm.0" # tag used for canonical-service-controller image
asm_kubebuilder_tag: "v0.5.0" # tag used for kubebuilder/kube-rbac-proxy image
```

Private container registry parameters.

> **Private Container Registry Disclaimer:** The custom overlay file entry (`spec.hub` in `roles/asm/templates/control-plane-config.yaml.j2`) is configured to replace most of the public image references used to install ASM with images from the configured private registry. However, there are two images that are hardcoded in the ASM implementation at time of this automation's release (v1.14.0). These images are replaced with specific tasks in the automation. These images are:
>* `gcr.io/gke-release/asm/canonical-service-controller:1.10.3-asm.16`
>* `gcr.io/kubebuilder/kube-rbac-proxy:v0.5.0`
>
>A feature request has been opened with the ASM product team to parameterize these images (like the other images used) so that they can also be replaced with the custom overlay.

## Dependencies

- `usercluster` role

## Example Playbook

```
- name: "[asm] Install Anthos Service Mesh"
  hosts: all
  gather_facts: false
  roles:
    - asm
```

## **License**

Copyright 2022 Google LLC. This software is provided as-is, without warranty or representation for any use or purpose.
Your use of it is subject to your agreement with Google.
