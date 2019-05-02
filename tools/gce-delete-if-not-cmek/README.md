# Ensure CMEK for new VM Instances

This Cloud Function detects newly created VM Instances that have disks attached
with a Google-managed encryption key attached and then immediately deletes
any such VM instances.

## Overview of Solution

This solution:

1. Exports StackDriver log events of VM Instance creation to Cloud Pub/Sub
1. Has a Cloud Funciton which subscribes to these events and then:
    1. Checks each disk attached to the VM Instance
    1. If all disks are encrypted with a CMEK key, does nothing
    1. If any disk attached to the VM instance is not encrypted with a CMEK key, deletes the VM instance

## Setup

### Step 1: Create a Cloud Pub/Sub Topic

Create a Cloud Pub/Sub topic using [the gcloud command](https://cloud.google.com/pubsub/docs/admin#pubsub-create-topic-cli)
or through [the Cloud Console](https://cloud.google.com/pubsub/docs/quickstart-console#create_a_topic).
The rest of the instructions here assume the topic's name is `vm-creations`.

### Step 2: Configure Stackdriver Logging Export to Cloud Pub/Sub Topic

Following [the guide on Exporing Logs to Cloud Pub/Sub](https://cloud.google.com/logging/docs/export/configure_export_v2),
publish the logs matching the following filter to the Cloud Pub/Sub topic
created in the last step.

```ini
resource.type="gce_instance"
jsonPayload.event_subtype="compute.instances.insert"
jsonPayload.event_type="GCE_OPERATION_DONE"
```

### Step 3: Deploy Cloud Function

From the directory holding the source code from this folder, use the following
`gcloud` command to deploy the Cloud Function. Be sure to replace `vm-creations`
with the name of the Cloud Pub/Sub topic you created above.

```shell
gcloud functions deploy check-cmek --runtime go111 --trigger-topic vm-creations --entry-point RecieveMessage --timeout 240
```
