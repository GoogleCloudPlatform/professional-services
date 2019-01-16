# Unlabelled Resources

This directory comprises an example Terraform module which invokes the
[root module](root-module) to provision an automatic labelling system and then
creates an unlabelled Compute Engine VM instance in order to verify that a
label is automatically applied.

## Requirements

### APIs

The following APIs must be enabled for the project in which the resources will be provisioned:

- Compute Engine API

The [root module required APIs][root-module-required-apis] must also be
enabled.

### Roles

The following roles must be assigned to the account which will be provisioning
the infrastructure:

- Compute Admin

The [root module required roles][root-module-required-roles] must also be
assigned.

[root-module]: ../../
[root-module-required-apis]: ../../README.md#APIs
[root-module-required-roles]: ../../README.md#Roles
