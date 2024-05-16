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
```

Once you have initialized a library, you might want to save it to [git](./docs/user_guide.md#https://github.com/GoogleCloudPlatform/policy-library/blob/master/docs/user_guide.md#get-started-with-the-policy-library-repository).

### 2. Generate policies and constraints

To generate Policies and constraints use the following command
```
make build
```

## Provisionning


### Available Commands

```
make constraints                    Build constraint based on input configuration
make policies                       Build constraint based on input configuration
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

To use dry run mode, Users will need to go to the **Organization policies** page in **Google cloud console**.

1. From the project picker, select the resource for which you want to set the organization policy.
2. Select the Restrict **Resource Service Usage** constraint from the list on the Organization policies page.
3. Select the **Dry run** tab.
4. Click **Manage dry run policy**.
5. On the **Edit dry run policy** page, select **Override parent's policy**.
6. Under **Policy enforcement**, click **Replace**.
7. Click **Add rule**.
8. From **Policy values**, select **Custom**.
9. From **Policy type**, select **Deny**.
10. In the **Custom values** box, enter compute.googleapis.com, and then click **Done**.
11. If this is a custom constraint, you can click **Test changes** to simulate the effect of this organization policy. For more information, see [Test organization policy changes with Policy Simulator](https://cloud.google.com/policy-intelligence/docs/test-organization-policies).
12. To enforce the organization policy in dry-run mode, click **Set dry run policy**. You can also set the live policy by clicking **Set policy**.

To create an organization policy in dry-run mode using **gcloud**, create a YAML file that defines the constraint with **dryRunSpec**. For example:
```
name: //policies/gcp.restrictServiceUsage
  dryRunSpec:
    rules:
      values:
        denied_values:
        - compute.googleapis.com

```
## Scripts available

- deploy.sh

  - A universal deployment script that facilitate and deploy your code, file and configuration to multiple servers via ssh

- format-policies.sh
 
   - Ensure the files are in correct formats

- gen.rb

   - Construct the core data structure and generate the default values, constraints and yaml files
    
## Developing a CuOP constraint

If this library doesn't contain a constraint that matches your use case, you can develop a new one using the [Constraint Template Authoring Guide](./docs/adding_cuop.md).
