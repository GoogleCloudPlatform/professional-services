# Custom Organization Policy Library
## [Sample Constraints](./docs/index.md#sample-constraints)

This repo contains a library of Custom Urganization Policies constraints and samples. It contains tools to easily generate policies for further provisionning for organization using Gcloud or Terraform.
For information on Custom Organization Policies (CuOP), to secure your environment, see the [Google Cloud documentation](./https://cloud.google.com/resource-manager/docs/organization-policy/creating-managing-custom-constraints).

## Setting up environment 
You can easily set up a new CuOP library matching various by using [ytt](https://carvel.dev/ytt/). 

Install binaries via Homebrew (macOS or Linux) 

Require Homebrew to be installed
```
$ brew tap carvel-dev/carvel
$ brew install ytt
$ ytt version
```

For other type of installation, please refer to official documentation [here](https://carvel.dev/ytt/docs/latest/install/)

## Generating 

### 1. Set configuration 

Configuration specific to an organization such as organization id, bundles to enabled, custom parameters to use for constraints can be defined in the `values.yaml` file.
 - **organization**
   - this refers to the **organization ID** in GCP
 - **pci-dss**
   - stands for **Payment Card Industry Data Security Standard**
 - **cis**
   - stands for **Center for Internet Security**

Example of values.yaml
```
organization: '11111111'
bundles:
 pci-dss: false
 cis: false
dryrun: false
```



### 2. Generate policies and constraints

To generate Policies and Constraints use the following command
```
make build
```

## Provisionning


### Available Commands

```
make constraints                    Build constraints based on input configuration
make policies                       Build policies based on input configuration
make build                          Build constraint and policies based on input configuration
make deploy-constraint              Build deploy constraint based on input configuration
make deploy-policy                  Build deploy policy based on input configuration
make deploy                         Build deploy based on input configuration
make clean                          Get rid of object and execuatable files
make config                         Inline Rego rules into constraint templates
make format                         Format yaml and starlark files
make help                           Prints help for targets with comments
make test                           Test custom organization policies
```

## Using dry-run mode

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


    
## Developing a CuOP constraint

If this library doesn't contain a constraint that matches your use case, you can develop a new one using the [Constraint Template Authoring Guide](./docs/adding_cuop.md).
