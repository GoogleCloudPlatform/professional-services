# Terraform Config Validator Policy Library

This repo contains a library of constraint templates and sample constraints to be used for Terraform resource change requests. If you're looking for the CAI variant, please see [Config Validator](https://github.com/lykaasegura/w-secteam-repo).

Everything in this repository has been developed as a parallel to CAI Config Validator. The difference is that the Constraint/Template schemas target `validation.resourcechange.terraform.cloud.google.com` instead of `validation.gcp.forsetisecurity.org`. This ensures that the policies only target terraform resource changes, instead of the entire CAI metadata library from a project, folder, or organization. Use this when you intend to validate changes, rather than declaratively manage a GCP cloud environment.

## User Guide

See [docs/user_guide.md](docs/user_guide.md) for information on how to use this library.

See [docs/functional_principles.md](docs/functional_principles.md) for information on how to **develop** your own policies to use with `gcloud beta terraform vet`.

## Creating Policies in the Constraint Framework

This library is set up in the **Constraint Framework** style. This means that we utilize Gatekeeper Constraints and ConstraintTemplates to interpret and apply rego logic to incoming terraform change resources. This can be challenging to understand at first, so please refer to the [functional principles](docs/functional_principles.md) documentation found in the `docs` folder.

## General Differences

This library is intended to validate terraform plan resources. Therefore, as mentioned, the target has been swapped from `validation.gcp.forsetisecurity.org` to `validation.resourcechange.terraform.cloud.google.com`. This also means that the Constraint and ConstraintTemplate definitions have also had to be changed from Gatekeeper API version `v1alpha1` to `v1beta1`, as this functionality is currently under development. As a result, the Rego policy language has also had to change. If you user CAI Constraints and Templates (ie. v1apha1 Constraints/Templates), those inlined Rego policies **will not work.**

You can check out documentation on how to create terraform policies in the [`gcloud terraform beta vet` documentation](https://cloud.google.com/docs/terraform/policy-validation/create-terraform-constraints).

## Working with this policy library

The operation of this library is similar with the CAI library, as the development flow with Make and other tools has proven to be quite efficient and helpful. Therefore, you can check the [user guide](docs/user_guide.md) for relevant documentation required to get this library working for your needs.

### Initializing a policy library

You can easily set up a new (local) policy library by downloading a [bundle](./docs/index.md#policy-bundles) using [kpt](https://kpt.dev/).

Download the full policy library and install the [Forseti bundle](./docs/bundles/forseti-security.md):

```
export BUNDLE=forseti-security
kpt pkg get https://github.com/GoogleCloudPlatform/policy-library.git ./policy-library
kpt fn source policy-library/samples/ | \
  kpt fn eval - --image gcr.io/config-validator/get-policy-bundle:latest -- bundle=$BUNDLE | \
  kpt fn sink policy-library/policies/constraints/$BUNDLE
```

Once you have initialized a library, you might want to save it to [git](./docs/user_guide.md#https://github.com/GoogleCloudPlatform/policy-library/blob/master/docs/user_guide.md#get-started-with-the-policy-library-repository).

### Developing a Constraint

If this library doesn't contain a constraint that matches your use case, you can develop a new one
using the [Constraint Template Authoring Guide](docs/functional_principles.md).

#### Available Commands

```
make audit                          Run audit against real CAI dump data
make build                          Format and build
make build_templates                Inline Rego rules into constraint templates
make format                         Format Rego rules
make help                           Prints help for targets with comments
make test                           Test constraint templates via OPA
```

#### Inlining

You can run `make build` to automatically inline Rego rules into your constraint templates.

This is done by finding a `INLINE("filename")` and `#ENDINLINE` statements in your yaml,
and replacing everything in between with the contents of the file.

For example, running `make build` would replace the raw content with the replaced content below

Raw:

```
#INLINE("my_rule.rego")
# This text will be replaced
#ENDINLINE
```

Replaced:

```
#INLINE("my_rule.rego")
#contents of my_rule.rego
#ENDINLINE
```

#### Linting Policies

Config Validator provides a policy linter.  You can invoke it as:

```
go get github.com/GoogleCloudPlatform/config-validator/cmd/policy-tool
policy-tool --policies ./policies --policies ./samples --libs ./lib
```

#### Local CI

You can run the cloudbuild CI locally as follows:

```
gcloud components install cloud-build-local
cloud-build-local --config ./cloudbuild.yaml --dryrun=false .
```

#### Updating CI Images

You can update the CI images to add new versions of rego/opa as they are released.

```
# Rebuild all images.
make -j ci-images

# Rebuild a single image
make ci-image-v1.16.0
```
