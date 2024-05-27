# Adding Custom Organization Policies to Google Cloud Platform (GCP)

## Overview

This document guides you through creating and implementing custom organization policies in GCP to enforce specific configurations across your projects. These policies ensure adherence to security best practices, resource management guidelines, and other organizational requirements.

### Why we need constraints and policies

#### 1. Enforce Security Best Practices:
Constraints and policies allow you to define mandatory security configurations across your organization. This ensures all projects and resources adhere to a baseline level of security, reducing the risk of vulnerabilities and breaches. For example, you can create a custom organization policy that enforces encryption of all disks by default, preventing accidental exposure of sensitive data.

#### 2. Maintain Resource Consistency and Efficiency:
Policies help you standardize resource configurations across projects, promoting consistency and simplifying management. This can be crucial for large organizations with many projects.
For example, you might define a policy that restricts the creation of specific machine types to optimize resource usage and cost.

#### 3. Reduce Human Error and Misconfiguration:
By automating configuration enforcement, constraints and policies minimize the risk of human error leading to misconfigured resources. This improves overall reliability and security.

#### 4. Facilitate Compliance with Regulations:
Many industries are subject to compliance regulations that dictate specific data security and resource management practices. Constraints and policies can be used to ensure your GCP environment adheres to these regulations.
For example, a healthcare organization might have a policy requiring all patient data to be stored in specific regions with stringent access controls.

#### 5. Promote Collaboration and Governance:
Policies create a clear set of rules for resource usage within your organization, fostering better collaboration and governance. Everyone involved in GCP projects understands the expectations and limitations.
This can be especially helpful for new team members or those unfamiliar with specific resource types or configurations.

In summary, constraints and policies act as a guardrail for your GCP environment, ensuring security, consistency, efficiency, and compliance. They provide a foundation for building a well-managed and secure cloud infrastructure.


## Prerequisites

An active GCP project with the Resource Manager API enabled.
The gcloud command-line tool installed and configured with your GCP project.
Understanding Custom Organization Policies

Custom organization policies consist of two components:

- Constraints (YAML files): 
Define the policy rules that specify allowed or restricted resource configurations.

- Policies (YAML files): 
Bind a constraint to specific projects or folders within your GCP organization, determining where the enforcement applies.

## Steps

### 1. Define the Constraint (YAML file):

#### Create a new YAML file 

If a relevant constraint doesn't exist, create a new .yaml file within an appropriate subfolder (gke, compute, firewall, etc.) under the custom_constraints directory in your local repository.

Copy an existing constraint (optional): For guidance, copy an existing constraint file and modify it for your specific requirements.

#### Edit the constraint file

Update the following properties within the .yaml file:

- *resource_types*: Specify the GCP resource types the constraint applies to (example: “container.googleapis.com/Cluster”)

- *condition*: Define the condition that must be met for the constraint to be satisfied (Example: resource.binaryAuthorization.evaluationMode == 'DISABLE')

- *action_type*: Indicate the enforcement action (e.g., DENY, AUDIT).
- *method_types*: Define the methods affected by the constraint (Example: CREATE or UPDATE).
- *display_name*: Provide a user-friendly name for the constraint.
- *description*: Briefly describe the purpose of the constraint.


Example of a custom constraint
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

#### Constraints with Parameters

For constraints with parameters that require additional validation, follow these steps:

There are 3 files to be added or updated: schema, constraints and values 

Schema file example **(/home/user/professional-services/tools/custom-organization-policy-library/build/config/services/schema.compute.yaml)** which can be found under the services folder

Depending on the constraint, open the related schema file. ( schema.compute.yaml, schema.gke.yaml, etc.)

Check if the name of your constraint yaml file is available in the schema.resource.yaml. Otherwise, add your constraint name in the schema file and follow the example below 


##### Schema File:

Depending on the constraint, open the related schema file. ( schema.compute.yaml, schema.gke.yaml, etc.)

Check if the name of your constraint yaml file is available in the schema.resource.yaml. Otherwise, add your constraint name in the schema file and follow the example below 
Locate the schema file corresponding to the constraint service (example: schema.compute.yaml or schema.gke.yaml) within the services directory.

Ensure your constraint YAML file name is listed in the schema.resource.yaml file. If not, add it using the appropriate format (refer to the existing schema for guidance).
Add Validations:

Edit the schema file and define validations for your constraint parameters. For example, to enforce a minimum length of 1 character for a parameter named allowedDiskType.

```
Example: 
computeAllowedDiskTypes:
   #@schema/validation one_of=["default", "skip", "include"]
   generation: "default"
   bundles:
     pci-dss: false
     cis: false
   params:
     #@schema/validation min_len=1
     disk_types:
     - ""
```

##### Constraints file 
Create new lines from Line 3 in the yaml. constraint file to define the custom constraint condition and call the parameter values at condition. (Put link for example) 

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

##### Values file 
Finally, add the resource parameters that you want to restrict in the value.yaml file.
Example:

```
computeAllowedInstanceLabels:
   params:
     labels:
     - "label-0"
     - "label-1"
```


### 2. Define the Policy (YAML file):

Create a new YAML file: Create a separate .yaml file in your local repository to define the policy that binds the constraint to specific projects or folders.


#### Policy content: 

Include the following properties in the policy file:

- *name*: A unique name for the policy that references project ID and the previously defined constraint file (Example: custom.gkeRequireLogging).
Ensure that the rules are set to true to enforce the policies in your GCP. 

Example of a policy
```
name: organizations/11111111/policies/custom.gkeAllowedReleaseChannels
spec:
  rules:
  - enforce: true
```

### 3. Generate and Set Constraints and Policies (Optional):

#### Generate constraints and policies: 
Use the make constraints command within the custom_constraints directory to automatically generate the constraint or make build command to generate custonm constraints and policy files.

#### Set custom constraint (GCP Console): 
Navigate to the Organization policies page in the GCP Console, select Add constraint, provide necessary details, and upload the constraint file.

#### Set custom policy (GCP Console):
In the Organization policies page, select Add policy, specify the policy details, and upload the policy file.

### 4. Add New Custom Constraints to the Repository:

#### Commit and push changes: 
Once you've defined the constraints and policies in your local repository, stage the changes and commit them to your version control system (e.g., Git). Push the changes to your remote repository on GitHub.

