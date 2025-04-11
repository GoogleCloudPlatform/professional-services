# Custom Module for Security Health Analytics Library
## Overview

This repository provides a library of custom module for security health analytics (SHA) and samples. It includes tools to easily provision custom modules on your organization using gcloud.
For more information on how Custom Module for Security Health Analytics (Custom Module for SHA) can help secure your environment, please refer to the  [Google Cloud documentation](https://cloud.google.com/security-command-center/docs/custom-modules-sha-overview).

**Custom Module for Security Health Analytics is available only with the Security Command Center Premium tier.**

## Setting up environment 
You can quickly set up your environment to manage the Custom Module for SHA library using [ytt](https://carvel.dev/ytt/).

### Install via script (macOS or Linux)
Install ytt into specific directory. Note that install.sh script installs other Carvel tools as well. For more detail instruction, you can check [here](https://carvel.dev/ytt/docs/latest/install/)
```bash
mkdir local-bin/
curl -L https://carvel.dev/install.sh | K14SIO_INSTALL_BIN_DIR=local-bin bash
export PATH=$PWD/local-bin/:$PATH
ytt version
```

Install yq following [those instructions](https://github.com/mikefarah/yq/#install)

### Install binaries via Homebrew (macOS or Linux) 
Require Homebrew to be installed
```bash
brew tap carvel-dev/carvel
brew install ytt
ytt version

brew install yq
```
For more details about other type of installation, please refer to official documentation [here](https://carvel.dev/ytt/docs/latest/install/)

## Organization of the repository
The repository is organized as follows:
- `build`: Contains configuration files and the ytt library used to generate final custom modules.
- `docs`: Contains documentation related to this tool.
- `samples`: Contains the generated custom modules.
- `scripts`: Contains scripts used for deployment of custom modules.

Here's a visual representation:
```
$ tree -d -L 4
.
├── build
│   ├── config
│   │   └── services
│   ├── custom-sha
│   │   ├── artifactregistry
│   │   ├── bigquery
│   │   ├── cloudfunctions
│   │   ├── cloudkms
│   │   ├── cloudresourcemanager
│   │   ├── cloudrun
│   │   ├── cloudsql
│   │   ├── compute
│   │   ├── gke
│   │   ├── logging
│   │   ├── secretmanager
│   │   └── serviceUsage
│   └── ytt_lib
├── docs
├── samples
│   └── gcloud
│       └── custom-sha
│           ├── artifactregistry
│           ├── bigquery
│           ├── cloudfunctions
│           ├── cloudkms
│           ├── cloudresourcemanager
│           ├── cloudrun
│           ├── cloudsql
│           ├── compute
│           ├── gke
│           ├── logging
│           ├── secretmanager
│           └── serviceUsage
└── scripts
```

## Generating Custom Modules for SHA
`ytt` is a command-line tool for templating and patching YAML files. It simplifies the creation of YAML files for custom modules.  
The scripts in this repository further streamline the process for various organization structures.

Steps to Generate:

**1. Configure Generation Settings**
- Define organization-specific settings (organization ID, bundles to enable, custom module parameters) in the values.yaml file.
  
**2. Generate Custom Modules**
- Use `make build` for gcloud format.
  
**3. Provision Custom Modules**
- Use `make deploy` to apply the generated files to your organization.

### 1. Configure Generation Settings
To generate custom modules, it is expected to provide the good configuration values.
Those configuration settings are specific to an organization such as organization id, bundles to be enabled, custom modules parameters (when needed) to use.
Those settings needs to be defined in the `values.yaml` file.

#### General settings

| Settings                      | Defaut value | Description                                                                              |
|-------------------------------|--------------|------------------------------------------------------------------------------------------|
| organization                  | 111111       | Organization ID used for the generation of custom module                                 |
| bundles                       |              | Represents whether custom module of a specific bundles have to be generated              |
| bundles.pci_dss               | false        | Generate only custom modules that are part of PCI-DSS 4.0 recommendations for GKE        |
| bundles.cis                   | false        | Generate only custom modules that are part of CIS Benchmark v1.5 for GKE recommendations |

Example of values.yaml
```
organization: '11111111'
bundles:
 pci-dss: false
 cis: true
```

#### Custom Module parameters settings
It might happens that some custom modules requires some parameters (e.g. allowed locations, allowed VPN projects). For those specific modules, it is expected to provide the settings in the `values.yaml` file.

Example of values.yaml with parameters provided for generation
```
organization: '11111111'
bundles:
  pci-dss: false
  cis: false
cloudresourcemanager:
  cloudresourcemanagerRequiredProjectLabels:
    params:
      labels:
      - "bu"
      - "app"
      - "env"
cloudrun:
  cloudrunAllowedDomainMapping:
    params:
      domains:
      - "mydomain.com"
      - "mysite.com"
cloudsql:
  cloudsqlAllowedDatabaseEngineVersions:
    params:
      database_versions:
      - "MYSQL_8_0"
      - "POSTGRES_17"
      - "SQLSERVER_2022_WEB"
```


### 2. Generate the custom modules
By default, generation of custom modules require to be executed with gcloud command. 
Integration with Terraform is not possible for now.

#### Gcloud format
```
make build
```
The different configurations files are generated in the `samples/gcloud` folder.


#### Available Commands
For more precise controls on what to be generated, you can use of the following commands defined in the Makefile.

```
make sha                            Build custom module for SHA using gcloud format
make build                          Build custom module for SHA using gcloud format
make deploy-sha                     Deploy custom module to organization level using gcloud format
make deploy                         Build and deploy custom module based using gcloud format
```

### 3. Provision the custom modules
Once the custom module generation is done, this is possible to deploy those custom modules to the organization infrastructure.
Provisionning with `gcloud` command can be done by using following commands.

**Provisionning the custom modules**
```
$ make deploy
...
---------------
Processing file: samples/gcloud/custom-sha//artifactregistry/artifactregistryRequireCMEK.yaml (Action: sha)
Checking for existing SHA Custom Module with display name 'artifactregistryRequireCMEK' under --organization=1111111111...
SHA Custom Module 'organizations/1111111111/securityHealthAnalyticsSettings/customModules/1234' updated successfully from 'samples/gcloud/custom-sha//artifactregistry/artifactregistryRequireCMEK.yaml'.
---------------
Processing file: samples/gcloud/custom-sha//bigquery/bigqueryAllowedTableExpiration.yaml (Action: sha)
Checking for existing SHA Custom Module with display name 'bigqueryAllowedTableExpiration' under --organization=741724935092...
SHA Custom Module 'organizations/1111111111/securityHealthAnalyticsSettings/customModules/12345' updated successfully from 'samples/gcloud/custom-sha//bigquery/bigqueryAllowedTableExpiration.yaml'.
---------------
...
```

## Developing a custom module for SHA

If this library doesn't contain a custom module that matches your use case, you can develop a new one using the [Adding Custom Module for Security Health Analytics Guide](./docs/adding_custom_module_sha.md).
