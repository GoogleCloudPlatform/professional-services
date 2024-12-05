Copyright 2023 Google LLC

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

     http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.

## Overview
This is meant to be a lightweight module definition that calls a project-factory module to create projects using a *Infrastructure as Data* paradigm. It relays variables defined in the defaults.yaml file and the project specific .yaml file to the project-factory module. Therefore the variables definition for this is intentionally abstract to facilitate decoupling

## Requirements

The requirements for deploying this depends on the module invocation. Check README.md for respective sources.

## Providers

No providers.

## Modules

| Name | Source | Version |
|------|--------|---------|
| <a name="module_projects"></a> [projects](#module\_projects) | terraform-google-modules/project-factory/google | ~> 14.1 |

## Resources

No resources.

## Inputs

| Name | Description | Type | Default | Required |
|------|-------------|------|---------|:--------:|
| <a name="input_data_dir"></a> [data\_dir](#input\_data\_dir) | Directory relative to the target where .yaml files for projects are stored. | `string` | `"projects/"` | no |
| <a name="input_defaults_file"></a> [defaults\_file](#input\_defaults\_file) | .yaml file that stores default values for projects in target category. | `string` | n/a | yes |

## Outputs

| Name | Description |
|------|-------------|
| <a name="output_projects"></a> [projects](#output\_projects) | Created projects and service accounts. |
