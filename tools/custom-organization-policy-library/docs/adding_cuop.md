# Adding Custom Organization Policy to the library

## Overview

This document guides you through creating and implementing custom organization policies in Google Cloud Platform to enforce specific configurations across your projects. 
These policies ensure adherence to security best practices, resource management guidelines, and other organizational requirements.

### Why adding constraints and policies ?

#### 1. Enforce security best practices:
Constraints and policies allow you to define mandatory security configurations across your organization. This ensures all projects and resources adhere to a baseline level of security, reducing the risk of vulnerabilities and breaches. For example, you can create a custom organization policy that enforces encryption of all disks by default, preventing accidental exposure of sensitive data.

#### 2. Maintain consistency:
Policies help you standardize resource configurations across projects, promoting consistency and simplifying management. This can be crucial for large organizations with many projects.
For example, you might define a policy that restricts the creation of specific machine types to optimize resource usage and cost.

#### 3. Facilitate compliance:
Many industries are subject to compliance regulations that dictate specific data security and resource management practices. Constraints and policies can be used to ensure your GCP environment adheres to these regulations.
For example, a healthcare organization might have a policy requiring all patient data to be stored in specific regions with stringent access controls.

In summary, constraints and policies act as a guardrail for your GCP environment, ensuring security, consistency, efficiency, and compliance. They provide a foundation for building a well-managed and secure cloud infrastructure.

## Prerequisites

Custom organization policies consist of two components:

- Constraints (YAML files): 
Define the policy rules that specify allowed or restricted resource configurations.

- Policies (YAML files): 
Bind a constraint to specific projects or folders within your GCP organization, determining where the enforcement applies.

## Steps

### 1. Constraint Definition

#### Create a new YAML file in the service subfolder

- If a relevant constraint doesn't exist, create a new `.yaml` file within an appropriate subfolder (gke, compute, firewall, etc.) under the `build/custom_constraints` directory in your local repository.
= Copy an existing constraint and modify it for your specific requirements (e.g. https://cloud.google.com/compute/docs/access/custom-constraints#vm-instance)

#### Edit the constraint file

Update the following properties within the .yaml file:

- *resource_types*: Specify the GCP resource types the constraint applies to (e.g. `container.googleapis.com/Cluster`)
- *condition*: Define the condition that must be met for the constraint to be satisfied (e.g `resource.binaryAuthorization.evaluationMode == 'DISABLE'`)
- *action_type*: Indicate the enforcement action (e.g., `DENY`, `ALLOW`).
- *method_types*: Define the methods affected by the constraint (Example: `CREATE` or `UPDATE`).
- *display_name*: Provide a user-friendly name for the constraint.
- *description*: Briefly describe the purpose of the constraint.

Example of a custom constraint:
``` 
#@ load("/constraints.lib.star", "build_constraint")
#@ constraint = build_constraint("gkeRequireConfidentialNodes")


#@ if constraint.to_generate():
name: #@ constraint.constraint_name()
resource_types:
- container.googleapis.com/Cluster
condition: resource.confidentialNodes.enabled == false
action_type: DENY
method_types:
- CREATE
- UPDATE
display_name: Require confidential nodes
description:  Enforce that the GKE clusters is using confidential nodes
#@ end
```

#### Constraints with parameters

For constraints with parameters that require additional validation, there are 3 files to be added or updated: 
- schema
- constraint
- values

##### Schema in schema.<service>.yaml
Schema file example **(build/config/services/schema.compute.yaml)** which can be found under the services folder
- Depending on the constraint, open the related schema file. ( schema.compute.yaml, schema.gke.yaml, etc.)
- Check if the name of your constraint yaml file is available in the schema.<service>.yaml. If not, add your constraint name in the schema file and follow the example below 
- Ensure your constraint YAML file name is listed in the schema.<service>.yaml file. If not, add it using the appropriate format/
- Add validations if needed (e.g. enforce a minimum length of 1 character for a parameter named allowedDiskType)

Here is an example of schema for a constraint:
```
computeAllowedDiskTypes:
   #@schema/validation one_of=["default", "skip", "include", "skip-policy"]
   generation: "default"
   bundles:
     pci-dss: false
     cis: false
   params:
     #@schema/validation min_len=1
     disk_types:
     - ""
```

##### Constraint file
Create the constraint file and define the constraint condition that is expected.

```
#@ def condition(labels):
#@   return "resource.labels.all(label, (label in " + str(labels) + ")) == false"
#@ end


#@ if constraint.to_generate():
name: #@ constraint.constraint_name()
resource_types: compute.googleapis.com/Instance
condition: #@  condition(constraint.params().labels)
action_type: DENY
method_types: CREATE
display_name: Allow only specific labels
description:  "Prevent the creation of VMs not having the expected labels"
#@ end
```

##### Values in values.yaml 
Add the constraint parameters (if any) in the value.yaml file. Those value are used by the build step to generate final constraints in the `samples` folder.

Example:
```
computeAllowedInstanceLabels:
   params:
     labels:
     - "label-0"
     - "label-1"
```

### 2. Generate constraints and policies 
Use command `make constraints` automatically generate the constraint.
Use command `make policies` automatically generate the constraint.
Use command `make build` command to generate both custonm constraints and policy.

The files generated are in the folder `samples`. At this moment, the output generated can be verified and tested.

### 3. Deploy
Use command `make deploy` to provision the constraint and policies to your environment.

### 4. Test
Refer to [test documentation](../test/README.md) for more information how to write and run test cases.