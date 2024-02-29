# Custom Organization Policy Library
## [Sample Constraints](./docs/index.md#sample-constraints) | [Bundles](./docs/index.md#policy-bundles)

This repo contains a library of Custom Urganization Policies constraints and samples. It contains tools to easily generate policies for further provisionning for organization using Gcloud or Terraform.
For information on Custom Organization Policies (CuOP), to secure your environment, see the [Google Cloud documentation](./https://cloud.google.com/resource-manager/docs/organization-policy/creating-managing-custom-constraints).

## Setting up environment 
You can easily set up a new CuOP library matching various by using [ytt](https://carvel.dev/ytt/). 

Install binaries via Homebrew (macOS or Linux) 
```
$ brew tap carvel-dev/carvel
$ brew install ytt
$ ytt version
```

For other type of installation, please refer to official documentation [here](https://carvel.dev/ytt/docs/latest/install/)

## Generating 

### 1. Set configuration 

Configuration specific to an organization such as organization id, bundles to enabled, custom parameters to use for constraints can be defined in the `values.yaml` file.

Example of values.yaml
```
organization: '3333334'
bundles:
  pci-dss: false
  cis: false
```

Once you have initialized a library, you might want to save it to [git](./docs/user_guide.md#https://github.com/GoogleCloudPlatform/policy-library/blob/master/docs/user_guide.md#get-started-with-the-policy-library-repository).

### 2, Generate policies and constraints

```
make build
```

## Provisionning


### Available Commands

```
make constraints                    Build constraint based on input configuration
make policies                       Build constraint based on input configuration
make build                          Build constraint and policies based on input configuration
make config                         Inline Rego rules into constraint templates
make format                         Format yaml and starlark files
make help                           Prints help for targets with comments
make test                           Test custom organization policies
```

## Developing a CuOP constraint

If this library doesn't contain a constraint that matches your use case, you can develop a new one using the [Constraint Template Authoring Guide](./docs/adding_cuop.md).