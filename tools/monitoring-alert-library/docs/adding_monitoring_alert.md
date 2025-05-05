# Adding Monitoring Alert to the library

## Overview

This document guides you through creating and implementing monitoring alerts in Google Cloud Platform to detect unexpected changes across your projects.

These modules ensure adherence to security best practices. When a unexpected and critical events happens, an incident alert is created in Cloud Monitoring.

### Why adding monitoring alerts?

Monitoring alert allow you to detect configurations changes across your organization using logs generated in Cloud Logging (e.g Audit logs, networking logs ...)
For example, you can create a monitoring alert that notifies security team when ownership about a project is changed

## Steps

### 1. Monitoring Alert Definition

#### Create a new YAML file

- If a relevant monitoring alert doesn't exist, create a new `.yaml` file within an appropriate folder under the `build/alerts` directory in your local repository.
- Copy an existing monitoring alert and modify it for your specific requirements (e.g. <https://cloud.google.com/logging/docs/alerting/log-based-alerts#policy_specifics>)

#### Edit the monitoring alert file

Update the following properties within the .yaml file:

- *displayName*: Specify the display name of the alert
- *documentation*: Briefly describe the purpose of the monitoring alert. Format markdown can be used for this documentation.
- *conditions*: Filter in conditionMatchedLog contains the log filter used to raise an alert when this specific log pattern is detected

Example of a monitoring alert:

```yaml
#@ load("/alert.lib.star", "build_alert")
#@ load("/alert.lib.yaml", "generate_notification_channels")
#@ load("@ytt:template", "template")
#@ alert = build_alert("projectOwnershipChange")

#@ if alert.to_generate():
displayName: 'Project Ownership Changes'
documentation:
  content: >-
    Log-based alerting policy in project ${project} detected a project ownership assignments or changes.
    ```
    (protoPayload.serviceName="cloudresourcemanager.googleapis.com")
    AND (ProjectOwnership OR projectOwnerInvitee)
    OR (protoPayload.serviceData.policyDelta.bindingDeltas.action="REMOVE"
    AND protoPayload.serviceData.policyDelta.bindingDeltas.role="roles/owner")
    OR (protoPayload.serviceData.policyDelta.bindingDeltas.action="ADD"
    AND protoPayload.serviceData.policyDelta.bindingDeltas.role="roles/owner")
    ```
  mimeType: text/markdown
conditions:
  - displayName: 'Log match condition: project ownership changes'
    conditionMatchedLog:
      filter: >-
        (protoPayload.serviceName="cloudresourcemanager.googleapis.com")
        AND (ProjectOwnership OR projectOwnerInvitee)
        OR (protoPayload.serviceData.policyDelta.bindingDeltas.action="REMOVE"
        AND protoPayload.serviceData.policyDelta.bindingDeltas.role="roles/owner")
        OR (protoPayload.serviceData.policyDelta.bindingDeltas.action="ADD"
        AND protoPayload.serviceData.policyDelta.bindingDeltas.role="roles/owner")
combiner: OR
#@ if alert.has_notification_channels():
_: #@ template.replace(generate_notification_channels())
#@ end
alertStrategy:
  notificationRateLimit:
    period: 300s
  autoClose: 604800s
#@ end
```

#### Monitoring Alerts with parameters

For monitoring alerts with parameters that require additional validation, there are 3 files to be added or updated:

- schema
- monitoring alert
- values

##### Schema in `schema.<service>.yaml`

Schema file example **(build/config/schema.yaml)**

- Check if the name of your monitoring alert yaml file is available in the `schema.yaml`. If not, add your monitoring alert name in the schema file and follow the example below
- Ensure your monitoring alert YAML file name is listed in the `schema.yaml` file. If not, add it using the appropriate format
- Add validations if needed (e.g. enforce a minimum number of labels of at least one  for a parameter named labels)

Here is an example of schema for a monitoring alert:

```yaml
alerts:
  projectOwnershipChange:
    #@schema/validation one_of=["default", "skip", "include"]
    generation: "default"
    bundles:
      pci-dss: false
      cis: false
```

##### Monitoring Alert file

Create the monitoring alert file and define the monitoring alert condition that is expected.

```yaml
#@ load("/alert.lib.star", "build_alert")
#@ load("/alert.lib.yaml", "generate_notification_channels")
#@ load("@ytt:template", "template")
#@ alert = build_alert("projectOwnershipChange")

#@ if alert.to_generate():
displayName: 'Project Ownership Changes'
documentation:
  content: >-
    Log-based alerting policy in project ${project} detected a project ownership assignments or changes.
    ```
    (protoPayload.serviceName="cloudresourcemanager.googleapis.com")
    AND (ProjectOwnership OR projectOwnerInvitee)
    OR (protoPayload.serviceData.policyDelta.bindingDeltas.action="REMOVE"
    AND protoPayload.serviceData.policyDelta.bindingDeltas.role="roles/owner")
    OR (protoPayload.serviceData.policyDelta.bindingDeltas.action="ADD"
    AND protoPayload.serviceData.policyDelta.bindingDeltas.role="roles/owner")
    ```
  mimeType: text/markdown
conditions:
  - displayName: 'Log match condition: project ownership changes'
    conditionMatchedLog:
      filter: >-
        (protoPayload.serviceName="cloudresourcemanager.googleapis.com")
        AND (ProjectOwnership OR projectOwnerInvitee)
        OR (protoPayload.serviceData.policyDelta.bindingDeltas.action="REMOVE"
        AND protoPayload.serviceData.policyDelta.bindingDeltas.role="roles/owner")
        OR (protoPayload.serviceData.policyDelta.bindingDeltas.action="ADD"
        AND protoPayload.serviceData.policyDelta.bindingDeltas.role="roles/owner")
combiner: OR
#@ if alert.has_notification_channels():
_: #@ template.replace(generate_notification_channels())
#@ end
alertStrategy:
  notificationRateLimit:
    period: 300s
  autoClose: 604800s
#@ end
```

##### Values in `values.yaml`

Add the monitoring alert parameters (if any) in the `value.yaml` file. Those value are used by the build step to generate final monitoring alerts in the `samples` folder.

Example:

```yaml
alerts:
  projectOwnershipChange: {}
```

### 2. Generate monitoring alerts

Use command `make build` automatically generate the monitoring alerts.
The files generated are in the folder `samples`. At this moment, the output generated can be verified and tested.
Use command `make deploy` command to deploy the custom monitoring alerts
