# Monitoring Alert Library

## Overview

This repository provides a library of monitoring alerts and samples. It includes tools to easily provision monitoring alerts on your organization using gcloud.

For more information on how Monitoring Alert can help secure your environment and being notified when certain event happens, please refer to the [Google Cloud documentation](https://cloud.google.com/logging/docs/alerting/log-based-alerts).

## Setting up environment

You can quickly set up your environment to manage the Monitoring Alert for the library using [ytt](https://carvel.dev/ytt/).

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

- `build`: Contains configuration files and the ytt library used to generate final monitoring alerts.
- `docs`: Contains documentation related to this tool.
- `samples`: Contains the generated monitoring alerts.
- `scripts`: Contains scripts used for deployment of monitoring alerts.
- `tests`: Contains tests to ensure Cloud Logging queries worked as expected.

Here's a visual representation:

```txt
$ tree -d -L 3
.
├── build
│   ├── alerts
│   ├── config
│   └── ytt_lib
├── docs
├── samples
│   └── gcloud
│       └── alerts
├── scripts
└── tests
    └── test_cases
        ├── cloudsql
        ├── firewall
        ├── iam
        ├── network
        ├── project
        └── storage
```

## Generating Monitoring Alerts

`ytt` is a command-line tool for templating and patching YAML files. It simplifies the creation of YAML files for monitoring alerts.
The scripts in this repository further streamline the process for various organization structures.

Steps to Generate:

1. **Configure Generation Settings**

   - Define organization-specific settings (organization ID, bundles to enable, alert parameters) in the values.yaml file.

2. **Generate Monitoring Alerts**

   - Use `make build` for gcloud format.

3. **Provision Monitoring Alerts**
   - Use `make deploy` to apply the generated alerts to your organization.

### 1. Configure Generation Settings

To generate monitoring alerts, it is expected to provide the good configuration values.
Those configuration settings are specific to an organization such as organization id, bundles to be enabled, monitoring alerts parameters (when needed) to use.
Those settings needs to be defined in the `values.yaml` file.

#### General settings

| Settings               | Default value | Description                                                                                 |
| -----------------------| ------------- | ------------------------------------------------------------------------------------------- |
| organization           | 111111        | Organization ID used for the generation of alert                                            |
| project                | my-project    | Project ID used to deploy the generated alerts to                                           |
| bundles                |               | Represents whether custom module of a specific bundles have to be generated                 |
| bundles.pci_dss        | false         | Generate only monitoring alerts that are part of PCI-DSS 4.0 recommendations for GKE        |
| bundles.cis            | false         | Generate only monitoring alerts that are part of CIS Benchmark v3.0 for GCP recommendations |
| notification_channels  |               | List of notification channels to publish alert to                                           |

Example of values.yaml

```yaml
organization: "11111111"
project: "my-project"
bundles:
  pci-dss: false
  cis: true
notification_channels:
  - projects/my-project/notificationChannels/11111111111111
```

#### Monitoring Alert parameters settings

It might happens that some monitoring alerts requires some parameters (e.g. allowed locations, allowed VPN projects). For those specific modules, it is expected to provide the settings in the `values.yaml` file.

Example of values.yaml with parameters provided for generation

```yaml
organization: "11111111"
bundles:
  pci-dss: false
  cis: false
alerts:
  myCustomAlerts:
    params:
      labels:
        - "bu"
        - "app"
        - "env"
```

### 2. Generate the monitoring alerts

By default, generation of monitoring alerts require to be executed with gcloud command.
Integration with Terraform is not possible for now.

#### Gcloud format

```bash
make build
```

The different configurations files are generated in the `samples/gcloud` folder.

#### Available Commands

For more precise controls on what to be generated, you can use of the following commands defined in the Makefile.

```bash
make alerts                         Build monitoring alerts using gcloud format
make build                          Build monitoring alerts using gcloud format
make deploy-alerts                  Deploy monitoring alerts to a project using gcloud format
make deploy                         Build and deploy monitoring alerts based using gcloud format
```

### 3. Provision the monitoring alerts

Once the custom module generation is done, this is possible to deploy those monitoring alerts to the organization infrastructure.
Provisioning with `gcloud` command can be done by using following commands.

#### Provisioning the monitoring alerts

```bash
$ make deploy
rm -rf samples/gcloud
rm -rf samples/gcloud/alerts
ytt -f build/config/schema.yaml -f values.yaml -f build/ytt_lib/ -f build/alerts/  --output-files samples/gcloud/alerts
creating: samples/gcloud/alerts/projectOwnershipChange.yaml
sh scripts/deploy.sh  my-project  samples/gcloud/alerts
Starting monitoring policy deployment...
Project ID: my-project
Policy Folder: samples/gcloud/alerts
=========================================
Searching in directory: samples/gcloud/alerts
---------------
Processing file: samples/gcloud/alerts/projectOwnershipChange.yaml for project my-project
Found displayName in file: 'Project Ownership Changes'
Checking for existing policy with displayName: 'Project Ownership Changes' in project 'my-project'...
Policy with displayName 'Project Ownership Changes' found with ID: projects/my-project/alertPolicies/9636709102347275070
Monitoring Policy 'projects/my-project/alertPolicies/9636709102347275070' from 'samples/gcloud/alerts/projectOwnershipChange.yaml' updated successfully in project 'my-project'.
=========================================
Script finished successfully.
...
```

## Developing a new monitoring alert for the library

If this library doesn't contain a monitoring alert that matches your use case, you can develop a new one using the [Adding Monitoring Alert Guide](./docs/adding_monitoring_alert.md).
