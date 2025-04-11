# Adding Custom Module to the library

## Overview

This document guides you through creating and implementing custom modules for SHA in Google Cloud Platform to detect unexpected configurations across your projects. 
These modules ensure adherence to security best practices, resource management guidelines, and other organizational requirements. When a drift with expected configuration is detected, a finding in Security Command Center is created.

**Custom Module for Security Health Analytics is available only with the Security Command Center Premium tier.**

### Why adding custom modules ?

#### 1. Enforce security best practices:
Custom modules allow you to detect  configurations drift across your organization. This ensures all projects and resources adhere to a baseline level of security, reducing the risk of vulnerabilities and breaches. 
For example, you can create a custom module that ensure that Cloud Run services and jobs are not using default service account.

#### 2. Maintain consistency:
Custom modules help you standardize resource configurations across projects, promoting consistency and simplifying management. This can be crucial for large organizations with many projects.
For example, you might define a custom module that detects the usages of specific machine types to optimize resource usage and cost.

#### 3. Facilitate compliance:
Many industries are subject to compliance regulations that dictate specific data security and resource management practices. Custom modules can be used to ensure your GCP environment adheres to these regulations.
For example, an organization might requires logging to be enables for VPC Flows logs, health checks, firewall rules.

Custom modules act as an easy way to detect drift and non compliant resources for your GCP environment, ensuring security, consistency, efficiency, and compliance. 
They provide a foundation for ensuring a well-managed and secure cloud infrastructure.

## Steps

### 1. Custom Module Definition

#### Create a new YAML file in the service subfolder

- If a relevant custom module doesn't exist, create a new `.yaml` file within an appropriate subfolder (gke, compute, cloudsql, etc.) under the `build/custom-sha` directory in your local repository.
- The filename is used as display name of the custom module once deployed to the organization.
- Copy an existing custom module and modify it for your specific requirements (e.g. https://cloud.google.com/security-command-center/docs/custom-modules-sha-code)

#### Edit the custom module file

Update the following properties within the .yaml file:

- *severity*: Specify the default severity for the findings that are created by this module. Commonly used values for the severity property are LOW, MEDIUM, HIGH, and CRITICAL. 
- *description*: Briefly describe the purpose of the custom module.
- *recommendation*: Briefly describe the guidance for remediating the detected issue.
- *resource_types*: Specify the GCP resource types the custom module applies to (e.g. `container.googleapis.com/Cluster`, `run.googleapis.com/Service`)
- *expression*: Define the condition that must be met for the custom module to detect a drift (e.g `resource.spec.template.spec.serviceAccountName.endsWith("@developer.gserviceaccount.com")`)

Example of a custom module:
``` 
#@ load("/sha.lib.star", "build_sha")
#@ sha = build_sha("cloudrunDisableServiceDefaultServiceAccount")

#@ if sha.to_generate():
severity: MEDIUM
description: "Detect if default service accounts are used by Cloud Run services"
recommendation: "Ensure only authorized non-default service accounts are used by Cloud Run services"
resource_selector:
  resource_types:
  - run.googleapis.com/Service
predicate:
  expression: resource.spec.template.spec.serviceAccountName.endsWith("@developer.gserviceaccount.com")
#@ end
```

#### Custom Modules with parameters
For custom modules with parameters that require additional validation, there are 3 files to be added or updated: 
- schema
- custom module
- values

##### Schema in schema.<service>.yaml
Schema file example **(build/config/services/schema.compute.yaml)** which can be found under the services folder
- Depending on the custom module, open the related schema file. (`schema.compute.yaml`, `schema.gke.yaml`, etc.)
- Check if the name of your custom module yaml file is available in the `schema.<service>.yaml`. If not, add your custom module name in the schema file and follow the example below 
- Ensure your custom module YAML file name is listed in the `schema.<service>.yaml` file. If not, add it using the appropriate format/
- Add validations if needed (e.g. enforce a minimum number of labels of at least one  for a parameter named labels)

Here is an example of schema for a custom module:
```
cloudresourcemanager:
  cloudresourcemanagerRequiredProjectLabels:
    #@schema/validation one_of=["default", "skip", "include"]
    generation: "default"
    bundles:
      pci-dss: false
      cis: false
    params:
      #@schema/validation min_len=1
      labels:
      - ""
```

##### Custom Module file
Create the custom module file and define the custom module condition that is expected.

```
#@ load("/sha.lib.star", "build_sha")
#@ sha = build_sha("cloudresourcemanagerRequiredProjectLabels")

#@ def expression(labels):
#@   return '(!' + str(labels) + '.all(required_label, resource.labels.exists(label, label.matches(required_label))))'
#@ end

#@ if sha.to_generate():
severity: LOW
description: "Detect if project is missing required labels"
recommendation: "Ensure project has required labels"
resource_selector:  
  resource_types:  
  - cloudresourcemanager.googleapis.com/Project
predicate:  
  expression: #@  expression(sha.params().labels)
#@ end
```

##### Values in values.yaml
Add the custom module parameters (if any) in the `value.yaml` file. Those value are used by the build step to generate final custom modules in the `samples` folder.

Example:
```
cloudresourcemanager:
  cloudresourcemanagerRequiredProjectLabels:
    params:
      labels:
      - "bu"
      - "app"
      - "env"
```

### 2. Generate custom modules
Use command `make build` automatically generate the custom modules.
The files generated are in the folder `samples`. At this moment, the output generated can be verified and tested.
Use command `make deploy` command to deploy the custonm custom modules

