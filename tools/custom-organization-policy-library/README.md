# Custom Organization Policy Library
## Overview

This repository provides a library of custom organization policy constraints and samples. It includes tools to easily generate policies for provisioning across your organization using either Google Cloud (gcloud) or Terraform.

For a detailled list of the policies developed, please refer [here](./docs/index.md). 

The library contains more than 100 constraints, including implementation n of policies for these bundles:
- CIS for GCP v3.0
- CIS for GKE v1.5
- PCI-DSS v4.0

For more information on how Custom Organization Policies (CuOP) can help secure your environment, please refer to the  [Google Cloud documentation](./https://cloud.google.com/resource-manager/docs/organization-policy/creating-managing-custom-constraints).

## Setting up environment 
You can quickly set up your environment to manage the CuOP library using [ytt](https://carvel.dev/ytt/).

### Install via script (macOS or Linux)
Install ytt into specific directory. Note that install.sh script installs other Carvel tools as well. For more detail instruction, you can check [here](https://carvel.dev/ytt/docs/latest/install/)
```bash
mkdir local-bin/
curl -L https://carvel.dev/install.sh | K14SIO_INSTALL_BIN_DIR=local-bin bash
export PATH=$PWD/local-bin/:$PATH
ytt version
```

### Install binaries via Homebrew (macOS or Linux) 
Require Homebrew to be installed
```bash
brew tap carvel-dev/carvel
brew install ytt
ytt version
```
For more details about other type of installation, please refer to official documentation [here](https://carvel.dev/ytt/docs/latest/install/)

### Install 
```bash
python3 -m venv venv
source venv/bin/activate
python3 -m pip install -r scripts/requirements.txt
python3 -m pip install -r tests/requirements.txt
npm install --global prettier # Install prettier globally for formatting YAML file
```

## Organization of the repository
The repository is organized as follows:
- `build`: Contains configuration files and the ytt library used to generate final constraints and policies.
- `docs`: Contains documentation related to this tool.
- `samples`: Contains the generated constraints and policies.
- `scripts`: Contains scripts used for policy generation.

Here's a visual representation:
```
$ tree -d -L 4
.
├── build
│   ├── config
│   │   └── services
│   ├── custom-constraints
│   │   ├── compute
│   │   ├── dataproc
│   │   ├── firewall
│   │   ├── gke
│   │   ├── network
│   │   └── storage
│   ├── org-policies
│   └── ytt_lib
├── docs
├── samples
│   ├── gcloud
│   │   ├── constraints
│   │   │   ├── compute
│   │   │   ├── dataproc
│   │   │   ├── firewall
│   │   │   ├── gke
│   │   │   ├── network
│   │   │   └── storage
│   │   └── policies
│   │       ├── compute
│   │       ├── dataproc
│   │       ├── firewall
│   │       ├── gke
│   │       ├── network
│   │       └── storage
│   └── tf
│       ├── custom-constraints
│       └── custom-policies
└── scripts
```

## Generating Constraint and Policies
`ytt` is a command-line tool for templating and patching YAML files. It simplifies the creation of YAML files for constraints and policies.  
The scripts in this repository further streamline the process for various organization structures.

Steps to Generate:

**1. Configure Generation Settings**
- Define organization-specific settings (organization ID, bundles to enable, custom constraint parameters) in the values.yaml file.
  
**2. Generate Constraints and Policies**
- Use `make build` for gcloud format.
- Use `make build-tf` for Terraform Cloud Foundation Fabric module format.
  
**3. Provision Constraints and Policies**
- Use `make deploy-constraints` and `make deploy-policies` (or `make deploy` for both) to apply the generated files to your organization.

### 1. Configure Generation Settings
To generate constraints and policies, it is expected to provide the good configuration values.
Those configuration settings are specific to an organization such as organization id, bundles to be enabled, custom constraints parameters (when needed) to use.
Those settings needs to be defined in the `values.yaml` file.

#### General settings

| Settings                      | Defaut value | Description                                                                           |
|-------------------------------|--------------|---------------------------------------------------------------------------------------|
| organization                  | 111111       | Organization ID used for the generation of constraints and policies                   |
| bundles                       |              | Represents whether only constraint of a specific bundles have to be generated         |
| bundles.pci_dss               | false        | Generate only constraints that are part of PCI-DSS 4.0 recommendations for GKE        |
| bundles.cis                   | false        | Generate only constraints that are part of CIS Benchmark v1.5 for GKE recommendations |
| dryrun                        | false        | Generate policies with mode dryrun enabled                                            |

Example of values.yaml
```
organization: '11111111'
bundles:
 pci-dss: false
 cis: true
dryrun: false
```

#### Constraint parameters settings
It might happens that some constraints might required some parameters (e.g. allowed disk types, allowed machine types). For those specific constraints, it is expected to provide the settings in the `values.yaml` file.

Example of values.yaml with parameters provided for generation
```
organization: '11111111'
bundles:
  pci-dss: false
  cis: false
dryrun: false
compute:
  computeAllowedInstanceMachineTypes:
    params:
      machine_types:
      - "n2-standard-1"
      - "n2-standard-2"
  computeAllowedInstanceLabels:
    params:
      labels:
      - "label-0"
      - "label-1"
  computeAllowedDiskTypes:
    params:
      disk_types:
      - "pd-ssd"
      - "pd-standard"
```


### 2. Generate the constraints and policies
To generate policies and constraints, use the following command which will generated both constraints and policies.
By default, generation of constraints and policies requires to be executed with gcloud command. 
Integration with Terraform is also possible and shared below.

#### Gcloud format
```
make build
```
The different configurations files are generated in the `samples/gcloud` folder.

#### Terraform with Cloud Foundation Fabric module format
This is possible to generate constraints and policies in a format that is understandable by Cloud Foundation Fabric module.
Here is the list of the different modules than can be used:
- Organization module: https://github.com/GoogleCloudPlatform/cloud-foundation-fabric/tree/master/modules/organization
- Folder module: https://github.com/GoogleCloudPlatform/cloud-foundation-fabric/tree/master/modules/folder
- Project module: https://github.com/GoogleCloudPlatform/cloud-foundation-fabric/tree/master/modules/project

In those modules, organization policies can be loaded from a directory containing YAML files where each file defines one or more constraints. 
The example below deploys a few organization policies using YAML files for definitions.

```
module "project" {
  source          = "./fabric/modules/project"
  billing_account = var.billing_account_id
  name            = "project"
  parent          = var.folder_id
  prefix          = var.prefix
  factories_config = {
    org_policies = " samples/tf/custom-policies"
  }
}
```
Organization policy custom constraints can be loaded from a directory containing YAML files where each file defines one or more custom constraints. 
The example below deploys a few organization policy constraints using YAML files for definitions.
```
module "org" {
  source          = "./fabric/modules/organization"
  organization_id = var.organization_id
  factories_config = {
    org_policy_custom_constraints = "samples/tf/custom-constraints"
  }
}
```
```
make build-tf
```
The different configurations files are generated in the `samples/tf` folder.

#### Available Commands
For more precise controls on what to be generated, you can use of the following commands defined in the Makefile.

```
make constraints                    Build constraints based using gcloud format
make constraints-tf                 Build constraints based using Terraform Cloud Foundation Fabric module factory 
make policies                       Build policies based using gcloud format
make policies-tf                    Build policies based using Terraform Cloud Foundation Fabric module factory 
make build                          Build constraint and policies using gcloud format
make build-tf                       Build constraint and policies using Terraform Cloud Foundation Fabric module factory
make all                            Build constraint and policies using gcloud and Terraform Cloud Foundation Fabric module factory format
make deploy-constraints             Deploy constraints based using gcloud format
make deploy-policies                Deploy policies based using gcloud format
make deploy                         Deploy both constraints and policies based using gcloud format
make simulate                       Run a script to detect violations of Custom Organization Policies with exiting infrastructure
make config                         Generate to standard output the list of values used to generate constraints and policies
```

### 3. Provision the constraints and policies
Once the policies and constraints generation is done, this is possible to deploy those constraints and policies to the organization infrastructure.
Provisionning with `gcloud` command can be done by using following commands.

**Provisionning the constraints**
```
$ make deploy-constraints
...
---------------
Processing file: samples/gcloud/constraints/gke/gkeRequireRegionalClusters.yaml
Constraint samples/gcloud/constraints/gke/gkeRequireRegionalClusters.yaml set successfully.
---------------
Processing file: samples/gcloud/constraints/gke/gkeRequireSecureBoot.yaml
Constraint samples/gcloud/constraints/gke/gkeRequireSecureBoot.yaml set successfully.
---------------
...
```

**Provisionning the policies**
```
$ make deploy-policies
...
---------------
Processing file: samples/gcloud/policies/gke/custom.gkeRequireRegionalClusters.yaml
Policy samples/gcloud/policies/gke/custom.gkeRequireRegionalClusters.yaml set successfully.
---------------
Processing file: samples/gcloud/policies/gke/custom.gkeRequireSecureBoot.yaml
Policy samples/gcloud/policies/gke/custom.gkeRequireSecureBoot.yaml set successfully.
---------------
...
```

#### Using dry-run mode
To use dry-run mode set the boolean for dryrun in **values.yaml** file to true and regenerate the policy. 

Example of how to set dryrun to true
```
#@data/values
---
organization: '11111111'
bundles:
  pci-dss: false
  cis: false
dryrun: true
```

## Troubleshooting
### Too many constraints per resource type
In case you are getting the following errors, this is because you the number of constraints created are more than 20. 
Current workaround is to merge logic of multiples constraints in a single constraint to limit the number of constraints.
```
ERROR: (gcloud.org-policies.set-custom-constraint) INVALID_ARGUMENT: Cannot create a new custom constraint for resource type container.googleapis.com/Cluster. Only 20 custom constraints can be created for a specific resource type.
- '@type': type.googleapis.com/google.rpc.DebugInfo
  detail: '[ORIGINAL ERROR] generic::invalid_argument: com.google.apps.framework.request.BadRequestException:
    Cannot create a new custom constraint for resource type container.googleapis.com/Cluster.
    Only 20 custom constraints can be created for a specific resource type. [google.rpc.error_details_ext]
    { message: "Cannot create a new custom constraint for resource type container.googleapis.com/Cluster.
    Only 20 custom constraints can be created for a specific resource type." }'
```

## Developing a CuOP constraint

If this library doesn't contain a constraint that matches your use case, you can develop a new one using the [Adding Custom Organization Policy Guide](./docs/adding_cuop.md).
